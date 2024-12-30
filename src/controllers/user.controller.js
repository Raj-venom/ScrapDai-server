import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken";
import { generateOtp, sendEmail, cookieOptions, validateEmail } from "../utils/Helper.js";
import { forgotPasswordEmail, verifyOtpTextWithIP, WelcomeText } from "../utils/EmailText.js"
import { GENDER } from "../constants.js";


const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "user not found")
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    const { fullName, email, password, phone } = req.body

    if (
        [fullName, password, phone].some((field) => field?.trim() === "" || field?.trim() == undefined)
    ) {
        throw new ApiError(400, "All field are required")
    }

    if (phone.length !== 10) {
        throw new ApiError(400, "Phone number must be 10 digits")
    }

    if (!validateEmail(email)) {
        throw new ApiError(400, "Invalid email address")
    }

    const existedUser = await User.findOne({ $or: [{ email }, { phone }] })
    const { otp, otpExpiry } = generateOtp()

    if (existedUser) {
        if (existedUser.isverified) {
            if (existedUser?.phone === phone.trim()) {
                throw new ApiError(400, "User with this phone number already exist")
            }

            if (existedUser?.email === email.trim()) {
                throw new ApiError(400, "User with this email already exist")
            }
        }

        if (!existedUser.isverified) {

            existedUser.fullName = fullName.trim()
            existedUser.email = email.trim()
            existedUser.password = password.trim()
            existedUser.phone = phone.trim()
            existedUser.otp = otp
            existedUser.otpExpiry = otpExpiry

            await existedUser.save();

            const sanitizedUser = await User.findById(existedUser._id).select(
                "-password -refreshToken -otp -otpExpiry"
            )

            res
                .status(200)
                .json(new ApiResponse(200, sanitizedUser, "Verification otp sent to your email"))

            // const response = await fetch('https://ipinfo.io/json')
            // const userLocationData = await response.json()

            // sendEmail(email, {
            //     subject: "Email Verification",
            //     text: `Your otp is ${otp} from text`,
            //     body: verifyOtpTextWithIP(otp, userLocationData || {})
            // })

            // return

        }

    } else {

        const user = await User.create(
            {
                fullName: fullName.trim(),
                email: email.trim(),
                password: password.trim(),
                phone: phone.trim(),
                otp,
                otpExpiry
            }
        )

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken -otp -otpExpiry"
        )

        if (!createdUser) {
            throw new ApiError(500, "something went wrong while registering the user")
        }

        res
            .status(201)
            .json(new ApiResponse(201, createdUser, "Verification otp sent to your email"))

    }


    const response = await fetch('https://ipinfo.io/json')
    const userLocationData = await response.json()

    sendEmail(email, {
        subject: "Email Verification",
        text: `Your otp is ${otp} from text`,
        body: verifyOtpTextWithIP(otp, userLocationData || {})
    })

    return

})

const verifyUserWithOtp = asyncHandler(async (req, res) => {

    const { email, otp } = req.body

    if (
        [email, otp].some((field) => field?.trim() === "" || field?.trim() == undefined)
    ) {
        throw new ApiError(400, "email and otp is required")
    }

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    if(user.isverified) {
        throw new ApiError(400, "User already verified")
    }

    if (user.otp !== otp) {
        throw new ApiError(400, "Invalid otp")
    }

    if (new Date() > user.otpExpiry) {
        throw new ApiError(400, "otp expired")
    }

    user.isverified = true
    user.otp = undefined
    user.otpExpiry = undefined

    await user.save({ validateBeforeSave: false })

    user.password = undefined
    user.refreshToken = undefined


    await sendEmail(email, {
        subject: "Email Verification",
        text: "Email verified successfully",
        body: WelcomeText()
    })

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Email verified successfully"))

});

