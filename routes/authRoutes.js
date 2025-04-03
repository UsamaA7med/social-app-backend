import express from "express";
import {
  checkAuth,
  deleteProfile,
  followers,
  following,
  getProfile,
  getUser,
  login,
  logout,
  searchUsers,
  SendOTPVerificationEmail,
  signup,
  suggestedUsers,
  updateProfile,
  verifyOTP,
} from "../controllers/authControllers.js";
import protectedMiddleware from "../middlewares/protectedMiddleware.js";
import uploadImage from "../utils/photoUpload.js";

const authRoutes = express.Router();

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.get("/checkAuth", checkAuth);
authRoutes.post("/logout", logout);
authRoutes.put(
  "/updateProfile",
  protectedMiddleware,
  uploadImage.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateProfile
);

authRoutes.post("/verifyOTP/:email", verifyOTP);
authRoutes.get("/resSendOTP/:email", SendOTPVerificationEmail);

authRoutes.get("/getUser", protectedMiddleware, getUser);

authRoutes.get("/getProfile/:id", protectedMiddleware, getProfile);

authRoutes.get("/followers/:id", protectedMiddleware, followers);
authRoutes.get("/following/:id", protectedMiddleware, following);

authRoutes.delete("/deleteProfile", protectedMiddleware, deleteProfile);

authRoutes.get("/suggestedUsers", protectedMiddleware, suggestedUsers);

authRoutes.post("/search", protectedMiddleware, searchUsers);

export default authRoutes;
