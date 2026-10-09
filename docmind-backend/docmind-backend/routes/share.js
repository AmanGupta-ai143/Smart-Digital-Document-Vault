const express = require("express");
const crypto = require("crypto");
const { Readable } = require("stream");
const ShareLink = require("../models/ShareLink");
const Document = require("../models/Document");
const User = require("../models/User");
const { signedUrl } = require("../config/cloudStorage");

const router = express.Router();

// Public routes: no login needed, but the secret token must match a live, un-revoked link.
async function resolveLink(token) {
  const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
  const link = await ShareLink.findOne({ tokenHash });
  if (!link || link.revokedAt || link.expiresAt < new Date()) return null;
  const doc = await Document.findOne({ _id: link.documentId, userId: link.userId, isDeleted: false });
  if (!doc) return null;
  return { link, doc };
}

const GONE = { message: "This link has expired or was removed by its owner." };

router.get("/:token", async (req, res, next) => {
  try {
    const found = await resolveLink(req.params.token);
    if (!found) return res.status(404).json(GONE);
    const { link, doc } = found;
    link.viewCount += 1;
    await link.save();
    const owner = await User.findById(link.userId).select("name");
    res.json({
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSizeBytes: doc.fileSizeBytes,
      expiresAt: link.expiresAt,
      sharedBy: owner?.name || null,
    });
  } catch (err) {
    next(err);
  }
});

// The file is streamed through our server, so the storage address is never revealed
// and the link stops working the moment it expires or is revoked.
router.get("/:token/file", async (req, res, next) => {
  try {
    const found = await resolveLink(req.params.token);
    if (!found) return res.status(404).json(GONE);
    const { doc } = found;

    const upstream = await fetch(signedUrl(doc));
    if (!upstream.ok || !upstream.body) return res.status(502).json({ message: "Could not load the file right now." });

    const disposition = req.query.download === "1" ? "attachment" : "inline";
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");
    res.setHeader("Content-Disposition", `${disposition}; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Security-Policy", `frame-ancestors ${process.env.CLIENT_URL || "*"}`);
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
