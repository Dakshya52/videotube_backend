import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'; // Assuming you have a User model defined
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const registerUser = asyncHandler(async(req, res) => {
    const {userName,email,password,fullName} = req.body;
    console.log(req.body);

    if(
        [fullName,userName,email,password].some((field)=> field.trim()==="")
    ){
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or:[{userName},{email}]
    })
    
    if(existedUser){
        throw new ApiError(409, "User already exists with this username or email");
    }

    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath ;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }
    
    if(req.files&& Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Failed to upload avatar image");
    }

    const user = await User.create(
        {
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            userName: userName.toLowerCase()
        }
    )

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while regestring the user ");
    }

    return res.status(201).json(new ApiResponse(200,createdUser,"User registered successfully"));

})

const generateAccessAndRefreshTokens = async (userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken 
        await user.save({validateBeforeSave: false});
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access or refresh tokens");
    }
}

const loginUser = asyncHandler(async(req,res)=>{
    // receive userName and password
    // validate for empty fields
    // check if user exists with the given userName
    // if user exists toh login 
    // passwrod check and refresh token check 
    // send cookies 

    const {userName,password,email} = req.body;

    if(!userName&&!email){
        throw new ApiError(400, "Username or email are required");
    }

    const user = await User.findOne({$or: [{userName},{email}]})

    if(!user){
        throw new ApiError(404, "User not found with this username or email");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly : true,
        secure : true,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {user:loggedInUser,accessToken,refreshToken}), "User logged in successfully");


})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken: 1
            }
        },
        { 
            new: true,
        }
    )

    const options = {
        httpOnly : true,
        secure : true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Refresh token is required");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRECT)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token or user not found");
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is used");
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        const options = {
            httpOnly : true,
            secure : true,
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {accessToken,refreshToken}, "Access token refreshed successfully"))
    } catch (error) {
        throw new ApiError(401, "Failed to refresh access token, invalid refresh token");
    }

})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,userName,email} = req.body;

    if(!fullName&&!userName&&!email){
        throw new ApiError(400, "At least one field is required to update");
    }

    if(fullName.trim()==="" || userName.trim()==="" || email.trim()===""){
        throw new ApiError(400, "Fields cannot be empty");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName,
                userName: userName.toLowerCase(),
                email
            }
        },
        {
            new : true,
        }
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    const uploadAvatar = await uploadOnCloudinary(avatarLocalPath);

    if(!uploadAvatar.url){
        throw new ApiError(400, "Failed to upload avatar image in cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : uploadAvatar.url
            }
        },
        {
            new : true,
        }
        
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file is required");
    }

    const uploadCoverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!uploadCoverImage.url){
        throw new ApiError(400, "Failed to upload cover image in cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage : uploadCoverImage.url
            }
        },
        {
            new : true,
        }
        
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage updated successfully"));
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {userName} = req.params

    if (!userName?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField : "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline :[
                    {
                        $lookup:{
                            from : "users",
                            localField : "owner",
                            foreignField: "_id",
                            as : "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner: {
                                $first: "$owner" 
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"));
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}