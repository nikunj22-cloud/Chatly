// frontend/src/lib/cloudinary.js
// frontend/src/lib/cloudinary.js
const CLOUD_NAME = "dal4jkcro"; // ✅ Ye sahi hai
const UPLOAD_PRESET = "chatly_uploads"; // Jo preset banaya tha

export const uploadImageToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) throw new Error("Upload failed");

    const data = await response.json();
    return data.secure_url; // Image URL return hoga
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};
