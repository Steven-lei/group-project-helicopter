import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { safeFilename } from '../utils/safe-filename.js';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve(uploadDir)),
  filename: (req, file, cb) => {
    const extension = safeFilename(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `video-${unique}${extension}`);
  }
});

function fileFilter(req, file, cb) {
  const allowed = ['video/webm', 'video/mp4', 'video/quicktime'];
  if (allowed.includes(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new Error('Unsupported video type. Use webm, mp4, or mov.'));
}

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024
  },
  fileFilter
});
