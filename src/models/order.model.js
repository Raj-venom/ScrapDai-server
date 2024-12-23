import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        scrapId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Scrap",
        },
        weight: {
            type: Number,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
    }
);

const orderSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    collector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Collector",
    },
    pickupAddress: {
        type: {
            type: String,
            enum: ["Point"],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        },
        index: "2dsphere",
    },
    pickUpDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "completed", "cancelled"],
        default: "pending"
    },
    totalAmount: {
        type: Number,
        required: true
    },
    orderItem: {
        type: [orderItemSchema]
    },
    feedback: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Feedback",
    }


}, { timestamps: true });

export const Order = mongoose.model('Order', orderSchema);