import { v2 as cloudinary } from 'cloudinary';
import fs  from 'fs';

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME , 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});
    
const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) {
            throw new Error("No file path provided for upload");
        }
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto",
        })
        console.log("File uploaded successfully on cloudinary :", response);
        fs.unlinkSync(localFilePath); // removes the locally saved temporary file after upload
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath); // removes the locally saved temporary file as the upload failed
        console.log("Error uploading file to Cloudinary:", error);
        return null;
    }
}

export { uploadOnCloudinary };