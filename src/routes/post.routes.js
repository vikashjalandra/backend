import { Router } from "express";
import { createPost, deletePost, getAllPosts, getPostById, updatePost } from "../controllers/post.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/").get(getAllPosts)
router.route("/:postId").get(getPostById)

// secured routes
router.route("/").post(verifyJWT, 
    upload.fields([
        {
            name:"image",
            maxCount:1
        },
    ]),
     createPost)
router.route("/:postId").patch(verifyJWT, upload.single("photo"), updatePost)
router.route("/:postId").delete(verifyJWT, deletePost)

export default router;