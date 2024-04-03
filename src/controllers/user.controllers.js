import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken= user.generateRefreshToken()

        user.refreshToken = refreshToken

        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res)=>{
    // res.status(200).json({
    //     message : "ok, it's running"
    // })

    // get user details from frontend
    // validation - not empty
    // check if user already exists : username, email
    // check for images, check for avatar
    // upload to cloudinary, avatar
    // create user Object - create entry in db
    // remove password and refresh token field
    // check for user creation
    // return result

    const {username, email, fullName, password}= req.body
    console.log("email:", email);

    // validating
    if(
        [fullName, email, username, password].some((field)=> field?.trim()==="")
    ){
        throw new ApiError(400, "All fields are required")
    }

    // chcek existence
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    console.log(existedUser.username)

    if(existedUser){
        throw new ApiError(409, " User already existed")
    }

    // check avatar

    const avatarLocalPath= req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatarImage = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatarImage){
        throw new ApiError(400, "Avatar file is required")
    }

    // data base se baat krni hai
    User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createUser){
        throw new ApiError(500,"Something went wrong while creating user")
    }

    return res.status(201).json(
        new ApiResponse(200,createUser,"user registered successfully")
    )

})

const loginUser = asyncHandler(async(req, res)=>{
    //req body se data

    const {email, userName, password}= req.body

    // username or email hai ya nahi
    if(!username && !email){
        throw new ApiError (400, "username or email is required")
    }

    // find user
    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError (404, "user does not exist")
    }
    // password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid User Credentials")
    }

    // acess and refresh token dono hi generate krke send karna hoga
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    // send secured cookies
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options= {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser,refreshToken, accessToken
            },
            "User logged in successfully"
        )
    )
})

const logOutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken",options)
    .cookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"User log out")
    )

})

export {registerUser,loginUser, logOutUser}