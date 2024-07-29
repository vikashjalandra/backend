import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const generateAccessAndRefreshTokens = async (userId)=>{
try {
    
    const user = await User.findById(userId)
    console.log(user);
    const accessToken =user.generateAccessToken()
    const refreshToken =user.generateRefreshToken()

    user.refreshToken=refreshToken
    await user.save({validateBeforeSave:false})
    return {accessToken, refreshToken}

} catch (error) {
    throw new ApiError(500,"Cant genrate refresh and access token")
}
}

// Register User
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

// Login User
const loginUser =asyncHandler(async(req,res)=>{
    // take data from body
    const {email, username, password}=req.body;

    // username or email
    if (!(username||email)) {
        throw new ApiError(400,"username or email is required")
    } 
    console.log(`Email:${email} username:${username} password:${password}`);
    // find user
    const user = await User.findOne({
        $or:[{username},{email}]
        
    })
    
    if (!user) {
        throw new ApiError(404,"user not found")
    }
    
    // password check
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401,"Invalid Credentials")
    }

    // access and refresh token
    const {accessToken, refreshToken}=await generateAccessAndRefreshTokens(user._id)

    const loggedInUser =await User.findById(user._id).select("-password -refreshToken")

    const options ={
        httpOnly:true,
        secure:true
    }

    // send cookies
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,{
            user:loggedInUser,accessToken,refreshToken
        },"User logged in successfully")
    )
})

// Logout User
const logoutUser = asyncHandler(async(res,req)=>{
    console.log(req.user)
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
           
        },
        {
            new:true
        }
    )

    const options ={
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged out."))
})

export { 
    registerUser,
    loginUser,
    logoutUser
 }