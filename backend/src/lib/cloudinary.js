// backend/src/lib/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";
import { Readable } from "stream";

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Buffer se direct upload
export const uploadImageToCloudinary = async (fileBuffer) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "chatapp",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Buffer ko stream mein convert kar ke bhej
      Readable.from(fileBuffer).pipe(stream);
    });

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export default cloudinary;
