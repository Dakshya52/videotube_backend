import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
import { RiQqFill } from "react-icons/ri"

const generatePublicIdForTheCloudinaryUrl = (url)=>{
    const urlSplit = url.split("/")
    let publicId = urlSplit[urlSplit.length-1]
    publicId = publicId.split(".")[0];
    // console.log(publicId)
    return publicId
}

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    const pipeline = [];

    // Full-text search
    if (query) {
        pipeline.push({
            $search: {
                index: "search-videos",
                text: {
                    query: query,
                    path: ["title", "description"]
                }
            }
        });
    }

    // Filter by userId if provided
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }

        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    // Only published videos
    pipeline.push({
        $match: {
            isPublished: true
        }
    });

    // Sorting logic
    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({
            $sort: { createdAt: -1 }
        });
    }

    // Join with user data
    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        }
    );

    // Setup pagination
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };
    const video = await Video.aggregate(pipeline)
    // console.log(video)
    // Run aggregation with pagination
    const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    if([title,description].some((field)=> field?.trim()==="")) {
        throw new ApiError(400, "Title and description are required to publish a video")
    }

    const localVideoFilePath = req.files.videoFile[0].path;

    const localThumbnailFilePath = req.files.thumbnail[0].path;

    if(!localVideoFilePath || !localThumbnailFilePath) {
        throw new ApiError(400, "Video file and thumbnail are required to publish a video")
    }

    const videoFile = await uploadOnCloudinary(localVideoFilePath)

    const thumbnail = await uploadOnCloudinary(localThumbnailFilePath)

    if(!videoFile || !thumbnail) {
        throw new ApiError(500, "Failed to upload video or thumbnail to cloudinary")
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail:thumbnail.url,
        title,
        description,
        duration:videoFile.duration,
        views:0,
        isPublished:true,
        owner: req.user._id // this is done so that we can get the owner of the video later
    })

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video published successfully"))
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId)
        .populate({
            path: "owner",
            select: "username avatar.url"
        });

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title,description} = req.body
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }
    let video = await Video.findById(videoId);
    if (!video){ 
        throw new ApiError(404, "Video not found");
    }
    if (req.user._id.toString() !== video.owner.toString()) {
        throw new ApiError(403, "You are not allowed to update this video");
    }
    if((!title&&!description&&!req.file)||(title?.trim()==="" && description?.trim()==="" && !req.file)) {
        throw new ApiError(400, "At least one field is required to update the video")
    }
    const localThumbnailFilePath = req.file ? req.file.path : null;
    let thumbnail ;
    if(localThumbnailFilePath){
        thumbnail = await uploadOnCloudinary(localThumbnailFilePath);
        if (!thumbnail) {
            throw new ApiError(500, "Failed to upload thumbnail to cloudinary");
        }
    }
    video = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                title: title?.trim() || undefined,
                description: description?.trim() || undefined,
                thumbnail: thumbnail ? thumbnail.url : undefined
            }
        },{new:true})

    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video updated successfully"));
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }
    let video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (req.user._id.toString() !== video.owner.toString()) {
        throw new ApiError(403, "You are not allowed to delete this video");
    }
    
    await deleteFromCloudinary(generatePublicIdForTheCloudinaryUrl(video.videoFile),"video")
    await deleteFromCloudinary(generatePublicIdForTheCloudinaryUrl(video.thumbnail),"image")
    const deletedVideo = await Video.findByIdAndDelete(videoId)

    await Like.deleteMany({
        video: videoId
    })

    
    await Comment.deleteMany({
        video: videoId,
    })

    return res
    .status(200)
    .json(new ApiResponse(200,deletedVideo,"Video deleted successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    let video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"Invalid video id")
    }
    if(req.user._id!=video.owner.toString()){
        throw new ApiError(403,"You dont have permission to change the video settings")
    }
    let updatedPublished = video.isPublished
    updatedPublished = !updatedPublished
    video = await Video.findByIdAndUpdate(videoId,
        {
            isPublished:updatedPublished
        },
        {
            new:true
        }
    )
    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video is toggled"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}