const loginUser = asyncHandler(async (req, res) => {

    const { identifier, password } = req.body

    if (
        [identifier, password].some((field) => field?.trim() === "" || field?.trim() == undefined)
    ) {
        throw new ApiError(400, "identifier and password is required")
    }

    const user = await User.findOne({
        $or: [{ email: identifier }, { phone: identifier }]
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    if (!user.isverified) {
        throw new ApiError(400, "User not verified")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken -otp -otpExpiry")

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {

    const logout = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    if (!logout) {
        throw new ApiError(500, "Something went wrong while logouting user")
    }


    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logged Out"))

})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body

    if (
        [oldPassword, newPassword].some((field) => field === "" || field?.trim() == undefined)
    ) {
        throw new ApiError(400, "Both Old Password and new password is required")
    }

    if (oldPassword === newPassword) {
        throw new ApiError(400, "Old password and new password must be different")
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save()

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))


})

const getCurrentUser = asyncHandler(async (req, res) => {

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        ))
})

//TODO: Update Profile Picture
const updateUserProfile = asyncHandler(async (req, res) => {

    const { fullName, phone, gender } = req.body

    if (fullName?.trim() === "") {
        throw new ApiError(400, "Full name is required")
    }

    if (phone?.length !== 10) {
        throw new ApiError(400, "Phone number must be 10 digits")
    }

    if (gender && ![...GENDER].includes(gender.trim())) {
        throw new ApiError(400, "Invalid Gender Option")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName.trim(),
                phone: phone.trim(),
                gender: gender?.trim()
            }
        },
        { new: true }
    ).select("-password -refreshToken -otp -otpExpiry")

    if (!user) {
        throw new ApiError(500, "Something went wrong while updating the user")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User updated successfully"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token expired or used")
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(user?._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const resetPassword = asyncHandler(async (req, res) => {
    const { password, otp, email } = req.body;
    const token = req.params.resetToken;

    console.log("token", token)

    if (!password?.trim()) {
        throw new ApiError(400, "Password is required")
    }

    let user;

    if (otp) {
        if (!validateEmail(email)) {
            throw new ApiError(400, "Invalid email address")
        }
        user = await User.findOne({ email });

        if (!user) {
            throw new ApiError(404, "User not found")
        }

        if (user.otp !== otp) {
            throw new ApiError(400, "Invalid otp")
        }

        if (new Date() > user.otpExpiry) {
            throw new ApiError(400, "otp expired please request for a new one")
        }

    } else {

        try {
            const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
            if (!decoded) {
                throw new ApiError(400, "Invalid reset token")
            }

            user = await User.findById(decoded?._id);

            if (!user) {
                throw new ApiError(404, "User not found")
            }

        } catch (error) {
            console.log(error.message)
            throw new ApiError(400, "Unauthorized Token");
        }

    }

    user.password = password;
    user.otp = undefined;
    user.otpExpiry = undefined;

    const updatedUser = await user.save();

    if (!updatedUser) {
        throw new ApiError(500, "Something went wrong while updating the password")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password reset successfully"))

})


const forgotPassword = asyncHandler(async (req, res) => {

    const { email } = req.body;

    if (!validateEmail(email)) {
        throw new ApiError(400, "Invalid email address")
    }

    const user = await User.findOne({ email })

    if (!user || !user.isverified) {
        throw new ApiError(404, "User not found or not verified")
    }

    const resetToken = user.generateResetPasswordToken();
    const resetLink = `${process.env.CLIENT_URL}/user/reset-password?token=${resetToken}`;


    const { otp, otpExpiry } = generateOtp()

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    const updatedUser = await user.save();

    if (!updatedUser) {
        throw new ApiError(500, "Something went wrong while generating otp")
    }

    res
        .status(200)
        .json(new ApiResponse(200, {}, "Otp sent to your email"))

    const response = await fetch('https://ipinfo.io/json')
    const userLocationData = await response.json()

    await sendEmail(email, {
        subject: "Password Reset",
        text: `Your otp is ${otp}`,
        body: forgotPasswordEmail(resetLink, otp, userLocationData)
    })

    return

});

export {
    registerUser,
    verifyUserWithOtp,
    loginUser,
    logoutUser,
    changeCurrentPassword,
    updateUserProfile,
    getCurrentUser,
    refreshAccessToken,
    resetPassword,
    forgotPassword
}