import asyncMiddleware from "../middlewares/asyncMiddleware.js";
import { User, validateLogin, validateSignup } from "../models/userModel.js";
import generateError from "../utils/generateError.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/generateTokenAndSetCookie.js";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import path from "path";
import sharp from "sharp";
import {
  cloudinaryDeleteImage,
  cloudinaryUploadImage,
} from "../config/cloudinary.js";
import Post from "../models/postModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import nodemailer from "nodemailer";
import OTP from "../models/OTPVerification.js";

let transporter = nodemailer.createTransport({
  service: "gmail",
  port: 3000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const SendOTPVerificationEmail = asyncMiddleware(async (req, res, next) => {
  await OTP.findOneAndDelete({ email: req.body.email || req.params.email });
  const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
  const hashedOTP = await bcrypt.hash(otp, 11);
  const otpVerification = new OTP({
    email: req.body.email || req.params.email || req.user.email,
    otp: hashedOTP,
    expiresIn: new Date(Date.now() + 5 * 60 * 1000),
  });
  await otpVerification.save();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: req.body.email || req.params.email || req.user.email,
    subject: "OTP Verification",
    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 20px auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center;">
        <h2 style="color: #333;">OTP Verification</h2>
        <p style="color: #555;">Your One-Time Password (OTP) for verification is:</p>
        <div style="font-size: 24px; font-weight: bold; color: #333; background: #f8f9fa; display: inline-block; padding: 10px 20px; border-radius: 4px; margin: 20px 0;">${otp}</div>
        <p style="color: #555;">This OTP is valid for only <strong>5 minutes</strong>. Do not share it with anyone.</p>
        <p style="color: #555;">If you did not request this code, please ignore this email.</p>
        <div style="font-size: 14px; color: #777; margin-top: 20px;">&copy; 2025 SocialApp. All rights reserved.</div>
    </div>
</body>
</html>
`,
  };
  await transporter.sendMail(mailOptions);
});

const signup = asyncMiddleware(async (req, res, next) => {
  const { error } = validateSignup(req.body);
  if (error) {
    return next(generateError(error.details[0].message, 500, "error"));
  }
  const usernameExists = await User.findOne({
    username: req.body.username,
  });
  if (usernameExists) {
    return next(generateError("Username already exists", 400, "error"));
  }
  const emailExists = await User.findOne({
    email: req.body.email,
  });
  if (emailExists) {
    return next(generateError("Email already exists", 400, "error"));
  }
  const hashedPassword = await bcrypt.hash(req.body.password, 11);
  const newUser = new User({ ...req.body, password: hashedPassword });
  await newUser.save();
  res.status(201).json({ message: "User created successfully", user: newUser });
});

const login = asyncMiddleware(async (req, res, next) => {
  const { error } = validateLogin(req.body);
  if (error) {
    return next(generateError(error.details[0].message, 500, "error"));
  }
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(generateError("Invalid email or password", 400, "error"));
  }
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) {
    return next(generateError("Invalid email or password", 400, "error"));
  }
  await generateTokenAndSetCookie(
    user.email,
    user.username,
    user.isVerified,
    res
  );
  res.json({ data: user });
});

const checkAuth = asyncMiddleware(async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return next(generateError("Invalid token", 401, "error"));
  }
  const decoded = await jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded.isVerified) {
    return next(generateError("User not verified", 403, "error"));
  }
  const user = await User.findOne({ email: decoded.email })
    .populate("posts")
    .populate("notifications.from")
    .sort({ createdAt: -1 });
  if (!user) {
    return next(generateError("User not found", 401, "error"));
  }
  res.json({ data: user });
});

const logout = asyncMiddleware(async (req, res, next) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
  });
  res.json({ message: "Logged out successfully" });
});

const updateProfile = asyncMiddleware(async (req, res, next) => {
  if (req.files) {
    if (req.files.profileImage) {
      if (req.user.profileImage.publicId) {
        await cloudinaryDeleteImage(req.user.profileImage.publicId);
      }

      const file = req.files.profileImage[0]; // File buffer in memory

      const b64 = Buffer.from(file.buffer).toString("base64");
      const url = "data:" + file.mimetype + ";base64," + b64;
      const result = await cloudinaryUploadImage(url);

      req.user.profileImage = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    if (req.files.coverImage) {
      if (req.user.coverImage.publicId) {
        await cloudinaryDeleteImage(req.user.coverImage.publicId);
      }

      const file = req.files.coverImage[0]; // File buffer in memory

      const b64 = Buffer.from(file.buffer).toString("base64");
      const url = "data:" + file.mimetype + ";base64," + b64;
      const result = await cloudinaryUploadImage(url);

      req.user.coverImage = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }
  }

  if (req.body.username) {
    const usernameExists = await User.findOne({
      username: req.body.username,
      _id: { $ne: req.user._id },
    });

    if (usernameExists) {
      return next(generateError("Username already exists", 400, "error"));
    }
    req.user.username = req.body.username;
  }

  if (req.body.fullname) {
    req.user.fullname = req.body.fullname;
  }

  if (req.body.bio) {
    req.user.bio = req.body.bio;
  }

  if (
    (req.body.currentPassword && !req.body.newPassword) ||
    (!req.body.currentPassword && req.body.newPassword)
  ) {
    return next(
      generateError(
        "Both current Password and new Password are required",
        400,
        "error"
      )
    );
  }

  if (req.body.currentPassword && req.body.newPassword) {
    const validPassword = await bcrypt.compare(
      req.body.currentPassword,
      req.user.password
    );
    if (!validPassword) {
      return next(generateError("Invalid current password", 400, "error"));
    }
    const hashedPassword = await bcrypt.hash(req.body.newPassword, 11);
    req.user.password = hashedPassword;
  }

  await req.user.save();

  const user = await User.findById(req.user._id)
    .populate("posts")
    .sort({ createdAt: -1 });

  res.json({ data: user });
});

const getProfile = asyncMiddleware(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate("posts");
  if (!user) {
    return next(generateError("User not found", 404, "error"));
  }
  res.json({ data: user });
});

const getUser = asyncMiddleware(async (req, res, next) => {
  res.json({ data: req.user });
});

const followers = asyncMiddleware(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate("followers");
  if (!user) {
    return next(generateError("User not found", 404, "error"));
  }
  res.json({ status: "success", data: user.followers });
});

const following = asyncMiddleware(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate("following");
  if (!user) {
    return next(generateError("User not found", 404, "error"));
  }
  res.json({ status: "success", data: user.following });
});

const deleteProfile = asyncMiddleware(async (req, res, next) => {
  if (req.user.profileImage.publicId) {
    await cloudinaryDeleteImage(req.user.profileImage.publicId);
  }
  if (req.user.coverImage.publicId) {
    await cloudinaryDeleteImage(req.user.coverImage.publicId);
  }
  const posts = await Post.find();
  posts.forEach(async (post) => {
    post.comments.forEach((comment, idx) => {
      if (comment.user._id.toString() === req.user._id.toString()) {
        post.comments.splice(idx, 1);
      }
    });
    post.likes.forEach((like, idx) => {
      if (like.toString() === req.user._id.toString()) {
        post.likes.splice(idx, 1);
      }
    });
    await post.save();
  });

  const users = await User.find();
  users.forEach(async (user) => {
    user.followers.forEach((follower, idx) => {
      if (follower.toString() === req.user._id.toString()) {
        user.followers.splice(idx, 1);
      }
    });
    user.following.forEach((following, idx) => {
      if (following.toString() === req.user._id.toString()) {
        user.following.splice(idx, 1);
      }
    });
    user.notifications.forEach((notify, idx) => {
      if (notify.from.toString() === req.user._id.toString()) {
        user.notifications.splice(idx, 1);
      }
    });
    await user.save();
  });
  for (const post of posts) {
    if (post.postImage.publicId) {
      await cloudinaryDeleteImage(post.image.publicId);
    }
  }
  await Post.deleteMany({ user: req.user._id });
  await User.findByIdAndDelete({ _id: req.user._id });
  res.clearCookie("jwt");
  res.json({ message: "Profile deleted successfully" });
});

const verifyOTP = asyncMiddleware(async (req, res, next) => {
  const otp = req.body.otp;
  const myOtp = await OTP.findOne({ email: req.params.email });
  if (!myOtp) {
    return next(generateError("Invalid OTP", 400, "error"));
  }
  if (Date.now() > myOtp.expiresIn) {
    return next(generateError("OTP expired", 400, "error"));
  }

  const decodedOTP = await bcrypt.compare(otp, myOtp.otp);
  if (!decodedOTP) {
    return next(generateError("Invalid OTP", 400, "error"));
  }
  await OTP.deleteOne({ email: req.params.email });
  const user = await User.findOneAndUpdate(
    { email: req.params.email },
    { isVerified: true },
    { new: true }
  ).populate("posts");
  if (!user) {
    return next(generateError("User not found", 404, "error"));
  }
  res.json({ data: user });
});

const suggestedUsers = asyncMiddleware(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(generateError("User not found", 404, "error"));
  }
  const followingIds = user.following.map((follow) => follow._id.toString());
  const suggestedUsers = await User.find({
    _id: { $nin: followingIds, $ne: user._id.toString() },
    isVerified: true,
  })
    .limit(3)
    .populate("posts");
  console.log(suggestedUsers);
  res.json({ status: "success", data: suggestedUsers });
});

const searchUsers = asyncMiddleware(async (req, res, next) => {
  const keyword = req.body.keyword;
  const users = await User.find({
    fullname: { $regex: keyword, $options: "i" },
    isVerified: true,
  }).populate("posts");
  res.json({ status: "success", data: users });
});

export {
  signup,
  login,
  checkAuth,
  logout,
  updateProfile,
  getProfile,
  getUser,
  followers,
  following,
  deleteProfile,
  verifyOTP,
  SendOTPVerificationEmail,
  suggestedUsers,
  searchUsers,
};
