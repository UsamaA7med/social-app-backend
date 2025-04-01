import express from "express";
import {
  createComment,
  createPost,
  deleteComment,
  deletePost,
  getAllPosts,
  toggleFollow,
  toggleLike,
  updateComment,
  updatePost,
} from "../controllers/postControllers.js";
import uploadImage from "../utils/photoUpload.js";
import protectedMiddleware from "../middlewares/protectedMiddleware.js";

const postRoutes = express.Router();

postRoutes.post(
  "/create",
  protectedMiddleware,
  uploadImage.single("image"),
  createPost
);

postRoutes.get("/getAllPosts", protectedMiddleware, getAllPosts);

postRoutes.get("/toggleFollow/:id", protectedMiddleware, toggleFollow);

postRoutes.get("/toggleLike/:id", protectedMiddleware, toggleLike);

postRoutes.post("/createComment/:id", protectedMiddleware, createComment);

postRoutes.delete(
  "/deleteComment/:postId/:commentId",
  protectedMiddleware,
  deleteComment
);

postRoutes.put(
  "/updateComment/:postId/:commentId",
  protectedMiddleware,
  updateComment
);

postRoutes.delete("/deletePost/:id", protectedMiddleware, deletePost);

postRoutes.put("/updatePost/:postId/", protectedMiddleware, updatePost);

export default postRoutes;
