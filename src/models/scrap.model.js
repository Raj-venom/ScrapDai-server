import mongoose from "mongoose";

const scrapSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    scrapImage: {
        type: String,
        required: true,
    },
    pricePerKg: {
        type: Number,
        default: 0,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    }

}, { timestamps: true });

export const Scrap = mongoose.model('Scrap', scrapSchema);