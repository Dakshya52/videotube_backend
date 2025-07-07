import {Chat} from '../models/chat.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { isValidObjectId } from 'mongoose';

export const getMessagesByVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video ID');
    }

    const messages = await Chat.find({videoId:videoId})
        .populate('userId', 'name avatar') // populate user info if needed
        .sort({ createdAt: 1 })
        .lean();

    return res.status(200).json(
        new ApiResponse(200, messages, 'Chat messages fetched successfully')
    );
});

export const createMessage = async ({ videoId, userId, text }) => {
    return await Chat.create({ videoId, userId, text });
};
