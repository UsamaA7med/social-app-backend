import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUploadImage = async (file) => {
  return cloudinary.v2.uploader.upload(file, { resource_type: "auto" });
};

const cloudinaryDeleteImage = async (publicId) => {
  await cloudinary.v2.uploader.destroy(publicId);
};

export { cloudinaryUploadImage, cloudinaryDeleteImage };
