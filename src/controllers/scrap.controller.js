import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose from "mongoose";
import { Scrap } from "../models/scrap.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const addNewScrap = asyncHandler(async (req, res) => {

    const { name, description, pricePerKg, category } = req.body;
    const scrapImageLocalPath = req.file?.path;

    if (!name || !description || !pricePerKg || !category) {
        throw new ApiError(400, "All fields are required")
    }

    if (!scrapImageLocalPath) {
        throw new ApiError(400, "Scrap image is required")
    }

    const isValidObjectId = mongoose.Types.ObjectId.isValid(category)

    if (!isValidObjectId) {
        throw new ApiError(400, "Invalid category id")
    }

    const existingScrap = await Scrap.findOne({ name, category })

    if (existingScrap) {
        throw new ApiError(400, "Scrap with this name already exists in this category")
    }

    const image = await uploadOnCloudinary(scrapImageLocalPath)

    if (!image.url) {
        throw new ApiError(500, "Something went wrong while uploading image")
    }

    const scrap = await Scrap.create({
        name,
        description,
        pricePerKg,
        category,
        scrapImage: image.url
    })

    if (!scrap) {
        throw new ApiError(500, "Something went wrong while creating scrap")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, scrap, "Scrap created successfully"))

})


const updateScrapPrice = asyncHandler(async (req, res) => {

    const { pricePerKg } = req.body;
    const { id } = req.params;

    if (!pricePerKg) {
        throw new ApiError(400, "Price per kg is required")
    }

    const isValidObjectId = mongoose.Types.ObjectId.isValid(id)

    if (!isValidObjectId) {
        throw new ApiError(400, "Invalid scrap id")
    }

    const scrap = await Scrap.findByIdAndUpdate(id, { pricePerKg }, { new: true })

    if (!scrap) {
        throw new ApiError(404, "Scrap not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, scrap, "Price updated successfully"))

})


const deleteScrap = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const isValidObjectId = mongoose.Types.ObjectId.isValid(id)

    if (!isValidObjectId) {
        throw new ApiError(400, "Invalid scrap id")
    }

    const scrap = await Scrap.findByIdAndDelete(id)

    if (!scrap) {
        throw new ApiError(404, "Scrap not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Scrap deleted successfully"))

})


export {
    addNewScrap,
    updateScrapPrice,
    deleteScrap
}