import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {

    try {
        if (!localFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "scrapDai"
        })

        fs.unlinkSync(localFilePath)

        return response;

    } catch (error) {
        console.log("Error while uploading file on cloudinary", error)
        fs.unlinkSync(localFilePath)
        return null;

    }

}

const deleteFromCloudinary = async (cloudinaryPublicUrl) => {

    try {

        if (!cloudinaryPublicUrl) {
            console.log("cloudinaryPublicUrl is required")
            return null
        }

        // extracting file name without extension (.png)
        const urlArray = cloudinaryPublicUrl.split("/")
        const imageFullName = urlArray[(urlArray.length) - 1]
        const imageName = imageFullName.split(".")[0]

        const response = await cloudinary.uploader.destroy(imageName)

        return response.result

    } catch (error) {
        console.log("Error while deleting file from cloudinary", error)
    }
}

export { uploadOnCloudinary, deleteFromCloudinary }