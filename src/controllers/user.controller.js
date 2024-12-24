import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken";
import { generateOtp, sendEmail, cookieOptions } from "../utils/Helper.js";
import { verifyOtpText, WelcomeText } from "../utils/EmailText.js"


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
        [fullName, email, password, phone].some((field) => field?.trim() === "" || field?.trim() == undefined)
    ) {
        throw new ApiError(400, "All field are required")
    }

    if (phone.length !== 10) {
        throw new ApiError(400, "Phone number must be 10 digits")
    }


    const existedUser = await User.findOne({ $or: [{ email }, { phone }] })

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
            const { otp, otpExpiry } = generateOtp()

            sendEmail(email, {
                subject: "Email Verification",
                text: `Your otp is ${otp} from text`,
                body: verifyOtpText(otp)
            })

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

            return res
                .status(200)
                .json(new ApiResponse(200, sanitizedUser, "Verification otp sent to your email"))

        }

    }

    const { otp, otpExpiry } = generateOtp()

    await sendEmail(email, {
        subject: "Email Verification",
        text: `Your otp is ${otp} from text`,
        body: verifyOtpText(otp)
    })

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

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "Verification otp sent to your email"))

})

const verifyOtp = asyncHandler(async (req, res) => {

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

export {
    registerUser,
    verifyOtp,
    loginUser,
    logoutUser
}