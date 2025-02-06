import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { randomPasswordGenerator, sendEmail, validateEmail } from "../utils/Helper.js";
import { Collector } from "../models/collector.model.js";


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

    const body = `<p>Hello ${fullName},</p> <p>Your account has been created successfully. Your password is <strong>${password}</strong>. Please login to your account and change your password.</p>`

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

    if (collector.firstLogin) {
        return res.status(200).json(new ApiResponse(200, collector, "First time login detected please change your password"))
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(collector._id)

    const loggedInCollector = await Collector.findById(collector._id).select("-password -refreshToken")

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    loggedInCollector, accessToken, refreshToken
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
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
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


export {
    registerCollector,
    loginCollector,
    logoutCollector,
    changeCurrentPassword,
    getCurrentUser
}