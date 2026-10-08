const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer under a per-user folder. Files are stored as "authenticated"
 * assets, which means the plain Cloudinary link does NOT work — only a signed link
 * that our server hands out after checking the owner is logged in.
 */
function uploadBuffer(buffer, userId, originalName) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `docmind-ai/${userId}`,
        resource_type: "auto",
        type: "authenticated",
        use_filename: true,
        unique_filename: true,
        filename_override: originalName,
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
}

// PDFs and images live under Cloudinary's "image" type, everything else under "raw".
function resourceTypeFor(doc) {
  if (doc.cloudResourceType) return doc.cloudResourceType;
  return ["pdf", "jpg", "png"].includes(doc.fileType) ? "image" : "raw";
}

/** Link the owner's browser can open. Older (public) uploads keep their stored link. */
function signedUrl(doc) {
  if (doc.cloudAccess !== "authenticated") return doc.cloudFileUrl;
  const resourceType = resourceTypeFor(doc);
  return cloudinary.url(doc.cloudPublicId, {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
    secure: true,
    ...(resourceType === "image" && doc.fileType && doc.fileType !== "other" ? { format: doc.fileType } : {}),
  });
}

async function deleteFile(publicId, doc = {}) {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceTypeFor(doc),
    type: doc.cloudAccess === "authenticated" ? "authenticated" : "upload",
    invalidate: true,
  });
}

module.exports = { cloudinary, uploadBuffer, deleteFile, signedUrl };
