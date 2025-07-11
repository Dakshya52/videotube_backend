import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"; // Assuming you have a User model defined
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async(req,_,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if(!token){
            throw new ApiError(401, "Unauthorized request access");
        }
        
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401, "Invalid access token");
        }
    
        req.user = user;
        // It attaches the user object to the request, allowing access to user data in subsequent middleware or route handlers.
        next();
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid access token ");
    }

})