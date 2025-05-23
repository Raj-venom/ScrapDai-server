import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Order } from "../models/order.model.js";
import { sendEmail } from "../utils/Helper.js";
import { orderAcceptedEmail, orderConfirmationEmail } from "../utils/EmailText.js";
import { ORDER_STATUS, TIME_LINE_MESSAGES } from "../constants.js";
import { createOrderStatusNotification } from "./notification.controller.js";



const createOrder = asyncHandler(async (req, res) => {

    const { pickUpDate, estimatedAmount, pickUpTime, contactNumber } = req.body;
    const scrapImageLocalPaths = req.files["scrapImages"];
    const orderItems = JSON.parse(req.body.orderItems);
    const pickupAddress = JSON.parse(req.body.pickupAddress);



    if ([pickUpDate, estimatedAmount, pickUpTime].some((field) => field == undefined)) {
        throw new ApiError(400, "All fields are required")
    }

    if (contactNumber.length !== 10) {
        throw new ApiError(400, "Invalid contact number")
    }

    if (!Array.isArray(orderItems) || orderItems.length == 0) {
        console.log(orderItems.length)
        throw new ApiError(400, "Order items are required")
    }

    if (!scrapImageLocalPaths) {
        throw new ApiError(400, "Scrap images are required")
    }

    let scrapImagesUrls = [];

    for (const scrapImage of scrapImageLocalPaths) {
        const image = await uploadOnCloudinary(scrapImage.path)
        scrapImagesUrls.push(image?.url)
    }

    const timeline = [
        {
            date: new Date(),
            time: new Date().toLocaleTimeString(),
            message: TIME_LINE_MESSAGES.ORDER_CREATED
        }
    ]


    const order = await Order.create({
        user: req.user?._id,
        pickupAddress,
        pickUpDate,
        orderItem: orderItems,
        estimatedAmount,
        scrapImage: scrapImagesUrls,
        pickUpTime,
        contactNumber,
        timeline
    })

    if (!order) {
        throw new ApiError(500, "Something went wrong while creating order")
    }

    res
        .status(201)
        .json(new ApiResponse(201, order, "Order created successfully"));

    sendEmail(req.user.email, {
        subject: "Order Confirmation",
        text: `Your order has been placed successfully. Your order id is ${order._id}`,
        body: orderConfirmationEmail(order, req.user?.fullName)

    })

    return;


});

// User Order History
const getMyOrders = asyncHandler(async (req, res) => {

    // populate collector fullName and phone
    const orders = await Order.find({ user: req.user?._id })
        .populate({ path: "orderItem.scrap", select: "name" })
        .populate({ path: "collector", select: "fullName phone" })
        .populate({ path: "feedback", select: "userRating userReview" })
        .sort({ createdAt: -1 })

    if (!orders) {
        throw new ApiError(404, "No orders found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Orders fetched successfully"));

});

// Collector Order History
const getCollectorsOrdersHistory = asyncHandler(async (req, res) => {

    const orders = await Order.find({ collector: req.user?._id })
        .populate({ path: "orderItem.scrap", select: "name" })
        .populate({ path: "user", select: "fullName" })
        .populate({ path: "feedback", select: "collectorRating collectorReview" })
        .sort({ createdAt: -1 });

    if (!orders) {
        throw new ApiError(404, "No orders found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Orders fetched successfully"));

});

const getNewOrderRequest = asyncHandler(async (req, res) => {


    const orders = await Order.find({ status: ORDER_STATUS.PENDING })
        .populate({ path: "orderItem.scrap", select: "name pricePerKg" })
        .populate({ path: "user", select: "fullName avatar" })
        .select("-timeline -feedback")
        .sort({ createdAt: -1 })
        .limit(2);

    if (!orders) {
        throw new ApiError(404, "No orders found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate({
            path: "orderItem.scrap",
            select: "name pricePerKg"
        })
        .populate({
            path: "collector",
            select: "fullName"
        })
        .populate({
            path: "user",
            select: "fullName"
        });

    if (!order) {
        throw new ApiError(404, "Order not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order fetched successfully"));
});

