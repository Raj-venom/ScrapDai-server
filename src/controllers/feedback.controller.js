import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Order } from "../models/order.model.js";
import { Feedback } from "../models/feedback.model.js";


const upsertFeedback = asyncHandler(async (req, res) => {


    const { orderId } = req.params;
    const { userRating, userReview, collectorRating, collectorReview } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    let feedback = await Feedback.findOne({ order: orderId });

    // Check if the user or collector is allowed to give feedback
    if (order.user.toString() !== req.user._id.toString() && order.collector.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to give feedback for this order");
    }

    if (!feedback) {
        feedback = new Feedback({
            order: orderId,
            userRating,
            userReview,
            collectorRating,
            collectorReview
        });
    } else {
        feedback.userRating = userRating || feedback.userRating;
        feedback.userReview = userReview || feedback.userReview;
        feedback.collectorRating = collectorRating || feedback.collectorRating;
        feedback.collectorReview = collectorReview || feedback.collectorReview;
    }

    await feedback.save();

    // Update the order with the new feedback ID
    order.feedback = feedback._id;
    await order.save();

    return res
        .status(200)
        .json(new ApiResponse(200, feedback, "Feedback created/updated successfully"));


})


const getAllFeedback = asyncHandler(async (req, res) => {
    const feedbacks = await Feedback.find().populate('order').populate('user').populate('collector');
    return res.status(200).json(new ApiResponse(200, feedbacks, "All feedbacks fetched successfully"));
})


const getFeedbackById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const feedback = await Feedback.findById(id).populate('order').populate('user').populate('collector');
    if (!feedback) {
        throw new ApiError(404, "Feedback not found");
    }
    return res.status(200).json(new ApiResponse(200, feedback, "Feedback fetched successfully"));
});



const deleteFeedback = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const feedback = await Feedback.findByIdAndDelete(id);

    if (!feedback) {
        throw new ApiError(404, "Feedback not found");
    }

    const order = await Order.findById(feedback.order);

    if (order) {
        order.feedback = null;
        await order.save();
    }



    return res.status(200).json(new ApiResponse(200, feedback, "Feedback deleted successfully"));
});


const getFeedbackByOrderId = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const feedback = await Feedback.findOne({ order: orderId }).populate('order').populate('user').populate('collector');
    if (!feedback) {
        throw new ApiError(404, "Feedback not found");
    }
    return res.status(200).json(new ApiResponse(200, feedback, "Feedback fetched successfully"));
});



const getAllFeedbackOfCollector = asyncHandler(async (req, res) => {
    const { collectorId } = req.params;

    const feedbacks = await Order.aggregate([
        { $match: { collector: new mongoose.Types.ObjectId(collectorId) } },

        { $match: { feedback: { $ne: null } } },

        {
            $lookup: {
                from: "feedbacks",
                localField: "feedback",
                foreignField: "_id",
                as: "feedbackDetails"
            }
        },

        { $unwind: "$feedbackDetails" },

        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDetails"
            }
        },

        {
            $lookup: {
                from: "collectors",
                localField: "collector",
                foreignField: "_id",
                as: "collectorDetails"
            }
        },

        {
            $project: {
                _id: "$feedbackDetails._id",
                order: "$feedbackDetails.order",
                userRating: "$feedbackDetails.userRating",
                userReview: "$feedbackDetails.userReview",
                collectorRating: "$feedbackDetails.collectorRating",
                collectorReview: "$feedbackDetails.collectorReview",
                createdAt: "$feedbackDetails.createdAt",
                updatedAt: "$feedbackDetails.updatedAt",
                user: { $arrayElemAt: ["$userDetails", 0] },
                collector: { $arrayElemAt: ["$collectorDetails", 0] }
            }
        }
    ]);

    if (feedbacks.length === 0) {
        throw new ApiError(404, "No feedback found for this collector");
    }

    return res.status(200).json(new ApiResponse(200, feedbacks, "Feedbacks fetched successfully"));
});


const getAllFeedbackOfUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const feedbacks = await Order.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },

        { $match: { feedback: { $ne: null } } },

        {
            $lookup: {
                from: "feedbacks",
                localField: "feedback",
                foreignField: "_id",
                as: "feedbackDetails"
            }
        },

        { $unwind: "$feedbackDetails" },

        {
            $lookup: {
                from: "collectors",
                localField: "collector",
                foreignField: "_id",
                as: "collectorDetails"
            }
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
            $project: {
                _id: "$feedbackDetails._id",
                order: "$feedbackDetails.order",
                userRating: "$feedbackDetails.userRating",
                userReview: "$feedbackDetails.userReview",
                collectorRating: "$feedbackDetails.collectorRating",
                collectorReview: "$feedbackDetails.collectorReview",
                createdAt: "$feedbackDetails.createdAt",
                updatedAt: "$feedbackDetails.updatedAt",
                collector: { $arrayElemAt: ["$collectorDetails", 0] },
                user: { $arrayElemAt: ["$userDetails", 0] }
            }
        }
    ]);

    if (feedbacks.length === 0) {
        throw new ApiError(404, "No feedback found for this user");
    }

    return res.status(200).json(new ApiResponse(200, feedbacks, "Feedbacks fetched successfully"));
});

export {
    upsertFeedback,
    getAllFeedback,
    getFeedbackById,
    deleteFeedback,
    getFeedbackByOrderId,
    getAllFeedbackOfCollector,
    getAllFeedbackOfUser
};