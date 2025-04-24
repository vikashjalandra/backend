import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    photo: {
        type: String,
    },
    likes: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    dislikes: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    catogories: [
        {
            type:String,
        }
    ],
    comments: [
        {
            text: String,
            postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
    ],
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    latitude: {
        type: String,
    },
    longitude: {
        type: String,
    },
}, { timestamps: true });

export const Post = mongoose.model("Post", postSchema);
