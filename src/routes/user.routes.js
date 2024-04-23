import { Router } from "express";
import { getUserChannelProfile, getWatchHistory, logOutUser, loginUser, refreshAccessToken, registerUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verify } from "jsonwebtoken";


const router = Router()

router.route("/register").post(
    upload.fields(
        [
            {
                name: "avatar",
                maxCount: 1
            },
            {
                name: "coverImage",
                maxCount:1
            }
        ]
        ),
    registerUser
    )

router.route("/login").post(loginUser)

// secured route
router.route("/logout").post(verifyJWT, logOutUser)

router.route("/refresh-token").post(refreshAccessToken)

// router.route("/current-user").get(verifyJWT, getCurrentUser)

// router.route("/update-account").patch(verifyJWT, updateAccountDetails)

// router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

// router.route("/cover-image").path(verifyJWT, upload.single("cover-image"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/c/:history").get(verifyJWT, getWatchHistory)


export default router