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


const getScrapById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const isValidObjectId = mongoose.Types.ObjectId.isValid(id)

    if (!isValidObjectId) {
        throw new ApiError(400, "Invalid scrap id")
    }

    const scrap = await Scrap.findById(id)

    if (!scrap) {
        throw new ApiError(404, "Scrap not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, scrap, "Scrap found successfully"))
})

const getAllScraps = asyncHandler(async (req, res) => {

    const scraps = await Scrap.find().populate("category", "name slug")

    if (!scraps) {
        throw new ApiError(404, "Scraps not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, scraps, "Scraps found successfully"))

})


const updatedMultipleScrapPrice = asyncHandler(async (req, res) => {
    const { scraps } = req.body;

    if (!scraps || scraps.length === 0) {
        throw new ApiError(400, "Scraps array is required");
    }


    const bulkOperations = scraps.map((scrap) => ({
        updateOne: {
            filter: { _id: scrap._id },
            update: { $set: { pricePerKg: scrap.pricePerKg } },
        },
    }));

    const result = await Scrap.bulkWrite(bulkOperations);

    if (!result) {
        throw new ApiError(500, "Failed to update prices");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Prices updated successfully"));
});


const getAllScrapsPrice = asyncHandler(async (req, res) => {
    const scraps = await Scrap.find({}, { name: 1, pricePerKg: 1, category: 1, _id: 1 }).populate("category", "name slug")

    if (!scraps) {
        throw new ApiError(404, "Scraps not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, scraps, "Scraps found successfully"))

})


const updateScrapDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, pricePerKg } = req.body;
    const scrapImageLocalPath = req.file?.path;

    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);

    if (!isValidObjectId) {
        throw new ApiError(400, "Invalid scrap id");
    }

    const existingScrap = await Scrap.findById(id);

    if (!existingScrap) {
        throw new ApiError(404, "Scrap not found");
    }

    const updatedFields = {
        name: name || existingScrap.name,
        description: description || existingScrap.description,
        pricePerKg: pricePerKg || existingScrap.pricePerKg,
    }

    if (scrapImageLocalPath) {
        const image = await uploadOnCloudinary(scrapImageLocalPath);
        updatedFields.scrapImage = image.url;
    }

    const scrap = await Scrap.findByIdAndUpdate(id, updatedFields, { new: true })

    if (!scrap) {
        throw new ApiError(500, "Failed to update scrap");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, scrap, "Scrap updated successfully"))
});


const getRandomScrapPrice = asyncHandler(async (req, res) => {

    const scrapItems = await Scrap.aggregate([

        { $sample: { size: 3 } },
        {
            $project: {
                _id: 0,
                scrap: "$name",
                price: "$pricePerKg"
            }
        }
    ]);

    if (!scrapItems) {
        throw new ApiError(404, "Scraps not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, scrapItems, "Scraps found successfully"))

})

export {
    addNewScrap,
    updateScrapPrice,
    deleteScrap,
    getScrapById,
    getAllScraps,
    updatedMultipleScrapPrice,
    getAllScrapsPrice,
    updateScrapDetails,
    getRandomScrapPrice
}