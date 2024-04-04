import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
// export const verifyJWT = asyncHandler(async(req, _, next)=>{
    // agar kuch nahi aaye to khali rakhne ke liye shi hai ye
export const verifyJWT = asyncHandler(async(req, res, next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if(!token){
            throw new ApiError(401, "Authorization error")
        }

        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodeToken?._id).select("-password -refreshToken")

        if(!user){
            //TODO: discuss about refreshToken
            throw new ApiError(401, "Invalid access Token")
        }

        req.user = user
        next()

    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")
    }
})