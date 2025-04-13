import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { randomPasswordGenerator, sendEmail, validateEmail, cookieOptions, clearCookieOptions } from "../utils/Helper.js";
import { Admin } from "../models/admin.model.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const admin = await Admin.findById(userId)
        if (!admin) {
            throw new ApiError(404, "admin not found")
        }
        const accessToken = admin.generateAccessToken()
        const refreshToken = admin.generateRefreshToken()

        admin.refreshToken = refreshToken
        await admin.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerAdmin = asyncHandler(async (req, res) => {


    const { fullName, email, phone } = req.body

    if (
        [fullName].some((field) => field?.trim() === "" || field?.trim() == undefined)
    ) {
        throw new ApiError(400, "All field are required")
    }

    if (phone?.length !== 10) {
        throw new ApiError(400, "Phone number must be 10 digits")
    }

    if (!validateEmail(email)) {
        throw new ApiError(400, "Invalid email address")
    }

    const existingAdmin = await Admin.findOne({ $or: [{ email }, { phone }] })

    if (existingAdmin) {
        if (existingAdmin.email === email) {
            throw new ApiError(400, "Admin with this email already exists")
        }
        throw new ApiError(400, "Admin with this phone number already exists")
    }

    const password = randomPasswordGenerator()


    const admin = await Admin.create({
        fullName,
        email,
        phone,
        password
    })

    const createdAdmin = await Admin.findById(admin._id).select("-password -refreshToken")

    res
        .status(201)
        .json(new ApiResponse(201, createdAdmin, "Admin created successfully"))


    const subject = "Admin Registration"
    const text = `Hello ${fullName}, your account has been created successfully. Your password is ${password}. Please login to your account and change your password.`

    const body = `<p>Hello ${fullName},</p> <p>Your account has been created successfully. Your password is <strong>${password}</strong>. Please login to your account and change your password.</p>`

    sendEmail(email, { subject, text, body })

    return

})

const loginAdmin = asyncHandler(async (req, res) => {

    const { identifier, password } = req.body

    if (
        [identifier, password].some((field) => field?.trim() === "" || field?.trim() == undefined)
    ) {
        throw new ApiError(400, "identifier and password is required")
    }

    const admin = await Admin.findOne({ $or: [{ email: identifier }, { phone: identifier }] })

    if (!admin) {
        throw new ApiError(404, "Admin not found")
    }

    const isPasswordCorrect = await admin.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid credentials")
    }

    if (admin.firstLogin) {
        return res.status(200).json(new ApiResponse(200, admin, "First time login detected please change your password"))
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(admin._id)

    const loggedInAdmin = await Admin.findById(admin._id).select("-password -refreshToken")

    return res
        .status(200)
        .cookie("accessToken", accessToken, {...cookieOptions, expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)})
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    loggedInAdmin, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )

})

const logoutAdmin = asyncHandler(async (req, res) => {

    const logoutAdmin = await Admin.findByIdAndUpdate(
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

    if (!logoutAdmin) {
        throw new ApiError(500, "Something went wrong while logging out")
    }


    return res
        .status(200)
        .clearCookie("accessToken", clearCookieOptions)
        .clearCookie("refreshToken", clearCookieOptions)
        .json(new ApiResponse(200, {}, "User logged Out"))


})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const { currentPassword, newPassword } = req.body

    if (
        [currentPassword, newPassword].some((field) => field === "" || field?.trim() == undefined)
    ) {
        throw new ApiError(400, "Both Old Password and new password is required")
    }

    if (currentPassword === newPassword) {
        throw new ApiError(400, "Old password and new password must be different")
    }

    const admin = await Admin.findById(req.user?._id)

    if (!admin) {
        throw new ApiError(404, "Admin not found")
    }

    const isPasswordCorrect = await admin.isPasswordCorrect(currentPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    admin.password = newPassword
    await admin.save()

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


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;


    const sendUnauthorizedResponse = () => {
        return res
            .status(200)
            .clearCookie("accessToken", clearCookieOptions)
            .clearCookie("refreshToken", clearCookieOptions)
            .json(new ApiResponse(401, {}, "Unauthorized request"));
    };

    if (!incomingRefreshToken) {
        return sendUnauthorizedResponse();
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        if (!decodedToken) {
            return sendUnauthorizedResponse();
        }

        const admin = await Admin.findById(decodedToken._id);
        if (!admin || admin.refreshToken !== incomingRefreshToken) {
            return sendUnauthorizedResponse();
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(admin._id);
        if (!accessToken || !newRefreshToken) {
            return sendUnauthorizedResponse();
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, { ...cookieOptions, expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) })
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Tokens refreshed successfully"));

    } catch (error) {
        console.log(error?.message);
        return sendUnauthorizedResponse();
    }
});


export {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    changeCurrentPassword,
    getCurrentUser,
    refreshAccessToken
}