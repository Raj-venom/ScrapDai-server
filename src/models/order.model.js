import mongoose from "mongoose";
import { ORDER_STATUS } from "../constants.js";

const orderItemSchema = new mongoose.Schema(
    {
        scrap: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Scrap",
        },
        weight: {
            type: Number,
            required: null,
        },
        amount: {
            type: Number,
            required: null,
        },
    }
);

const orderSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    collector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Collector",
        default: null
    },
    pickupAddress: {
        formattedAddress: {
            type: String,
            required: true
        },
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    pickUpDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(ORDER_STATUS),
        default: ORDER_STATUS.PENDING,
    },
    estimatedAmount: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: null
    },
    orderItem: {
        type: [orderItemSchema]
    },
    feedback: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Feedback",
        default: null
    },
    scrapImage: [
        {
            type: String,
            required: true
        }
    ],
    pickUpTime: {
        type: String,
        required: true
    },


}, { timestamps: true });

export const Order = mongoose.model('Order', orderSchema);