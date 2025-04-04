import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Order } from "../models/order.model.js";
import { ORDER_STATUS } from "../constants.js";
import { User } from "../models/user.model.js";
import { Collector } from "../models/collector.model.js";


const userStats = asyncHandler(async (req, res) => {
    const userId = req?.user._id;

    const user = await User.findById(userId).select("fullName email avatar");

    if (!user) {
        throw new ApiError(404, "User not found");
    }



    const stats = await Order.aggregate([
        {
            $match: {
                user: userId,
                status: ORDER_STATUS.RECYCLED
            }
        },
        {
            $unwind: {
                path: "$orderItem",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $group: {
                _id: "$user",
                totalCompletedOrders: { $sum: 1 },
                totalWeight: { $sum: "$orderItem.weight" },
                totalEarnings: { $sum: "$totalAmount" }
            }
        },
        // Project to format the output
        {
            $project: {
                _id: 0,
                totalCompletedOrders: 1,
                totalWeight: { $ifNull: ["$totalWeight", 0] },
                totalEarnings: { $ifNull: ["$totalEarnings", 0] }
            }
        }
    ]);

    const userStatistics = stats.length > 0 ? stats[0] : {
        totalCompletedOrders: 0,
        totalWeight: 0,
        totalEarnings: 0
    };

    // Calculate environmental impact
    const totalWeightInKg = userStatistics.totalWeight;

    const environmentalImpact = {
        energySaved: `${Math.round(totalWeightInKg * 2.3)} kWh`,
        waterSaved: `${Math.round(totalWeightInKg * 18.23).toLocaleString()} Ltrs`,
        treesSaved: `${Math.round(totalWeightInKg * 0.36)} Trees`,
        oreSaved: `${Math.round(totalWeightInKg * 0.18)} kg Ore`,
        co2EmissionsReduced: `${Math.round(totalWeightInKg * 1.5)} kg CO2`
    };

    const result = {
        user,
        ...userStatistics,
        environmentalImpact
    };

    return res.status(200).json(
        new ApiResponse(200, result, "User statistics fetched successfully")
    );
});


const collectorStats = asyncHandler(async (req, res) => {

    const userId = req?.user._id;
    const collector = await Collector.findById(userId).select("fullName email avatar");

    if (!collector) {
        throw new ApiError(404, "Collector not found");
    }

    const stats = await Order.aggregate([
        {
            $match: {
                collector: userId,
                status: ORDER_STATUS.RECYCLED
            }
        },
        {
            $unwind: {
                path: "$orderItem",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $group: {
                _id: "$collector",
                totalCompletedOrders: { $sum: 1 },
                totalWeight: { $sum: "$orderItem.weight" },
                totalEarnings: { $sum: "$totalAmount" }
            }
        },

        {
            $project: {
                _id: 0,
                totalCompletedOrders: 1,
                totalWeight: { $ifNull: ["$totalWeight", 0] },
                totalEarnings: { $ifNull: ["$totalEarnings", 0] }
            }
        }
    ])

    const collectorStatistics = stats.length > 0 ? stats[0] : {
        totalCompletedOrders: 0,
        totalWeight: 0,
        totalEarnings: 0
    };

    const result = {
        collector,
        ...collectorStatistics
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Collector statistics fetched successfully"));


});


export {
    userStats,
    collectorStats
};