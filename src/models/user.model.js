import mongoose from "mongoose";
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { GENDER, USER_ROLE } from "../constants.js";


const userSchema = new mongoose.Schema(
    {

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        password: {
            type: String,
            required: [true, 'Password is required'],
            trim: true,
            minlength: [8, "Password must be at least 8 characters long"],
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
            index: true,
            unique: true
        },

        gender: {
            type: String,
            enum: [...GENDER],
            default: "Male"
        },

        avatar: {
            type: String,
            default: "https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small_2x/user-profile-icon-free-vector.jpg"
        },

        current_address: {
            type: String,
            // required: true,
            trim: true
        },

        otp: {
            type: String,
        },

        otpExpiry: {
            type: Date,
        },

        isverified: {
            type: Boolean,
            default: false
        },

        refreshToken: {
            type: String
        },

        deletionRequested: {
            type: Boolean,
            default: false
        },

        deletionRequestDate: {
            type: Date,
            default: null
        },

        cancelDeletionToken: {
            type: String,
            default: null
        },
        role: {
            type: String,
            default: USER_ROLE.USER
        },
        isBanned: {
            type: Boolean,
            default: false
        },
        expoPushToken: {
            type: String,
            default: null
        },
        bannedReason: {
            type: String,
            default: null
        },

    },
    {
        timestamps: true,
    }
)

// userSchema.index({ current_address: "2dsphere" })

userSchema.pre("save", async function (next) {

    if (!this.isModified("password")) return (next())

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password.trim(), this.password)
}

userSchema.methods.generateAccessToken = function () {

    return Jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName,
            phone: this.phone,
            current_address: this.current_address,
            role: this.role,
            avatar: this.avatar

        },

        process.env.ACCESS_TOKEN_SECRET,

        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


userSchema.methods.generateRefreshToken = function () {

    return Jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,

        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateResetPasswordToken = function () {

    return Jwt.sign(
        {
            _id: this._id,
        },
        process.env.RESET_PASSWORD_SECRET,

        {
            expiresIn: process.env.RESET_PASSWORD_EXPIRY
        }
    )
}

userSchema.methods.generateCancelDeletionToken = function () {

    return Jwt.sign(
        {
            _id: this._id,
        },
        process.env.CANCEL_DELETION_SECRET,

        {
            expiresIn: process.env.CANCEL_DELETION_EXPIRY
        }
    )

}

export const User = mongoose.model("User", userSchema)