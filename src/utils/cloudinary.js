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

const deleteFromCloudinary = async(public_id,resource_type="image")=>{
    try {
        if(!public_id){
            return null
        }

        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: `${resource_type}`
        })
        console.log(result)
    } catch (error) {
        console.log("Error in deleting the file from cloudinary",error)
        return null
    }
}

export { uploadOnCloudinary , deleteFromCloudinary };