const acceptOrder = asyncHandler(async (req, res) => {

    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order not found")
    }

    if (order.status != ORDER_STATUS.PENDING) {
        throw new ApiError(400, "Order is already assigned")
    }

    order.timeline.push({
        date: new Date(),
        time: new Date().toLocaleTimeString(),
        message: TIME_LINE_MESSAGES.ORDER_ACCEPTED
    })

    order.status = ORDER_STATUS.ACCEPTED;
    order.collector = req.user?._id;
    const updatedOrder = await (await order.save()).populate('user', 'email');

    if (!updatedOrder) {
        throw new ApiError(500, "Something went wrong while updating order")
    }

    await createOrderStatusNotification(updatedOrder._id, ORDER_STATUS.ACCEPTED);

    res
        .status(200)
        .json(new ApiResponse(200, updatedOrder, "Order accepted successfully"));


    sendEmail(updatedOrder.user.email, {
        subject: "Order Accepted",
        text: `Your order has been accepted by ${req.user.fullName}. Your order id is ${updatedOrder._id}`,
        body: orderAcceptedEmail(updatedOrder, req.user.fullName)
    });


    return;
});

const completeOrder = asyncHandler(async (req, res) => {

    const orderId = req.params.id;
    const { orderItem } = req.body

    if (!Array.isArray(orderItem) || orderItem.length == 0) {
        throw new ApiError(400, "Order items are required")
    }

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order not found")
    }


    if (!order.collector.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to complete this order");
    }

    if (order.status == ORDER_STATUS.RECYCLED) {
        throw new ApiError(400, "Order is already completed")
    }

    if (order.status == ORDER_STATUS.CANCELLED) {
        throw new ApiError(400, "Order is already cancelled")
    }

    if (order.status != ORDER_STATUS.ACCEPTED) {
        throw new ApiError(400, "Order is not assigned yet")
    }


    const totalAmount = Array.isArray(orderItem)
        ? orderItem.reduce((acc, item) => acc + item.amount, 0)
        : 0;

    if (totalAmount === 0) {
        throw new ApiError(400, "Total amount cannot be zero")
    }


    order.totalAmount = totalAmount.toFixed(2);
    order.orderItem = orderItem;
    order.status = ORDER_STATUS.RECYCLED;
    order.timeline.push({
        date: new Date(),
        time: new Date().toLocaleTimeString(),
        message: TIME_LINE_MESSAGES.ORDER_RECYCLED
    })

    const updatedOrder = await (await order.save()).populate('user', 'email');

    if (!updatedOrder) {
        throw new ApiError(500, "Something went wrong while updating order")
    }

    await createOrderStatusNotification(updatedOrder._id, ORDER_STATUS.RECYCLED);

    res
        .status(200)
        .json(new ApiResponse(200, updatedOrder, "Order completed successfully"));

    sendEmail(updatedOrder.user.email, {
        subject: "Order Completed",
        text: `Your order has been completed by ${req.user.fullName}. Your order id is ${updatedOrder._id}`,
        body: ` <h1>Order Completed</h1>
        <p>Your order has been completed by ${req.user.fullName}</p>
        <p>Your order id is ${updatedOrder._id}</p>
        <p>Order Date: ${updatedOrder.createdAt}</p>
        <p>Status: ${updatedOrder.status}</p>
        `
    })

    return;

});


