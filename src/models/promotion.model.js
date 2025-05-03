import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    imageUrl: {
        type: String,
        required: [true, 'Image URL is required'],
        trim: true
    },
    url: {
        type: String,
        trim: true
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
        validate: {
            validator: function (value) {
                return value > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Middleware to update isActive based on dates
promotionSchema.pre('save', function (next) {
    const now = new Date();
    this.isActive = now >= this.startDate && now <= this.endDate;
    next();
});

// Static method to get active promotions
promotionSchema.statics.getActivePromotions = function () {
    const now = new Date();
    return this.find({
        startDate: { $lte: now },
        endDate: { $gte: now }
    });
};



export const Promotion = mongoose.model('Promotion', promotionSchema);
