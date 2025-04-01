import jwt from "jsonwebtoken";
import asyncMiddleware from "./asyncMiddleware.js";
import generateError from "../utils/generateError.js";
import { User } from "../models/userModel.js";
export default asyncMiddleware(async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return next(generateError("Invalid token", 401, "error"));
  }
  const decoded = await jwt.verify(token, process.env.JWT_SECRET);
  if (decoded) {
    const user = await User.findOne({ email: decoded.email }).populate(
      "notifications.from"
    );
    if (!user) {
      return next(generateError("User not found", 401, "error"));
    }
    req.user = user;
    next();
  } else {
    next(generateError("Invalid token", 401, "error"));
  }
});
