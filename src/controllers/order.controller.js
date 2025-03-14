import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Order } from "../models/order.model.js";
import mongoose from "mongoose";
import { sendEmail } from "../utils/Helper.js";
import { orderConfirmationEmail } from "../utils/EmailText.js";
import { ORDER_STATUS } from "../constants.js";



const createOrder = asyncHandler(async (req, res) => {

    const { pickupAddress, pickUpDate, orderItems, estimatedAmount } = req.body;
    const scrapImageLocalPaths = req.files["scrapImages"];

    if ([pickupAddress, pickUpDate, estimatedAmount].some((field) => field == undefined)) {
        throw new ApiError(400, "All fields are required")
    }

    if (!Array.isArray(orderItems) || orderItems.length == 0) {
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


    const order = await Order.create({
        user: req.user?._id,
        pickupAddress,
        pickUpDate,
        orderItem: orderItems,
        estimatedAmount,
        scrapImage: scrapImagesUrls
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

const getMyOrders = asyncHandler(async (req, res) => {

    // populate orderItem with scrap, collector with fullName
    const orders = await Order.find({ user: req.user?._id }).populate({ path: "orderItem.scrap", select: "name" }).populate({ path: "collector", select: "fullName" });

    if (!orders) {
        throw new ApiError(404, "No orders found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Orders fetched successfully"));

});

const getUnassignedOrders = asyncHandler(async (req, res) => {

    const orders = await Order.find({ status: ORDER_STATUS.PENDING }).populate({ path: "orderItem.scrap", select: "name" });

    if (!orders) {
        throw new ApiError(404, "No orders found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Orders fetched successfully"));



});

const getOderById = asyncHandler(async (req, res) => {

    const order = await Order.findById(req.params.id).populate({ path: "orderItem.scrap", select: "name" }).populate({ path: "collector", select: "fullName" }).populate({ path: "user", select: "fullName" });

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

    order.status = ORDER_STATUS.ASSIGNED;
    order.collector = req.user?._id;
    const updatedOrder = await order.save();

    if (!updatedOrder) {
        throw new ApiError(500, "Something went wrong while updating order")
    }

    res
        .status(200)
        .json(new ApiResponse(200, updatedOrder, "Order accepted successfully"));


    sendEmail(updatedOrder.user.email, {
        subject: "Order Accepted",
        text: `Your order has been accepted by ${req.user.fullName}. Your order id is ${updatedOrder._id}`,
        body: ` <h1>Order Accepted</h1>
        <p>Your order has been accepted by ${req.user.fullName}</p>
        <p>Your order id is ${updatedOrder._id}</p>
        <p>Order Date: ${updatedOrder.createdAt}</p>
        <p>Status: ${updatedOrder.status}</p>
        `
    })

    return;
});

const completeOrder = asyncHandler(async (req, res) => {

    const orderId = req.params.id;
    const { totalAmount, orderItem } = req.body

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order not found")
    }

    if (order.status != ORDER_STATUS.ASSIGNED) {
        throw new ApiError(400, "Order is not assigned yet")
    }

    if (order.collector != req.user._id) {
        throw new ApiError(403, "You are not authorized to complete this order")
    }

    if (order.status == ORDER_STATUS.RECYCLED) {
        throw new ApiError(400, "Order is already completed")
    }

    if (order.status == ORDER_STATUS.CANCELLED) {
        throw new ApiError(400, "Order is already cancelled")
    }

    order.status = ORDER_STATUS.RECYCLED;
    order.totalAmount = totalAmount;
    order.orderItem = orderItem;
    const updatedOrder = await order.save();

    if (!updatedOrder) {
        throw new ApiError(500, "Something went wrong while updating order")
    }

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

    if (order.status != ORDER_STATUS.PENDING) {
        throw new ApiError(400, "Order is already assigned")
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
    const updatedOrder = await order.save();

    if (!updatedOrder) {
        throw new ApiError(500, "Something went wrong while updating order")
    }

    res
        .status(200)
        .json(new ApiResponse(200, updatedOrder, "Order cancelled successfully"));

    sendEmail(updatedOrder.user.email, {
        subject: "Order Cancelled",
        text: `Your order has been cancelled by ${req.user.fullName}. Your order id is ${updatedOrder._id}`,
        body: ` <h1>Order Cancelled</h1>
        <p>Your order has been cancelled by ${req.user.fullName}</p>
        <p>Your order id is ${updatedOrder._id}</p>
        <p>Order Date: ${updatedOrder.createdAt}</p>
        <p>Status: ${updatedOrder.status}</p>
        `
    })

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


export {
    createOrder,
    getMyOrders,
    getUnassignedOrders,
    getOderById,
    acceptOrder,
    completeOrder,
    cancelOrder,
    getCollectorsPendingOrders
}