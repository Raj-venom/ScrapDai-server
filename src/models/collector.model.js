import mongoose from "mongoose";
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { USER_ROLE } from "../constants.js";

const collectorSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
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
        index: true
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        index: true,
        unique: true
    },
    avatar: {
        type: String,
        default: "https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small_2x/user-profile-icon-free-vector.jpg"
    },
    current_address: {
        type: String,
        required: true,
        trim: true
    },
    refreshToken: {
        type: String
    },
    firstLogin: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        default: USER_ROLE.COLLECTOR
    },
    otp: {
        type: String,
    },

    otpExpiry: {
        type: Date,
    },
    expoPushToken: {
        type: String,
        default: null
    }

},
    {
        timestamps: true,
    }
);




collectorSchema.pre("save", async function (next) {

    if (!this.isModified("password")) return (next())

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

collectorSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

collectorSchema.methods.generateAccessToken = function () {

    return Jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName,
            phone: this.phone,
            current_address: this.current_address,
            role: this.role

        },

        process.env.ACCESS_TOKEN_SECRET,

        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


collectorSchema.methods.generateRefreshToken = function () {

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

collectorSchema.methods.generateResetPasswordToken = function () {

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


export const Collector = mongoose.model("Collector", collectorSchema);