const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer to cloud storage under a per-user folder so
 * every document is namespaced to its owner.
 */
function uploadBuffer(buffer, userId, originalName) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `docmind-ai/${userId}`,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        filename_override: originalName,
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
}

async function deleteFile(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
}

module.exports = { cloudinary, uploadBuffer, deleteFile };
