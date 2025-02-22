import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        uppercase: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    }

}, { timestamps: true });

categorySchema.pre("save", function (next) {
    
    if (!this.isModified("name")) return next();
    this.slug = slugify(this.name, { lower: true, strict: true });
    next();
});

export const Category = mongoose.model('Category', categorySchema);