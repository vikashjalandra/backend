import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const videos = await Video.find({isPublished:true})
    if (!videos) {
        throw new ApiError(200,"Don't have videos")
    }

    return new ApiResponse(200,videos,"Videos") 
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, discription} = req.body
    if(!title){
        throw new ApiError(400, "Title is required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    if(!videoLocalPath){
        throw new ApiError(400, "Video is required")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    console.log(videoFile);
    
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!videoFile) {
        throw new ApiError(400, "Video dosen't uploaded on cloudnary")
    }
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail dosen't uploaded on cloudnary")
    }

    const video = await Video.create({
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        title,
        discription,
        duration:videoFile.duration,
        owner:req.user._id
    })
    await video.save({ validateBeforeSave: false })
    return res.status(200).json(new ApiResponse(200,{},"Video Uploaded Successfully."))
    
    // TODO: get video, upload to cloudinary, create video
    
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404,"Video not found")
    } else if (video.isPublished==false) {
        throw new ApiError(401,"Video is private")
    }

    return res.status(200).json(new ApiResponse(200,video))
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const videoPath = await Video.findById(videoId)
    if (!videoPath) {
        throw new ApiError(404,"Video not found")
    } 
    const {title, discription} =req.body
    const thumbnailLocalPath =req.file?.path
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                discription,
                thumbnail:thumbnail.url
            }
        }
    )

    return res.status(200).json(new ApiResponse(200,video,"Video Updated"))
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const videoPath = await Video.findById(videoId)
    if (!videoPath) {
        throw new ApiError(404,"Video not found")
    } 
    await Video.findByIdAndDelete({_id:videoId})
    return res.status(200).json(200 , "Video deleted")
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {status} = req.body
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404,"Video not found")
    }

    await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished:status
            }
        }
    )
    return res.status(200).json(new ApiResponse(200,{},"Video status updated"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}