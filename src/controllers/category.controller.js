import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Category } from "../models/category.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import slugify from "slugify";
import { Scrap } from "../models/scrap.model.js";



const addNewCategory = asyncHandler(async (req, res) => {

    // get category name, description and image from the form
    // validate the fields
    // check if category with this name already exists
    // upload image to cloudinary
    // create a new category
    // send response

    // TODO: check if admin is requesting or not
    const { name, description } = req.body
    const categoryImageLocalPath = req.file?.path

    if (
        [name, description].some((field) => field?.trim() === "" || field?.trim() == undefined)
    ) {
        throw new ApiError(400, "All field are required")
    }

    if (!categoryImageLocalPath) {
        throw new ApiError(400, "Category image is required")
    }

    const existingCategory = await Category.findOne({ name })

    if (existingCategory) {
        throw new ApiError(400, "Category with this name already exists")
    }

    const image = await uploadOnCloudinary(categoryImageLocalPath)

    if (!image.url) {
        throw new ApiError(500, "Something went wrong while uploading image")
    }

    const slug = slugify(name, { lower: true, strict: true })

    const category = await Category.create({
        name,
        description,
        image: image.url,
        slug
    })

    if (!category) {
        throw new ApiError(500, "Something went wrong while creating category")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, category, "Category created successfully"))

})


const getAllCategories = asyncHandler(async (req, res) => {

    const categories = await Category.aggregate([
        {
            $lookup: {
                from: "scraps",
                localField: "_id",
                foreignField: "category",
                as: "scraps"
            }
        },
        {
            $project: {
                name: 1,
                slug: 1,
                description: 1,
                image: 1,
                createdAt: 1,
                updatedAt: 1,
                scraps: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    scrapImage: 1,
                    pricePerKg: 1,
                },
            },
        }
    ])

    if (!categories || categories.length === 0) {
        throw new ApiError(400, "No categories found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, categories, "All categories fetched successfully"))
})


// get single category using slug or id  and populate scraps
const getSingleCategory = asyncHandler(async (req, res) => {

    const { slug } = req.params

    const isValidObjectId = mongoose.Types.ObjectId.isValid(slug)

    const category = await Category.aggregate([
        {
            $match: {
                $or: [{ slug }, { _id: isValidObjectId ? mongoose.Types.ObjectId(slug) : null }]
            }
        },
        {
            $lookup: {
                from: "scraps",
                localField: "_id",
                foreignField: "category",
                as: "scraps"
            }
        }, {
            $project: {
                name: 1,
                slug: 1,
                description: 1,
                image: 1,
                createdAt: 1,
                updatedAt: 1,
                scraps: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    scrapImage: 1,
                    pricePerKg: 1,
                },
            },
        }
    ])


    if (!category || category.length === 0) {
        throw new ApiError(404, "Category not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category fetched successfully"))


})

const updateCategory = asyncHandler(async (req, res) => {

    const { id } = req.params
    const { name, description } = req.body
    const categoryImageLocalPath = req.file?.path

    const isValidObjectId = mongoose.Types.ObjectId.isValid(id)
    if (!isValidObjectId) {
        throw new ApiError(400, "Invalid category id")
    }

    const existingCategory = await Category.findById(id)

    if (!existingCategory) {
        throw new ApiError(404, "Category not found")
    }

    const updatedFields = {
        name: name || existingCategory.name,
        description: description || existingCategory.description,
    }

    if (categoryImageLocalPath) {
        const image = await uploadOnCloudinary(categoryImageLocalPath)
        updatedFields.image = image.url
    }

    const slug = slugify(name, { lower: true, strict: true })
    updatedFields.slug = slug

    const category = await Category.findByIdAndUpdate(id, updatedFields, { new: true })

    if (!category) {
        throw new ApiError(500, "Something went wrong while updating category")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category updated successfully"))


});


// delete category
const deleteCategory = asyncHandler(async (req, res) => {

    const { id } = req.params
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id)

    if (!isValidObjectId) {
        throw new ApiError(400, "Invalid category id")
    }

    const existingCategory = await Category.findById(id)

    if (!existingCategory) {
        throw new ApiError(404, "Category not found")
    }


    const existingCategoryScraps = await Scrap.find({ category: id })


    if (existingCategoryScraps.length > 0) {
        const categoryScrapDeleted = await Scrap.deleteMany({ category: id })

        // if all scraps deleted successfully with no errors
        if (!categoryScrapDeleted) {
            throw new ApiError(500, "Something went wrong while deleting scraps")
        }

        // if some scraps deleted successfully with no errors
        if (categoryScrapDeleted && categoryScrapDeleted.deletedCount < existingCategoryScraps.length) {
            throw new ApiError(500, "Some scraps failed to delete")
        }

        // if no scraps deleted successfully with no errors
        if (categoryScrapDeleted && categoryScrapDeleted.deletedCount === 0) {
            throw new ApiError(500, "No scraps deleted successfully")
        }


    }

    const category = await Category.findByIdAndDelete(id)


    if (!category) {
        throw new ApiError(500, "Something went wrong while deleting category")
    }


    return res
        .status(200)
        .json(new ApiResponse(200, null, "Category deleted successfully"))

})

export {
    addNewCategory,
    getAllCategories,
    getSingleCategory,
    updateCategory,
    deleteCategory

}