const cancelOrder = asyncHandler(async (req, res) => {

    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order not found")
    }


    if (order.status == ORDER_STATUS.RECYCLED) {
        throw new ApiError(400, "Order is already completed")
    }

    if (order.status == ORDER_STATUS.CANCELLED) {
        throw new ApiError(400, "Order is already cancelled")
    }

    if (!order.user.equals(req.user._id)) {
        throw new ApiError(401, "Unauthorized user")
    }

    order.status = ORDER_STATUS.CANCELLED;
    order.timeline.push({
        date: new Date(),
        time: new Date().toLocaleTimeString(),
        message: TIME_LINE_MESSAGES.ORDER_CANCELLED
    })
    const updatedOrder = await (await order.save()).populate('user', 'email');

    if (!updatedOrder) {
        throw new ApiError(500, "Something went wrong while updating order")
    }

    await createOrderStatusNotification(updatedOrder._id, ORDER_STATUS.CANCELLED);


    res
        .status(200)
        .json(new ApiResponse(200, updatedOrder, "Order cancelled successfully"));

    try {
        sendEmail(updatedOrder.user.email, {
            subject: "Order Cancelled",
            text: `Your order has been cancelled. Your order id is ${updatedOrder._id}`,
            body: ` <h1>Order Cancelled</h1>
            <p>Your order has been cancelled by ${req.user.fullName}</p>
            <p>Your order id is ${updatedOrder._id}</p>
            <p>Order Date: ${updatedOrder.createdAt}</p>
            <p>Status: ${updatedOrder.status}</p>
            `
        })
    } catch (error) {
        console.log("Error sending email: ", error);
        // Handle the error as needed, e.g., log it or send a notification
    }


    return;

});

const getCollectorsPendingOrders = asyncHandler(async (req, res) => {

    const orders = await Order.find({ collector: req.user?._id, status: ORDER_STATUS.ASSIGNED }).populate({ path: "orderItem.scrap", select: "name" }).populate({ path: "user", select: "fullName" });

    if (!orders) {
        throw new ApiError(404, "No orders found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Orders fetched successfully"));

});



const placeOrder = asyncHandler(async (req, res) => {

    const { pickupAddress, pickUpDate, orderItems, estimatedAmount, scrapImagesUrls } = req.body;


    // pickupAdresss: {formattedAddress, latitude, longitude}
    // orderItems: [{scrap, weight, amount}]
    // scrapImagesUrls: [url1, url2, url3]
    // pickUpDate: Date
    // estimatedAmount: Number

    if (!pickUpDate || !estimatedAmount || !orderItems || !scrapImagesUrls, !pickupAddress) {
        throw new ApiError(400, "All fields are required")
    }

    if (!Array.isArray(orderItems) || orderItems.length == 0) {
        throw new ApiError(400, "Order items are required")
    }

    const order = await Order.create({
        user: req.user._id,
        pickupAddress,
        pickUpDate,
        orderItem: orderItems,
        estimatedAmount,
        scrapImage: scrapImagesUrls
    })

    if (!order) {
        throw new ApiError(500, "Something went wrong while creating order")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, order, "Order created successfully"));




});

