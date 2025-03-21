import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Admin } from "../models/admin.model.js";
import { Collector } from "../models/collector.model.js";
import { USER_ROLE } from "../constants.js";


const verifyJWT = asyncHandler(async (req, res, next) => {

    try {

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")


        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user;
        next()


    } catch (error) {
        throw new ApiError(401, "Invalid Access Token")
    }
})


const getUserRole = async (role, userId) => {

    if (role === USER_ROLE.ADMIN) {
        return await Admin.findById(userId).select("-password -refreshToken");
    } else if (role === USER_ROLE.COLLECTOR) {
        return await Collector.findById(userId).select("-password -refreshToken");
    } else if (role === USER_ROLE.USER) {
        return await User.findById(userId).select("-password -refreshToken");
    } else {
        return null;
    }

}

const verifyAuthourization = (requiredRole) => asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await getUserRole(decodedToken?.role, decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
            // throw new ApiError(403, "Forbidden: Insufficient permissions");
        }

        if (requiredRole && requiredRole !== user.role) {
            throw new ApiError(401, "Unauthorized request");
        }

        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(error.statusCode || 401, error.message || "Unauthorized request");
    }
});


export { verifyJWT, verifyAuthourization }