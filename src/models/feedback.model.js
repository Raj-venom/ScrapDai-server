import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({

    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    userRating: {
        type: Number,
        min: [1, 'User rating must be at least 1'],
        max: [5, 'User rating must not exceed 5'],
    },
    userReview: {
        type: String,
        trim: true
    },
    collectorRating: {
        type: Number,
        min: [1, 'User rating must be at least 1'],
        max: [5, 'User rating must not exceed 5'],
    },
    collectorReview: {
        type: String,
        trim: true
    }

}, { timestamps: true });

export const Feedback = mongoose.model('Feedback', feedbackSchema);