import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUploadImage = async (path) => {
  const result = await cloudinary.v2.uploader.upload(path, {
    resource_type: "auto",
  });
  return result;
};

const cloudinaryDeleteImage = async (publicId) => {
  await cloudinary.v2.uploader.destroy(publicId);
};

export { cloudinaryUploadImage, cloudinaryDeleteImage };
