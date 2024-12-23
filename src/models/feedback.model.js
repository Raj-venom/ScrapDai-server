import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({

    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
    },
    userRating: {
        type: Number,
        required: [true, 'User rating is required'],
        min: [1, 'User rating must be at least 1'],
        max: [5, 'User rating must not exceed 5'],
    },
    userReview: {
        type: String,
        required: true,
        trim: true
    },
    collectorRating: {
        type: Number,
        required: [true, 'User rating is required'],
        min: [1, 'User rating must be at least 1'],
        max: [5, 'User rating must not exceed 5'],
    },
    collectorReview: {
        type: String,
        required: true
    }

}, { timestamps: true });

export const Feedback = mongoose.model('Feedback', feedbackSchema);