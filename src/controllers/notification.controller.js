import { Notification, NOTIFICATION_TYPES } from "../models/notification.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Collector } from "../models/collector.model.js";
import { ORDER_STATUS } from "../constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Expo } from "expo-server-sdk";


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


const markAsAllRead = asyncHandler(async (req, res) => {
    const { userId, collectorId } = req.query;
    let query = {};

    if (userId) {
        query.user = userId;
    } else if (collectorId) {
        query.collector = collectorId;
    } else {
        return res.status(400).json({ message: "Either user or collector ID is required" });
    }

    const notifications = await Notification.updateMany(query, { isRead: true });

    if (!notifications) {
        return res.status(404).json({ message: "No notifications found" });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, notifications, "All notifications marked as read successfully"));

});

const sendPromotionNotification = asyncHandler(async (req, res) => {
    try {
        const { title, message, data, userType = 'all' } = req.body;

        if (!title?.trim() || !message?.trim()) {
            throw new ApiError(400, "Notification title and message are required");
        }

        const fetchUsers = userType === 'all' || userType === 'users';
        const fetchCollectors = userType === 'all' || userType === 'collectors';

        const [users, collectors] = await Promise.all([
            fetchUsers ? User.find({ expoPushToken: { $exists: true, $ne: null } }).select('expoPushToken _id').lean() : Promise.resolve([]),
            fetchCollectors ? Collector.find({ expoPushToken: { $exists: true, $ne: null } }).select('expoPushToken _id').lean() : Promise.resolve([])
        ]);

        const validUserTokens = users
            .filter(user => {
                const isValid = Expo.isExpoPushToken(user.expoPushToken);
                if (!isValid) console.warn(`Invalid user token excluded: ${user.expoPushToken}`);
                return isValid;
            });

        const validCollectorTokens = collectors
            .filter(collector => {
                const isValid = Expo.isExpoPushToken(collector.expoPushToken);
                if (!isValid) console.warn(`Invalid collector token excluded: ${collector.expoPushToken}`);
                return isValid;
            });

        const allValidTokens = [
            ...validUserTokens.map(u => ({ token: u.expoPushToken, userId: u._id, isUser: true })),
            ...validCollectorTokens.map(c => ({ token: c.expoPushToken, collectorId: c._id, isUser: false }))
        ];

        if (!allValidTokens.length) {
            throw new ApiError(404, "No valid recipient tokens found for the specified user type")
        }

        // Create database notifications first
        const notificationPromises = allValidTokens.map(recipient => {
            const notificationData = {
                title: title.trim(),
                message: message.trim(),
                type: NOTIFICATION_TYPES.PROMOTIONAL,
                metadata: data || {},
                isRead: false
            };

            if (recipient.isUser) {
                notificationData.user = recipient.userId;
            } else {
                notificationData.collector = recipient.collectorId;
            }

            return Notification.create(notificationData);
        });

        await Promise.all(notificationPromises);

        // Prepare push notifications
        const expo = new Expo();
        const pushNotifications = allValidTokens.map(recipient => ({
            to: recipient.token,
            sound: 'default',
            title: title.trim(),
            body: message.trim(),
            data: {
                ...(data || {}),
                notificationType: 'environmental_campaign',
            }
        }));

        const chunks = expo.chunkPushNotifications(pushNotifications);
        const results = await Promise.allSettled(
            chunks.map(chunk => expo.sendPushNotificationsAsync(chunk))
        );

        const sentTickets = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
        const failedChunks = results.filter(r => r.status === 'rejected').length;

        return res.status(failedChunks ? 207 : 200).json({
            success: !failedChunks,
            stats: {
                totalRecipients: allValidTokens.length,
                successfulDeliveries: sentTickets.length,
                failedChunks,
                notificationsCreated: allValidTokens.length,
                userType,
                usersCount: validUserTokens.length,
                collectorsCount: validCollectorTokens.length
            },
            tickets: sentTickets,
            notificationPreview: {
                title: title.trim(),
                body: message.trim(),
                data: data || null
            }
        });

    } catch (error) {
        console.error(`Notification Error: ${error?.message}`);
        return res.status(500).json({
            success: false,
            message: error?.message || "Internal Server Error",
            error: error?.message || undefined
        });
    }
});

const sendSystemNotification = asyncHandler(async (req, res) => {
    try {
        const { title, message, data } = req.body;

        // Validate input
        if (!title?.trim() || !message?.trim()) {
          throw new ApiError(400, "Notification title and message are required");
        }

        const [users, collectors] = await Promise.all([
            User.find({ expoPushToken: { $exists: true, $ne: null } }).select('expoPushToken _id').lean(),
            Collector.find({ expoPushToken: { $exists: true, $ne: null } }).select('expoPushToken _id').lean()
        ]);

        const validUserTokens = users
            .filter(user => {
                const isValid = Expo.isExpoPushToken(user.expoPushToken);
                if (!isValid) console.warn(`Invalid user token excluded: ${user.expoPushToken}`);
                return isValid;
            });

        const validCollectorTokens = collectors
            .filter(collector => {
                const isValid = Expo.isExpoPushToken(collector.expoPushToken);
                if (!isValid) console.warn(`Invalid collector token excluded: ${collector.expoPushToken}`);
                return isValid;
            });

        const allValidTokens = [
            ...validUserTokens.map(u => ({ token: u.expoPushToken, userId: u._id, isUser: true })),
            ...validCollectorTokens.map(c => ({ token: c.expoPushToken, collectorId: c._id, isUser: false }))
        ];

        if (!allValidTokens.length) {
            throw new ApiError(404, "No valid recipient tokens found for the specified user type")
        }

        // Create database notifications
        const notificationPromises = allValidTokens.map(recipient => {
            const notificationData = {
                title: title.trim(),
                message: message.trim(),
                type: NOTIFICATION_TYPES.SYSTEM,
                metadata: data || {},
                isRead: false
            };

            if (recipient.isUser) {
                notificationData.user = recipient.userId;
            } else {
                notificationData.collector = recipient.collectorId;
            }

            return Notification.create(notificationData);
        });

        await Promise.all(notificationPromises);

        // Prepare and send push notifications
        const expo = new Expo();
        const pushNotifications = allValidTokens.map(recipient => ({
            to: recipient.token,
            sound: 'default',
            title: title.trim(),
            body: message.trim(),
            data: {
                ...(data || {}),
                notificationType: NOTIFICATION_TYPES.SYSTEM,
            }
        }));

        // Send in chunks (Expo has a limit per request)
        const chunks = expo.chunkPushNotifications(pushNotifications);
        const results = await Promise.allSettled(
            chunks.map(chunk => expo.sendPushNotificationsAsync(chunk))
        );

        const sentTickets = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
        const failedChunks = results.filter(r => r.status === 'rejected').length;

        return res.status(failedChunks ? 207 : 200).json({
            success: !failedChunks,
            stats: {
                totalRecipients: allValidTokens.length,
                successfulDeliveries: sentTickets.length,
                failedChunks,
                notificationsCreated: allValidTokens.length,
                usersCount: validUserTokens.length,
                collectorsCount: validCollectorTokens.length
            },
            notificationPreview: {
                title: title.trim(),
                body: message.trim(),
                data: data || null
            }
        });

    } catch (error) {
        console.error(`System Notification Error: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Failed to send system notification",
            error: error.message || undefined
        });
    }
});

export {
    createNotification,
    getNotifications,
    markAsRead,
    deleteNotification,
    createOrderStatusNotification,
    markAsAllRead,
    sendPromotionNotification,
    sendSystemNotification
};