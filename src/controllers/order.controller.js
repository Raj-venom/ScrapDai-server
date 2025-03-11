import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Order } from "../models/order.model.js";
import mongoose from "mongoose";
import { sendEmail } from "../utils/Helper.js";
import { orderConfirmationEmail } from "../utils/EmailText.js";



const createOrder = asyncHandler(async (req, res) => {

    const { pickupAddress, pickUpDate, orderItems, estimatedAmount, scrapImages } = req.body;
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