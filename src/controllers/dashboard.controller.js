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

const getDashboardStats = asyncHandler(async (req, res) => {

    // Get current date for calculations
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    // Get start of last month for comparison
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const startOfLastMonth = new Date(lastMonth.setDate(1));
    startOfLastMonth.setHours(0, 0, 0, 0);

    const startOfCurrentMonth = new Date(today);
    startOfCurrentMonth.setDate(1);
    startOfCurrentMonth.setHours(0, 0, 0, 0);


    // Active collectors (currently accepted)
    const activeCollectorsCount = await Order.countDocuments({
        status: ORDER_STATUS.ACCEPTED
    });

    // Total earnings from recycled orders
    const totalEarnings = await Order.aggregate([
        {
            $match: {
                status: ORDER_STATUS.RECYCLED
            }
        },
        {
            $group: {
                _id: null,
                totalEarnings: { $sum: "$totalAmount" }
            }
        }
    ]);
    const totalEarningsValue = totalEarnings.length > 0 ? totalEarnings[0].totalEarnings : 0;

    // Total recycled weight
    const totalWeight = await Order.aggregate([
        {
            $match: {
                status: ORDER_STATUS.RECYCLED
            }
        },
        {
            $unwind: "$orderItem"
        },
        {
            $group: {
                _id: null,
                totalWeight: { $sum: "$orderItem.weight" }
            }
        }
    ]);
    const totalWeightValue = totalWeight.length > 0 ? totalWeight[0].totalWeight : 0;

    // Today's collections
    const todaysOrders = await Order.aggregate([
        {
            $match: {
                status: ORDER_STATUS.RECYCLED,
                createdAt: {
                    $gte: startOfToday,
                    $lte: endOfToday
                }
            }
        },
        {
            $unwind: "$orderItem"
        },
        {
            $group: {
                _id: null,
                totalWeight: { $sum: "$orderItem.weight" }
            }
        }
    ]);
    const todaysCollectionWeight = todaysOrders.length > 0 ? todaysOrders[0].totalWeight : 0;

    // Count today's pickups
    const todaysPickupsCount = await Order.countDocuments({
        status: ORDER_STATUS.RECYCLED,
        createdAt: {
            $gte: startOfToday,
            $lte: endOfToday
        }
    });

    // Get last month's recycled weight for comparison
    const lastMonthWeight = await Order.aggregate([
        {
            $match: {
                status: ORDER_STATUS.RECYCLED,
                createdAt: {
                    $gte: startOfLastMonth,
                    $lt: startOfCurrentMonth
                }
            }
        },
        {
            $unwind: "$orderItem"
        },
        {
            $group: {
                _id: null,
                totalWeight: { $sum: "$orderItem.weight" }
            }
        }
    ]);
    const lastMonthWeightValue = lastMonthWeight.length > 0 ? lastMonthWeight[0].totalWeight : 0;

    // Calculate percentage change
    const weightChange = lastMonthWeightValue === 0
        ? 100
        : (((totalWeightValue - lastMonthWeightValue) / lastMonthWeightValue) * 100).toFixed(1);

    // Last month's earnings
    const lastMonthEarnings = await Order.aggregate([
        {
            $match: {
                status: ORDER_STATUS.RECYCLED,
                createdAt: {
                    $gte: startOfLastMonth,
                    $lt: startOfCurrentMonth
                }
            }
        },
        {
            $group: {
                _id: null,
                totalEarnings: { $sum: "$totalAmount" }
            }
        }
    ]);
    const lastMonthEarningsValue = lastMonthEarnings.length > 0 ? lastMonthEarnings[0].totalEarnings : 0;

    // Calculate percentage change for earnings
    const earningsChange = lastMonthEarningsValue === 0
        ? 100
        : (((totalEarningsValue - lastMonthEarningsValue) / lastMonthEarningsValue) * 100).toFixed(1);

    // Calculate collector change
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastWeekCollectors = await Order.countDocuments({
        status: ORDER_STATUS.ACCEPTED,
        updatedAt: { $lt: lastWeek }
    });

    const collectorsChange = activeCollectorsCount - lastWeekCollectors;

    const dashboardStats = [
        {
            title: "Total Recycled",
            icon: "Recycle",
            value: `${totalWeightValue.toFixed(1)} Kg`,
            change: `${weightChange > 0 ? '+' : ''}${weightChange}% from last month`
        },
        {
            title: "Active Collectors",
            icon: "Truck",
            value: activeCollectorsCount.toString(),
            change: `${collectorsChange >= 0 ? '+' : ''}${collectorsChange} this week`
        },
        {
            title: "Today's Collections",
            icon: "Scale",
            value: `${todaysCollectionWeight.toFixed(1)} Kg`,
            change: `${todaysPickupsCount} pickups completed`
        },
        {
            title: "Total Earnings",
            icon: "Banknote",
            value: `रु ${totalEarningsValue.toLocaleString('en-IN')}`,
            change: `${earningsChange > 0 ? '+' : ''}${earningsChange}% from last month`
        },
    ];

    return res
        .status(200)
        .json(new ApiResponse(200, dashboardStats, "Dashboard statistics fetched successfully"));
})

const getCollectionOverview = asyncHandler(async (req, res) => {

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Get monthly recycled weights
    const monthlyRecycledData = await Order.aggregate([
        {
            $match: {
                status: ORDER_STATUS.RECYCLED
            }
        },
        {
            $unwind: "$orderItem"
        },
        {
            $group: {
                _id: { $month: "$createdAt" },
                total: { $sum: "$orderItem.weight" }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const toatlMonths = 6;

    const data = [];
    for (let i = 0; i < toatlMonths; i++) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const monthName = monthNames[monthIndex];


        const monthData = monthlyRecycledData.find(item => item._id === monthIndex + 1);
        const total = monthData ? Math.round(monthData.total) : 0;

        data.unshift({
            name: monthName,
            total
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, data, "Collection overview fetched successfully"));
});


export {
    userStats,
    collectorStats,
    getDashboardStats,
    getCollectionOverview
};