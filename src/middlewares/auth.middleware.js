import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import JWT from "jsonwebtoken"

export const verifyJWT = asyncHandler(async(req, res, next)=>{
  try {
      const token =req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
      if (!token) {
          throw new ApiError(400,"Unauthorized request")
      }
      const decodedToken =JWT.verify(token, process.env.ACCESS_TOKEN_SECRET)
      
      const user =await User.findById(decodedToken?._id).select("-password -refreshToken")
      // console.log(user);
      if (!user) {
          throw new ApiError(401,"Invalid Access Token")
      }
  
      req.user=user
      console.log(req.user);
      next()
  } catch (error) {
    throw new ApiError(401, error?.message ||'Invalid access token')
  }

})