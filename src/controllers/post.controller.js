import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import {Post} from '../models/post.model.js'

// Create Post

const createPost = asyncHandler(async (req, res) => {
    const { title, content, latitude, longitude } = req.body

    if([title, content, latitude, longitude].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Image local path did't found")
    }

    const imageLocalPath = req.files?.image[0]?.path;

    if (!imageLocalPath) {
        throw new ApiError(400, "Image is required")
    }

    const image = await uploadOnCloudinary(imageLocalPath)

    if (!image) {
        throw new ApiError(500, "Failed to upload image")
    }

    const post = await Post.create({
        title,
        content,
        photo: image.url,
        latitude,
        longitude,
        postedBy: req.user._id
    })

    return res.json(new ApiResponse(201, "Post created successfully", post))
})

// Get All Posts

const getAllPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find()

    return res.json(new ApiResponse(200, "All posts", posts))
}
)

// Get Post By Id

const getPostById = asyncHandler(async (req, res) => {
    const { postId } = req.params

    const post = await Post.findById(postId)

    if (!post) {
        throw new ApiError(404, "Post not found")
    }

    return res.json(new ApiResponse(200, "Post", post))
}
)


// Update Post

const updatePost = asyncHandler(async (req, res) => {
    const { postId } = req.params
    const { title, content, latitude, longitude } = req.body

    if ([title, content, latitude, longitude].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const post = await Post.findById(postId)

    if (!post) {
        throw new ApiError(404, "Post not found")
    }

    post.title = title
    post.content = content
    post.latitude = latitude
    post.longitude = longitude

    if (req.files?.photo) {
        const photoLocalPath = req.files.photo[0].path
        const photo = await uploadOnCloudinary(photoLocalPath)
        post.photo = photo
    }

    await post.save()

    return res.json(new ApiResponse(200, "Post updated successfully", post))
})

// Delete Post

const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params

    const post = await Post.findById(postId);

    if (!post) {
        throw new ApiError(404, "Post not found")
    }

    await Post.findByIdAndDelete(postId)

    return res.json(new ApiResponse(200, "Post deleted successfully"))
}
)





export {
    createPost,
    getAllPosts,
    getPostById,
    updatePost,
    deletePost
}