/**
 * FrameForge Studio - Perceptual Hashing (dHash) Module
 * Detects visually duplicate or near-identical image frames in local memory.
 */

export function computeDHash(ctx, width, height) {
  // Create offscreen 9x8 canvas for difference hashing
  const hashCanvas = document.createElement('canvas');
  hashCanvas.width = 9;
  hashCanvas.height = 8;
  const hashCtx = hashCanvas.getContext('2d');
  
  hashCtx.drawImage(ctx.canvas, 0, 0, 9, 8);
  const imgData = hashCtx.getImageData(0, 0, 9, 8);
  const pixels = imgData.data;

  // Convert to grayscale values
  const gray = new Uint8Array(72);
  for (let i = 0; i < pixels.length; i += 4) {
    gray[i / 4] = Math.round(0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]);
  }

  // Compute 64-bit difference hash string
  let hashStr = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = gray[y * 9 + x];
      const right = gray[y * 9 + x + 1];
      hashStr += (left > right ? '1' : '0');
    }
  }

  return hashStr;
}

/**
 * Calculates Hamming distance between two binary hash strings.
 * Distance 0 = Identical image, < 8 = Near-duplicate.
 */
export function getHammingDistance(hashA, hashB) {
  if (!hashA || !hashB || hashA.length !== hashB.length) return 64;
  let dist = 0;
  for (let i = 0; i < hashA.length; i++) {
    if (hashA[i] !== hashB[i]) dist++;
  }
  return dist;
}

/**
 * Filters out duplicate frames from array based on hamming distance threshold (default < 9 bits difference).
 */
export function filterDuplicateFrames(frames, maxDifference = 8) {
  const unique = [];
  
  for (const frame of frames) {
    if (!frame.dHash) {
      unique.push(frame);
      continue;
    }

    const isDuplicate = unique.some(existing => {
      if (!existing.dHash) return false;
      const dist = getHammingDistance(frame.dHash, existing.dHash);
      return dist <= maxDifference;
    });

    if (!isDuplicate) {
      unique.push(frame);
    }
  }

  return unique;
}
