import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { clearCookieOptions, cookieOptions, generateOtp, randomPasswordGenerator, sendEmail, validateEmail } from "../utils/Helper.js";
import { Collector } from "../models/collector.model.js";
import { forgotPasswordEmail } from "../utils/EmailText.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const collector = await Collector.findById(userId)
        if (!collector) {
            throw new ApiError(404, "collector not found")
        }
        const accessToken = collector.generateAccessToken()
        const refreshToken = collector.generateRefreshToken()

        collector.refreshToken = refreshToken
        await collector.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerCollector = asyncHandler(async (req, res) => {

    //TODO: Middleware to check admin role

    const { fullName, email, phone, current_address } = req.body

    if (
        [fullName, current_address].some((field) => field?.trim() === "" || field?.trim() == undefined)
    ) {
        throw new ApiError(400, "All field are required")
    }

    if (phone.length !== 10) {
        throw new ApiError(400, "Phone number must be 10 digits")
    }

    if (!validateEmail(email)) {
        throw new ApiError(400, "Invalid email address")
    }

    const existingCollector = await Collector.findOne({ $or: [{ email }, { phone }] })

    if (existingCollector) {
        if (existingCollector.email === email) {
            throw new ApiError(400, "Collector with this email already exists")
        }
        throw new ApiError(400, "Collector with this phone number already exists")
    }

    const password = randomPasswordGenerator()


    const collector = await Collector.create({
        fullName,
        email,
        phone,
        current_address,
        password
    })

    const createdCollector = await Collector.findById(collector._id).select("-password -refreshToken")

    res
        .status(201)
        .json(new ApiResponse(201, createdCollector, "Collector created successfully"))


    const subject = "Collector Registration"
    const text = `Hello ${fullName}, your account has been created successfully. Your password is ${password}. Please login to your account and change your password.`

    const body = `<p>Hello ${fullName},</p> <p>Your account has been created successfully. Your Email is <strong>${email}</strong> and your password is <strong>${password}</strong>. Please login to your account and change your password.</p>`

    sendEmail(email, { subject, text, body })

    return

})

const loginCollector = asyncHandler(async (req, res) => {

    const { identifier, password } = req.body

    if (
        [identifier, password].some((field) => field?.trim() === "" || field?.trim() == undefined)
    ) {
        throw new ApiError(400, "identifier and password is required")
    }

    const collector = await Collector.findOne({ $or: [{ email: identifier }, { phone: identifier }] })

    if (!collector) {
        throw new ApiError(404, "Collector not found")
    }

    const isPasswordCorrect = await collector.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(collector._id)

    collector.firstLogin = false
    await collector.save({ validateBeforeSave: false })


    const loggedInCollector = await Collector.findById(collector._id).select("-password -refreshToken")

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInCollector, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )

})

const logoutCollector = asyncHandler(async (req, res) => {

    const logoutCollector = await Collector.findByIdAndUpdate(
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

    if (!logoutCollector) {
        throw new ApiError(500, "Something went wrong while logging out")
    }


    return res
        .status(200)
        .clearCookie("accessToken", clearCookieOptions)
        .clearCookie("refreshToken", clearCookieOptions)
        .json(new ApiResponse(200, {}, "User logged Out"))


})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    // get old password from the login form and new password from NativeModel( dialog box)
    const { oldPassword, newPassword } = req.body

    if (
        [oldPassword, newPassword].some((field) => field === "" || field?.trim() == undefined)
    ) {
        throw new ApiError(400, "Both Old Password and new password is required")
    }

    if (oldPassword === newPassword) {
        throw new ApiError(400, "Old password and new password must be different")
    }

    const collector = await Collector.findById(req.user?._id)

    if (!collector) {
        throw new ApiError(404, "Collector not found")
    }

    const isPasswordCorrect = await collector.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    collector.password = newPassword
    collector.firstLogin = false
    await collector.save()

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
            "Collector fetched successfully"
        ))
})


const getAllCollectors = asyncHandler(async (req, res) => {

    const collectors = await Collector.find({}).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, collectors, "Collectors fetched successfully"))

})


const refereshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {

        const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_SECRET)

        const collector = await Collector.findById(decoded.id)

        if (!collector) {
            throw new ApiError(404, "Collector not found")
        }

        if (collector.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Invalid refresh token")
        }
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(collector._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})


const resetPassword = asyncHandler(async (req, res) => {
    const { password, otp, email } = req.body;
    const token = req.params.resetToken;

    // console.log(req.params)

    // console.log("token", token)

    if (!password?.trim()) {
        throw new ApiError(400, "Password is required")
    }

    let user;

    if (otp) {
        if (!validateEmail(email)) {
            throw new ApiError(400, "Invalid email address")
        }
        user = await Collector.findOne({ email });

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

            user = await Collector.findById(decoded?._id);

            if (!user) {
                throw new ApiError(404, "User not found")
            }

        } catch (error) {
            console.log(error.message)
            throw new ApiError(400, error?.message || "Invalid reset token")
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

    const user = await Collector.findOne({ email })

    if (!user) {
        throw new ApiError(404, "User not found or not verified")
    }

    const resetToken = user.generateResetPasswordToken();
    const resetLink = `${process.env.CLIENT_URL}/collector/reset-password?token=${resetToken}`;


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
    registerCollector,
    loginCollector,
    logoutCollector,
    changeCurrentPassword,
    getCurrentUser,
    getAllCollectors,
    refereshAccessToken,
    resetPassword,
    forgotPassword
}