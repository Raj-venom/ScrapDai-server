import mongoose from "mongoose";

const NOTIFICATION_TYPES = {
    ORDER_ACCEPTED: "ORDER_ACCEPTED",
    ORDER_RECYCLED: "ORDER_RECYCLED",
    ORDER_CANCELLED: "ORDER_CANCELLED",
    GENERAL: "GENERAL",
    PROMOTIONAL: "PROMOTIONAL",
    SYSTEM: "SYSTEM",
};

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: function () {
            return !this.collector;
        }
    },
    collector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Collector",
        required: function () {
            return !this.user;
        }
    },
    // order: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Order",
    //     required: function () {
    //         return this.type !== NOTIFICATION_TYPES.GENERAL &&
    //             this.type !== NOTIFICATION_TYPES.PROMOTIONAL;
    //     }
    // },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: function () {
            return [
                NOTIFICATION_TYPES.ORDER_ACCEPTED,
                NOTIFICATION_TYPES.ORDER_RECYCLED,
                NOTIFICATION_TYPES.ORDER_CANCELLED
            ].includes(this.type);
        }
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: Object.values(NOTIFICATION_TYPES),
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: Object,
        default: {}
    }
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);
export { NOTIFICATION_TYPES };