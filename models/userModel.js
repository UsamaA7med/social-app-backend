import mongoose from "mongoose";
import Joi from "joi";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      default: "",
    },
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    profileImage: {
      type: Object,
      default: {
        url: "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png",
        publicId: null,
      },
    },
    coverImage: {
      type: Object,
      default: {
        url: "https://via.placeholder.com/150",
        publicId: null,
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    notifications: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        content: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true, virtuals: true, toJSON: { virtuals: true } }
);

userSchema.virtual("posts", {
  ref: "Post",
  localField: "_id",
  foreignField: "user",
  options: {
    sort: { createdAt: -1 },
  },
});

const validateSignup = (body) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    fullname: Joi.string().min(3).max(255).required(),
    password: Joi.string().min(8).required(),
    username: Joi.string().min(3).max(255).required(),
  });
  return schema.validate(body);
};

const validateLogin = (body) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  return schema.validate(body);
};

const User = mongoose.model("User", userSchema);

export { User, validateSignup, validateLogin };