const getNearbyOrders = asyncHandler(async (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        throw new ApiError(400, "Latitude and longitude are required");
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
        throw new ApiError(400, "Invalid latitude and longitude");
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new ApiError(400, "Coordinates are out of valid range");
    }


    const nearbyOrders = await Order.aggregate([
        {
            $match: {
                status: ORDER_STATUS.PENDING,
                collector: null
            }
        },
        {
            $addFields: {
                distance: {
                    $multiply: [
                        6371, // Earth's radius in km
                        {
                            $acos: {
                                $add: [
                                    {
                                        $multiply: [
                                            { $sin: { $degreesToRadians: lat } },
                                            { $sin: { $degreesToRadians: "$pickupAddress.latitude" } }
                                        ]
                                    },
                                    {
                                        $multiply: [
                                            { $cos: { $degreesToRadians: lat } },
                                            { $cos: { $degreesToRadians: "$pickupAddress.latitude" } },
                                            {
                                                $cos: {
                                                    $subtract: [
                                                        { $degreesToRadians: "$pickupAddress.longitude" },
                                                        { $degreesToRadians: lon }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        },
        {
            $match: {
                distance: { $lte: 5 } // Filter orders within 5 km
            }
        },
        {
            $sort: { distance: 1 } // Sort by distance ascending
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        {
            $unwind: "$userDetails"
        },
        // Unwind orderItem array to prepare for scrap lookup
        {
            $unwind: {
                path: "$orderItem",
                preserveNullAndEmptyArrays: true
            }
        },
        // Lookup scrap details
        {
            $lookup: {
                from: "scraps",
                localField: "orderItem.scrap",
                foreignField: "_id",
                as: "orderItem.scrapDetails"
            }
        },
        // Unwind the scrap details
        {
            $unwind: {
                path: "$orderItem.scrapDetails",
                preserveNullAndEmptyArrays: true
            }
        },
        // Reshape the orderItem with scrap details
        {
            $addFields: {
                "orderItem.scrap": {
                    _id: "$orderItem.scrapDetails._id",
                    name: "$orderItem.scrapDetails.name",
                    pricePerKg: "$orderItem.scrapDetails.pricePerKg"
                }
            }
        },
        // Group back to recompose the original document structure
        {
            $group: {
                _id: "$_id",
                pickupAddress: { $first: "$pickupAddress" },
                pickUpDate: { $first: "$pickUpDate" },
                status: { $first: "$status" },
                estimatedAmount: { $first: "$estimatedAmount" },
                totalAmount: { $first: "$totalAmount" },
                scrapImage: { $first: "$scrapImage" },
                pickUpTime: { $first: "$pickUpTime" },
                contactNumber: { $first: "$contactNumber" },
                distance: { $first: { $round: ["$distance", 2] } },
                user: {
                    $first: {
                        _id: "$userDetails._id",
                        fullName: "$userDetails.fullName",
                        avatar: "$userDetails.avatar"
                    }
                },
                orderItem: {
                    $push: {
                        $cond: [
                            { $ifNull: ["$orderItem", false] }, // Check if orderItem exists
                            {
                                scrap: "$orderItem.scrap",
                                weight: "$orderItem.weight",
                                amount: "$orderItem.amount",
                                _id: "$orderItem._id"
                            },
                            "$$REMOVE"  // If orderItem is null or doesn't exist, remove this item
                        ]
                    }
                }
            }
        },
        {
            $sort: { distance: 1 } // Sort by distance ascending
        },
        // Final projection to format the output
        {
            $project: {
                _id: 1,
                pickupAddress: 1,
                pickUpDate: 1,
                status: 1,
                estimatedAmount: 1,
                totalAmount: 1,
                scrapImage: 1,
                pickUpTime: 1,
                contactNumber: 1,
                distance: 1,
                user: 1,
                orderItem: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, nearbyOrders, "Orders fetched successfully"));
});


const getHighValueOrders = asyncHandler(async (req, res) => {

    const highValue = 1000;

    const orders = await Order.find({ status: ORDER_STATUS.PENDING, estimatedAmount: { $gte: highValue } })
        .populate({ path: "orderItem.scrap", select: "name pricePerKg" })
        .populate({ path: "user", select: "fullName avatar" })
        .select("-timeline -feedback")
        .sort({ createdAt: -1 });

    if (!orders) {
        throw new ApiError(404, "No orders found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

const getAllPendingOrders = asyncHandler(async (req, res) => {

    const orders = await Order.find({ status: ORDER_STATUS.PENDING })
        .populate({ path: "orderItem.scrap", select: "name pricePerKg" })
        .populate({ path: "user", select: "fullName avatar" })
        .select("-timeline -feedback")
        .sort({ createdAt: -1 });

    if (!orders) {
        throw new ApiError(404, "No orders found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

const getOrderScheduledForToday = asyncHandler(async (req, res) => {

    const orders = await Order.find({
        collector: req?.user._id,
        status: ORDER_STATUS.ACCEPTED,
        pickUpDate: {
            $gte: new Date(new Date().setHours(0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59))
        }

    }).populate({ path: "orderItem.scrap", select: "name" }).populate({ path: "user", select: "fullName" }).select("-timeline -feedback").sort({ createdAt: -1 });

    if (!orders) {
        throw new ApiError(404, "No orders found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Orders fetched successfully"));

});

const getUserOrderHistoryById = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { timeframe } = req.query;

    let query = { user: userId };


    if (timeframe) {
        const now = new Date();
        let dateThreshold;

        switch (timeframe) {
            case 'today':
                dateThreshold = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                dateThreshold = new Date(now);
                dateThreshold.setDate(dateThreshold.getDate() - 7);
                break;
            case 'month':
                dateThreshold = new Date(now);
                dateThreshold.setMonth(dateThreshold.getMonth() - 1);
                break;
            case 'year':
                dateThreshold = new Date(now);
                dateThreshold.setFullYear(dateThreshold.getFullYear() - 1);
                break;
        }

        if (dateThreshold) {
            query.createdAt = { $gte: dateThreshold };
        }
    }

    const orders = await Order.find(query)
        .populate({ path: "orderItem.scrap", select: "name" })
        .populate({ path: "collector", select: "fullName phone" })
        .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, [], "No orders found"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Orders fetched successfully"));
});


const getCollectorOrderHistoryById = asyncHandler(async (req, res) => {
    const collectorId = req.params.id;
    const { timeframe } = req.query;

    let query = { collector: collectorId };

    if (timeframe) {
        const now = new Date();
        let dateThreshold;

        switch (timeframe) {
            case 'today':
                dateThreshold = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                dateThreshold = new Date(now);
                dateThreshold.setDate(dateThreshold.getDate() - 7);
                break;
            case 'month':
                dateThreshold = new Date(now);
                dateThreshold.setMonth(dateThreshold.getMonth() - 1);
                break;
            case 'year':
                dateThreshold = new Date(now);
                dateThreshold.setFullYear(dateThreshold.getFullYear() - 1);
                break;
        }

        if (dateThreshold) {
            query.createdAt = { $gte: dateThreshold };
        }
    }

    const orders = await Order.find(query)
        .populate({ path: "orderItem.scrap", select: "name" })
        .populate({ path: "user", select: "fullName phone" })
        .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, [], "No orders found"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Orders fetched successfully"));
});


const updateOrderScheduledDate = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const { pickUpDate, pickUpTime } = req.body;

    if (!pickUpDate || !pickUpTime) {
        throw new ApiError(400, "Pick up date and time are required")
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found")
    }


    if(order.status == ORDER_STATUS.RECYCLED) {
        throw new ApiError(400, "Cannot reschedule order after completion")
    }

    if (order.status == ORDER_STATUS.CANCELLED) {
        throw new ApiError(400, "Cannot reschedule order after cancellation")
    }


    order.pickUpDate = pickUpDate;
    order.pickUpTime = pickUpTime;

    order.timeline.push({
        date: new Date(),
        time: new Date().toLocaleTimeString(),
        message: TIME_LINE_MESSAGES.ORDER_RESCHEDULED
    })

    await createOrderStatusNotification(order._id, "Rescheduled");

    const updatedOrder = await order.save();
    if (!updatedOrder) {
        throw new ApiError(500, "Something went wrong while updating order")
    }

    res
        .status(200)
        .json(new ApiResponse(200, updatedOrder, "Order updated successfully"));

    //TODO: send email to user about order rescheduled
});



export {
    createOrder,
    getMyOrders,
    getNewOrderRequest,
    getOrderById,
    acceptOrder,
    completeOrder,
    cancelOrder,
    getCollectorsPendingOrders,
    placeOrder,
    getNearbyOrders,
    getHighValueOrders,
    getAllPendingOrders,
    getOrderScheduledForToday,
    getCollectorsOrdersHistory,
    getUserOrderHistoryById,
    getCollectorOrderHistoryById,
    updateOrderScheduledDate
}