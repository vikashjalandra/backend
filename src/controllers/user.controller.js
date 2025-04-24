import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import JWT from 'jsonwebtoken'
import mongoose from 'mongoose'

const generateAccessAndRefreshTokens = async (userId) => {
    try {

        const user = await User.findById(userId)
        console.log(user);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Cant genrate refresh and access token")
    }
}

// Register User
const registerUser = asyncHandler(async (req, res) => {
    // Get user details from frontend
    const { fullname, email, password } = req.body

    // Validation
    if (
        [fullname, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user exists
    const existedUser = await User.findOne({email})

    if (existedUser) {
        throw new ApiError(409, "User already exists")
    }

    // add data to db
    const user = await User.create({
        fullname,
        email,
        password,
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

// Login User
const loginUser = asyncHandler(async (req, res) => {
    // take data from body
    const { email, password } = req.body;

    // username or email
    if (! email) {
        throw new ApiError(400, " email is required")
    }
    console.log(`Email:${email} password:${password}`);
    // find user
    const user = await User.findOne({email})

    if (!user) {
        throw new ApiError(404, "user not found")
    }

    // password check
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid Credentials")
    }

    // access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    req.user= loggedInUser

    // send cookies
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser, accessToken, refreshToken,
            }, "User logged in successfully")
        )
})

// Logout User
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }

        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged out."))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(404, 'Unathorized request')
    }

    try {
        const decodedToken = JWT.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(404, 'Invalid Refresh Token')
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(404, 'Refresh token is expired or used')
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
        return res.status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(
                new ApiResponse(200, { accessToken, newRefreshToken }, "Access token refreshed")
            )
    } catch (error) {
        throw new ApiError(404, error?.message || "Invalid Refresh token")

    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findById(req.user?._id)
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid old password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        ))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;
    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullname,
                email
            }
        },
        { new: true }
    ).select("-password")

    console.log(user);

    return res.status(200)
        .json(new ApiResponse(200, user, 'Account details updated'))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error uploading avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res.status(200).json(new ApiResponse(200, user, 'Avatar updated'))
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
}