import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { is } from "jsdom/lib/jsdom/living/generated/Element.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const {userId} = req.user._id

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    const currentLike = await Like.findOne({
        videoId: videoId,
        likedBy: userId
    })

    if(currentLike){
        await Like.findByIdAndDelete(currentLike._id)
        return res.status(200).json(new ApiResponse(200, currentLike, "Unliked video successfully"))
    }
    else{
        const newLike = await Like.create({
            video:videoId,
            likedBy: userId
        })
        return res.status(201).json(new ApiResponse(201, newLike, "Liked video successfully"))
    }

    //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid commentId")
    }

    const {userId} = req.user._id

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    const currentLike = await Like.findOne({
        commentId: commentId,
        likedBy: userId
    })

    if(currentLike){
        await Like.findByIdAndDelete(currentLike._id)
        return res.status(200).json(new ApiResponse(200, currentLike, "Unliked comment successfully"))
    }
    else{
        const newLike = await Like.create({
            commentId:commentId,
            likedBy: userId
        })
        return res.status(201).json(new ApiResponse(201, newLike, "Liked comment successfully"))
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const {userId} = req.user._id

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $ne: null } // Ensure we only get likes on videos
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $project: {
                _id: 1,
                videoDetails: 1,
                likedAt: 1
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"))

})

export {
    toggleCommentLike,
    toggleVideoLike,
    getLikedVideos
}