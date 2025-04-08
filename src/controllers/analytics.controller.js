import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Collector } from "../models/collector.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ORDER_STATUS } from "../constants.js";


const getTopScrapSeller = asyncHandler(async (req, res) => {

    const topSellers = await Order.aggregate([
        {
            $match: {
                status: ORDER_STATUS.RECYCLED
            }
        },
        {
            $group: {
                _id: "$user",
                totalAmount: { $sum: "$totalAmount" },
                orderCount: { $sum: 1 }
            }
        },
        {
            $sort: { totalAmount: -1 }
        },
        {
            $limit: 5
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        {
            $unwind: "$userDetails"
        },
        {
            $project: {
                userId: "$_id",
                fullName: "$userDetails.fullName",
                email: "$userDetails.email",
                phone: "$userDetails.phone",
                totalAmount: 1,
                orderCount: 1,
                avatar: "$userDetails.avatar"
            }
        }
    ]);

    if (topSellers.length === 0) {
        throw new ApiResponse(404, null, "No sellers found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, topSellers, "Top 5 sellers retrieved successfully"));

});


const getTopCollectors = asyncHandler(async (req, res) => {

    const topCollectors = await Order.aggregate([
        {
            $match: {
                status: ORDER_STATUS.RECYCLED,
                collector: { $ne: null }
            }
        },
        {
            $unwind: "$orderItem"
        },
        {
            $group: {
                _id: "$collector",
                totalWeight: { $sum: "$orderItem.weight" },
                orderCount: { $sum: 1 }
            }
        },
        {
            $sort: { totalWeight: -1 }
        },
        {
            $limit: 5
        },
        {
            $lookup: {
                from: "collectors",
                localField: "_id",
                foreignField: "_id",
                as: "collectorDetails"
            }
        },
        {
            $unwind: "$collectorDetails"
        },
        {
            $project: {
                collectorId: "$_id",
                fullName: "$collectorDetails.fullName",
                email: "$collectorDetails.email",
                phone: "$collectorDetails.phone",
                totalWeight: 1,
                orderCount: 1,
                avatar: "$collectorDetails.avatar"
            }
        }
    ]);

    if (topCollectors.length === 0) {
        throw new ApiResponse(404, null, "No collectors found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, topCollectors, "Top 5 collectors retrieved successfully")
        );
});



export {
    getTopScrapSeller,
    getTopCollectors
}