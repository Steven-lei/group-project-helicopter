import path from 'node:path';

export function safeFilename(originalName = 'video.webm') {
  const extension = path.extname(originalName) || '.webm';
  return extension.replace(/[^.\w-]/g, '') || '.webm';
}
