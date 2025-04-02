import cloudinary from "cloudinary";
import fs from "fs";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUploadImage = async (filePath) => {
  return cloudinary.uploader.upload(filePath, { folder: "uploads" });
};

const cloudinaryDeleteImage = async (publicId) => {
  await cloudinary.v2.uploader.destroy(publicId);
};

export { cloudinaryUploadImage, cloudinaryDeleteImage };
