import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    content: { type: String },
    postImage: {
      type: Object,
      default: {
        url: "https://via.placeholder.com/150",
        publicId: null,
      },
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    comments: [
      {
        content: {
          type: String,
          required: true,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
