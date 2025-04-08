import { Notification, NOTIFICATION_TYPES } from "../models/notification.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Collector } from "../models/collector.model.js";
import { ORDER_STATUS } from "../constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const createNotification = asyncHandler(async (req, res) => {
    const { userId, collectorId, orderId, title, message, type, metadata } = req.body;

    if (!userId && !collectorId) {
        return res.status(400).json({ message: "Either user or collector ID is required" });
    }

    if ((type === NOTIFICATION_TYPES.ORDER_ACCEPTED ||
        type === NOTIFICATION_TYPES.ORDER_RECYCLED ||
        type === NOTIFICATION_TYPES.ORDER_CANCELLED) && !orderId) {
        return res.status(400).json({ message: "Order ID is required for order-related notifications" });
    }

    const notification = new Notification({
        user: userId,
        collector: collectorId,
        order: orderId,
        title,
        message,
        type,
        metadata: metadata || {}
    });

    await notification.save();


    return res
        .status(201)
        .json(new ApiResponse(201, notification, "Notification created successfully"));

});


// Get notifications for a user or collector
const getNotifications = asyncHandler(async (req, res) => {
    const { userId, collectorId } = req.query;
    let query = {};

    if (userId) {
        query.user = userId;
    } else if (collectorId) {
        query.collector = collectorId;
    } else {
        return res.status(400).json({ message: "Either user or collector ID is required" });
    }

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .populate('order', 'status estimatedAmount')
        .populate('user', 'fullName avatar')
        .populate('collector', 'fullName avatar');


    if (!notifications || notifications.length === 0) {
        throw new ApiError(400, "No notifications found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, notifications, "Notifications fetched successfully"));

});

const markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json(new ApiResponse(200, notification, "Notification marked as read successfully"));

});

const deleteNotification = asyncHandler(async (req, res) => {

    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json(new ApiResponse(200, notification, "Notification deleted successfully"));

});

const createOrderStatusNotification = async (orderId, status) => {
    try {
        const order = await Order.findById(orderId).populate('user collector');
        if (!order) return;

        let title, message;
        const metadata = { orderId: order._id, status };

        switch (status) {
            case ORDER_STATUS.ACCEPTED:
                title = "Order Accepted";
                message = `Your order #${order._id.toString().slice(-6)} has been accepted by ${order.collector?.fullName || 'a collector'}.`;
                break;
            case ORDER_STATUS.RECYCLED:
                title = "Order Recycled";
                message = `Your order #${order._id.toString().slice(-6)} has been marked as recycled.`;
                break;
            case ORDER_STATUS.CANCELLED:
                title = "Order Cancelled";
                message = `Your order #${order._id.toString().slice(-6)} has been cancelled.`;
                break;
            default:
                return;
        }

        // Notification for user
        if (order.user) {
            await Notification.create({
                user: order.user._id,
                order: order._id,
                title,
                message,
                type: `ORDER_${status.toUpperCase()}`,
                metadata
            });
        }

        // Notification for collector (if applicable)
        if (order.collector && status !== ORDER_STATUS.ACCEPTED) {
            await Notification.create({
                collector: order.collector._id,
                order: order._id,
                title: `Order ${status}`,
                message: `Order #${order._id.toString().slice(-6)} has been ${status.toLowerCase()}.`,
                type: `ORDER_${status.toUpperCase()}`,
                metadata
            });
        }
    } catch (error) {
        console.error("Error creating order status notification:", error);
    }
};

export {
    createNotification,
    getNotifications,
    markAsRead,
    deleteNotification,
    createOrderStatusNotification
};