import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    videoId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: true
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text:{
        type: String,
        required: true
    }
},{timestamps:true })

export const Chat = mongoose.model("Chat",chatSchema)