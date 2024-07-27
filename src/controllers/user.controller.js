import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { response } from 'express'

const registerUser = asyncHandler(async (req, res) => {
    // Get user details from frontend
    const { fullname, email, username, password } = req.body

    // Validation
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User already exists")
    }

    // Check for images
    const avatarLocalPath = req.files?.avatar[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    // console.log('Coverimage: '+coverImageLocalPath);


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // Upload images
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage =  async()=> {  
        if (coverImageLocalPath) {
            
             return uploadOnCloudinary(coverImageLocalPath)
        }
    }
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // add data to db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // remove password and refresh token from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, 'Problem with user registration')
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered succesfully")
    )
});
export { registerUser }