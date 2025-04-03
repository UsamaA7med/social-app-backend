import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Define __filename and __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  cloudinaryDeleteImage,
  cloudinaryUploadImage,
} from "../config/cloudinary.js";
import asyncMiddleware from "../middlewares/asyncMiddleware.js";
import Post from "../models/postModel.js";
import { User } from "../models/userModel.js";
import generateError from "../utils/generateError.js";

const createPost = asyncMiddleware(async (req, res, next) => {
  let newPost;
  if (req.file) {
    const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
    const result = await cloudinaryUploadImage(imagePath);
    newPost = new Post({
      content: req.body.text,
      user: req.user._id,
      postImage: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
    fs.unlinkSync(imagePath);
  } else {
    newPost = new Post({
      user: req.user._id,
      content: req.body.text,
    });
  }
  newPost.user = req.user._id;
  await newPost.save();
  res.status(201).json({ status: "success", data: newPost });
});

const getAllPosts = asyncMiddleware(async (req, res, next) => {
  const posts = await Post.find()
    .populate("user")
    .populate("comments.user")
    .sort({ createdAt: -1 });
  res.json({ status: "success", data: posts });
});

const toggleFollow = asyncMiddleware(async (req, res, next) => {
  const userToFollow = await User.findById(req.params.id).populate("posts");
  if (!userToFollow) {
    return next(generateError("User not found", 404, "error"));
  }
  if (userToFollow.followers.includes(req.user._id)) {
    req.user.following = req.user.following.filter(
      (followId) => followId.toString() !== userToFollow._id.toString()
    );
    userToFollow.followers = userToFollow.followers.filter(
      (followId) => followId.toString() !== req.user._id.toString()
    );
  } else {
    req.user.following.push(userToFollow._id);
    userToFollow.followers.push(req.user._id);
    userToFollow.notifications.push({
      from: req.user._id,
      content: "following you",
    });
  }
  await req.user.save();
  await userToFollow.save();
  res.json({ status: "success", data: req.user });
});

const toggleLike = asyncMiddleware(async (req, res, next) => {
  const post = await Post.findById(req.params.id).populate("user");
  if (!post) {
    return next(generateError("Post not found", 404, "error"));
  }
  if (post.likes.includes(req.user._id)) {
    post.likes = post.likes.filter(
      (likeId) => likeId.toString() !== req.user._id.toString()
    );
  } else {
    post.likes.push(req.user._id);
    if (req.user._id.toString() !== post.user._id.toString()) {
      post.user.notifications.push({
        from: req.user._id,
        content: "liked your post",
      });
    }
    await post.user.save();
  }
  await post.save();
  const posts = await Post.find()
    .populate({
      path: "user",
    })
    .populate("comments.user")
    .sort({ createdAt: -1 });
  res.json({ status: "success", data: posts });
});

const createComment = asyncMiddleware(async (req, res, next) => {
  const post = await Post.findById(req.params.id).populate("user");
  if (!post) {
    return next(generateError("Post not found", 404, "error"));
  }
  const newComment = {
    content: req.body.content,
    user: req.user._id,
  };
  post.comments.push(newComment);
  if (req.user._id.toString() !== post.user._id.toString()) {
    await post.user.notifications.push({
      from: req.user._id,
      content: "commented on your post",
    });
  }
  await post.user.save();
  await post.save();
  const posts = await Post.find()
    .populate("user")
    .populate("comments.user")
    .sort({ createdAt: -1 });
  res.json({ status: "success", data: posts });
});

const deletePost = asyncMiddleware(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next(generateError("Post not found", 404, "error"));
  }
  if (post.postImage.publicId) {
    await cloudinaryDeleteImage(post.postImage.publicId);
  }
  await Post.findByIdAndDelete(req.params.id);
  const posts = await Post.find().populate("user").populate("comments.user");
  res.json({ status: "success", data: posts });
});

const deleteComment = asyncMiddleware(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post) {
    return next(generateError("Post not found", 404, "error"));
  }
  const comment = post.comments.id(req.params.commentId);
  if (!comment) {
    return next(generateError("Comment not found", 404, "error"));
  }
  post.comments = post.comments.filter((comment) => {
    return comment._id.toString() !== req.params.commentId;
  });
  await post.save();
  const posts = await Post.find()
    .populate("user")
    .populate("comments.user")
    .sort({ createdAt: -1 });
  res.json({ status: "success", data: posts });
});

const updateComment = asyncMiddleware(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post) {
    return next(generateError("Post not found", 404, "error"));
  }
  const comment = post.comments.id(req.params.commentId);
  if (!comment) {
    return next(generateError("Comment not found", 404, "error"));
  }
  comment.content = req.body.content;
  await post.save();
  const posts = await Post.find()
    .populate("user")
    .populate("comments.user")
    .sort({ createdAt: -1 });
  res.json({ status: "success", data: posts });
});

const updatePost = asyncMiddleware(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post) {
    return next(generateError("Post not found", 404, "error"));
  }
  post.content = req.body.content;
  await post.save();
  const posts = await Post.find()
    .populate("user")
    .populate("comments.user")
    .sort({ createdAt: -1 });
  res.json({ status: "success", data: posts });
});

export {
  createPost,
  getAllPosts,
  toggleFollow,
  toggleLike,
  createComment,
  deletePost,
  deleteComment,
  updateComment,
  updatePost,
};
