import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose from "mongoose";
import { Promotion } from "../models/promotion.model.js";


const createPromotion = asyncHandler(async (req, res) => {

    const { title, description, imageUrl, url, startDate, endDate } = req.body;


    if (!title || !description || !imageUrl || !startDate || !endDate) {
        throw new ApiError(400, "All fields are required");
    }

    const promotion = await Promotion.create({
        title,
        description,
        imageUrl,
        url,
        startDate,
        endDate
    });

    if (!promotion) {
        throw new ApiError(500, "Failed to create promotion");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, promotion, "Promotion created successfully"));

})


const getAllPromotions = asyncHandler(async (req, res) => {
    const promotions = await Promotion.find({}).sort({ createdAt: -1 });

    if (!promotions) {
        throw new ApiError(403, "No promotions found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, promotions, "Promotions retrieved successfully"));
})


const getPromotionById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid promotion ID");
    }

    const promotion = await Promotion.findById(id);

    if (!promotion) {
        throw new ApiError(404, "Promotion not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, promotion, "Promotion retrieved successfully"));
});


const getActivePromotions = asyncHandler(async (req, res) => {

    const promotions = await Promotion.getActivePromotions();

    if (!promotions) {
        throw new ApiError(404, "No active promotions found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, promotions, "Active promotions retrieved successfully"));

})

const updatePromotion = asyncHandler(async (req, res) => {

    const { id } = req.params;
    const { title, description, imageUrl, url, startDate, endDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid promotion ID");
    }

    const promotion = await Promotion.findByIdAndUpdate(
        id,
        {
            title,
            description,
            imageUrl,
            url,
            startDate,
            endDate
        },
        { new: true }
    );

    if (!promotion) {
        throw new ApiError(404, "Promotion not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, promotion, "Promotion updated successfully"));
})


const deletePromotion = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid promotion ID");
    }

    const promotion = await Promotion.findByIdAndDelete(id);

    if (!promotion) {
        throw new ApiError(404, "Promotion not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Promotion deleted successfully"));
})


export {
    createPromotion,
    getAllPromotions,
    getPromotionById,
    getActivePromotions,
    updatePromotion,
    deletePromotion
}