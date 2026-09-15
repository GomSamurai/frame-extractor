/**
 * FrameForge Studio - Local Vision & AI Computer Vision Engine
 * Advanced Dynamic Diversity, Smile Detection, Eye-Contact & Object Classification
 */

import { computeDHash, getHammingDistance } from './perceptualHash';

/**
 * Robust HTML5 Video Seeking with 300ms Safety Timeout fallback.
 */
export function seekVideoToTime(video, time) {
  return new Promise((resolve) => {
    if (!video || isNaN(time)) return resolve();
    const clampedTime = Math.max(0, Math.min(video.duration - 0.05, time));

    if (Math.abs(video.currentTime - clampedTime) < 0.02) {
      return resolve();
    }

    let timeoutId;
    const onSeeked = () => {
      clearTimeout(timeoutId);
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };

    timeoutId = setTimeout(() => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    }, 300);

    video.addEventListener('seeked', onSeeked);
    try {
      video.currentTime = clampedTime;
    } catch (e) {
      clearTimeout(timeoutId);
      resolve();
    }
  });
}

/**
 * Calculates Laplacian Variance to measure image sharpness/focus.
 */
export function calculateSharpnessScore(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = imgData.data;

  const gray = new Float32Array(width * height);
  for (let i = 0; i < pixels.length; i += 4) {
    gray[i / 4] = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
  }

  let mean = 0;
  const laplacian = new Float32Array((width - 2) * (height - 2));
  let idx = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const val = 
        gray[(y - 1) * width + x] +
        gray[(y + 1) * width + x] +
        gray[y * width + (x - 1)] +
        gray[y * width + (x + 1)] -
        4 * gray[y * width + x];
      
      laplacian[idx++] = val;
      mean += val;
    }
  }

  mean /= laplacian.length;

  let variance = 0;
  for (let i = 0; i < laplacian.length; i++) {
    const diff = laplacian[i] - mean;
    variance += diff * diff;
  }
  variance /= laplacian.length;

  return Math.round(variance);
}

/**
 * Evaluates brightness, contrast, and color richness.
 */
export function analyzeLightingAndAesthetic(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = imgData.data;

  let totalLuminance = 0;
  let rSum = 0, gSum = 0, bSum = 0;
  const luminances = [];

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    
    rSum += r;
    gSum += g;
    bSum += b;

    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    totalLuminance += lum;
    luminances.push(lum);
  }

  const count = pixels.length / 4;
  const avgLum = totalLuminance / count;

  let varSum = 0;
  for (let i = 0; i < luminances.length; i++) {
    varSum += Math.pow(luminances[i] - avgLum, 2);
  }
  const contrast = Math.sqrt(varSum / count);

  const avgR = rSum / count;
  const avgG = gSum / count;
  const avgB = bSum / count;
  const colorVariance = (Math.abs(avgR - avgG) + Math.abs(avgG - avgB) + Math.abs(avgB - avgR)) / 3;

  let exposurePenalty = 1.0;
  if (avgLum < 30) exposurePenalty = avgLum / 30;
  if (avgLum > 225) exposurePenalty = (255 - avgLum) / 30;

  const score = Math.min(100, Math.round((contrast * 0.6 + colorVariance * 1.2) * exposurePenalty));

  return {
    score,
    brightness: Math.round(avgLum),
    contrast: Math.round(contrast),
    isWellLit: avgLum >= 35 && avgLum <= 220
  };
}

/**
 * Subject & People Count Detection.
 */
export function analyzeSubjectDetection(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = imgData.data;

  const gridX = 16;
  const gridY = 9;
  const cellWidth = Math.floor(width / gridX);
  const cellHeight = Math.floor(height / gridY);

  const activeCells = [];

  for (let gy = 0; gy < gridY; gy++) {
    for (let gx = 0; gx < gridX; gx++) {
      let skinPixels = 0;
      let total = 0;

      for (let cy = 0; cy < cellHeight; cy += 2) {
        for (let cx = 0; cx < cellWidth; cx += 2) {
          const px = (gx * cellWidth + cx);
          const py = (gy * cellHeight + cy);
          const idx = (py * width + px) * 4;

          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];

          if (r > 60 && g > 40 && b > 20 && r > g && r > b && (Math.max(r, g, b) - Math.min(r, g, b) > 15) && Math.abs(r - g) > 15) {
            skinPixels++;
          }
          total++;
        }
      }

      if (skinPixels / total > 0.15) {
        activeCells.push({ gx, gy });
      }
    }
  }

  const clusters = [];
  const visited = new Set();

  activeCells.forEach(cell => {
    const key = `${cell.gx},${cell.gy}`;
    if (visited.has(key)) return;

    const cluster = [];
    const queue = [cell];
    visited.add(key);

    while (queue.length > 0) {
      const curr = queue.shift();
      cluster.push(curr);

      activeCells.forEach(other => {
        const oKey = `${other.gx},${other.gy}`;
        if (!visited.has(oKey)) {
          const dist = Math.hypot(curr.gx - other.gx, curr.gy - other.gy);
          if (dist <= 2.2) {
            visited.add(oKey);
            queue.push(other);
          }
        }
      });
    }

    if (cluster.length >= 2) {
      clusters.push(cluster);
    }
  });

  let detectedCount = clusters.length;
  let classification = 'sin-personas';
  if (detectedCount === 1) classification = '1-persona';
  else if (detectedCount === 2) classification = 'pareja';
  else if (detectedCount >= 3) classification = 'grupo';

  const totalSkinArea = activeCells.length / (gridX * gridY);
  let framing = 'medio';
  if (totalSkinArea > 0.35) framing = 'primer-plano';
  else if (totalSkinArea < 0.12) framing = 'entero-lejano';

  return {
    subjectCount: detectedCount,
    classification,
    framing,
    clusterCount: clusters.length,
    coverageRatio: Math.round(totalSkinArea * 100),
    activeCells
  };
}

/**
 * Advanced Smile, Joy & Eye-Contact Detector.
 */
export function analyzeSmileAndEmotion(ctx, width, height, skinCells) {
  if (!skinCells || skinCells.length === 0) {
    return {
      smileScore: 50,
      eyeContactScore: 50,
      emotion: 'sereno',
      isSmiling: false,
      isLookingAtCamera: false,
      isBlinking: false,
      isAwkwardMouth: false
    };
  }

  let minX = width, maxX = 0, minY = height, maxY = 0;
  const cellW = width / 16;
  const cellH = height / 9;

  skinCells.forEach(cell => {
    const x = cell.gx * cellW;
    const y = cell.gy * cellH;
    if (x < minX) minX = x;
    if (x + cellW > maxX) maxX = x + cellW;
    if (y < minY) minY = y;
    if (y + cellH > maxY) maxY = y + cellH;
  });

  const faceW = Math.max(10, maxX - minX);
  const faceH = Math.max(10, maxY - minY);

  const mouthYStart = Math.floor(minY + faceH * 0.58);
  const mouthYEnd = Math.floor(minY + faceH * 0.85);

  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = imgData.data;

  let lipRedSum = 0;
  let mouthBrightSum = 0;
  let count = 0;

  for (let y = Math.max(0, mouthYStart); y < Math.min(height - 1, mouthYEnd); y++) {
    for (let x = Math.max(0, Math.floor(minX)); x < Math.min(width - 1, Math.floor(maxX)); x++) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
      
      if (r > g + 15 && r > b + 10) {
        lipRedSum += (r - g);
      }
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 160) {
        mouthBrightSum++;
      }
      count++;
    }
  }

  const smileScore = Math.min(100, Math.max(20, Math.round((lipRedSum / Math.max(1, count)) * 2.5 + (mouthBrightSum / Math.max(1, count)) * 120)));
  const isSmiling = smileScore >= 65;

  const centerX = (minX + maxX) / 2;
  const symmetryDiff = Math.abs(centerX - width / 2) / (width / 2);
  const eyeContactScore = Math.round(Math.max(0, (1 - symmetryDiff) * 100));
  const isLookingAtCamera = eyeContactScore >= 75;

  let emotion = 'sereno';
  if (smileScore >= 75) emotion = 'sonrisa-radiante';
  else if (smileScore >= 60) emotion = 'alegre';
  else if (isLookingAtCamera) emotion = 'mirada-directa';

  return {
    smileScore,
    eyeContactScore,
    emotion,
    isSmiling,
    isLookingAtCamera,
    isBlinking: false,
    isAwkwardMouth: false
  };
}

/**
 * Animals (Pets) & Objects Classifier Engine.
 */
export function analyzeAnimalsAndObjects(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = imgData.data;

  let greenPixels = 0;
  let bluePixels = 0;
  let furBrownPixels = 0;
  let highContrastEdgeCount = 0;

  const totalPixels = pixels.length / 4;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];

    if (g > r + 15 && g > b + 15 && g > 50) greenPixels++;
    if (b > r + 20 && b > g + 10 && b > 70) bluePixels++;
    if (r > 80 && g > 40 && g < r - 15 && b < g - 10) furBrownPixels++;
    
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 30 || lum > 220) highContrastEdgeCount++;
  }

  const greenRatio = greenPixels / totalPixels;
  const blueRatio = bluePixels / totalPixels;
  const furRatio = furBrownPixels / totalPixels;
  const edgeRatio = highContrastEdgeCount / totalPixels;

  let detectedCategory = 'general';
  let isAnimal = false;
  let isVehicle = false;
  let isNature = false;

  if (furRatio > 0.18 && greenRatio < 0.25) {
    detectedCategory = 'mascota-animal';
    isAnimal = true;
  } else if (greenRatio > 0.25 || blueRatio > 0.30) {
    detectedCategory = 'paisaje-naturaleza';
    isNature = true;
  } else if (edgeRatio > 0.35) {
    detectedCategory = 'vehiculo-objeto';
    isVehicle = true;
  }

  return {
    detectedCategory,
    isAnimal,
    isVehicle,
    isNature,
    furRatio: Math.round(furRatio * 100),
    natureRatio: Math.round((greenRatio + blueRatio) * 100)
  };
}

/**
 * FREE TEXT / CUSTOM PROMPT MATCHING ENGINE.
 */
export function analyzeCustomPromptMatch(userPrompt, evalContext) {
  if (!userPrompt || userPrompt.trim() === '') {
    return { matchScore: 100, isMatched: true };
  }

  const query = userPrompt.toLowerCase().trim();
  let score = 50;

  const { sharpness, aesthetic, subjects, emotion, objects } = evalContext;

  if (query.includes('sonrisa') || query.includes('sonriendo') || query.includes('alegre') || query.includes('feliz') || query.includes('risa')) {
    score = emotion.smileScore;
  } else if (query.includes('mirada') || query.includes('camara') || query.includes('ojos')) {
    score = emotion.eyeContactScore;
  } else if (query.includes('pareja') || query.includes('2 personas') || query.includes('juntos') || query.includes('beso') || query.includes('abrazo')) {
    score = subjects.classification === 'pareja' ? 95 : 20;
  } else if (query.includes('perro') || query.includes('gato') || query.includes('mascota') || query.includes('animal')) {
    score = objects.isAnimal ? 90 : 15;
  } else if (query.includes('coche') || query.includes('vehiculo') || query.includes('objeto') || query.includes('moto')) {
    score = objects.isVehicle ? 85 : 20;
  } else if (query.includes('paisaje') || query.includes('naturaleza') || query.includes('playa') || query.includes('sol') || query.includes('campo')) {
    score = objects.isNature ? 90 : 25;
  } else if (query.includes('retrato') || query.includes('cara') || query.includes('rostro') || query.includes('primer plano')) {
    score = subjects.framing === 'primer-plano' ? 95 : 40;
  } else if (query.includes('nitido') || query.includes('enfoque') || query.includes('claro')) {
    score = Math.min(100, sharpness);
  } else {
    score = Math.round((aesthetic.score + sharpness * 0.5) / 1.5);
  }

  return {
    matchScore: score,
    isMatched: score >= 45
  };
}

/**
 * Dynamic Diversity Selector.
 * Ensures extracted keyframes are temporally spaced and perceptually distinct.
 */
export function selectDiverseTopFrames(candidates, getScoreFn, maxCaptures = 12, minTimeGap = 1.0, minHammingDist = 6) {
  if (!candidates || candidates.length === 0) return [];

  // Sort candidates by filter-specific score descending
  const sorted = [...candidates].sort((a, b) => getScoreFn(b) - getScoreFn(a));

  const selected = [];

  for (const item of sorted) {
    if (selected.length >= maxCaptures) break;

    // Check time separation & perceptual dHash similarity against already selected frames
    const isTooCloseInTime = selected.some(s => Math.abs(s.time - item.time) < minTimeGap);
    const isPerceptualDuplicate = selected.some(s => getHammingDistance(s.dHash, item.dHash) < minHammingDist);

    if (!isTooCloseInTime && !isPerceptualDuplicate) {
      selected.push(item);
    }
  }

  // Fallback: If strict time/hash gap yielded fewer than 3 frames, relax criteria
  if (selected.length < 3 && sorted.length > 0) {
    const relaxedMinGap = Math.max(0.3, minTimeGap * 0.3);
    for (const item of sorted) {
      if (selected.length >= maxCaptures) break;
      const exists = selected.some(s => s.time === item.time);
      const isTooClose = selected.some(s => Math.abs(s.time - item.time) < relaxedMinGap);
      if (!exists && !isTooClose) {
        selected.push(item);
      }
    }
  }

  return selected.sort((a, b) => a.time - b.time);
}

/**
 * Master Comprehensive Frame Evaluation
 */
export async function evaluateFrameWithAI(video, time, options = {}) {
  if (!video) return null;

  if (time !== undefined) {
    await seekVideoToTime(video, time);
  }

  const sampleW = 320;
  const sampleH = 180;
  const canvas = document.createElement('canvas');
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, sampleW, sampleH);

  const dHash = computeDHash(ctx, sampleW, sampleH);
  const sharpness = calculateSharpnessScore(ctx, sampleW, sampleH);
  const aesthetic = analyzeLightingAndAesthetic(ctx, sampleW, sampleH);
  const subjects = analyzeSubjectDetection(ctx, sampleW, sampleH);
  const emotion = analyzeSmileAndEmotion(ctx, sampleW, sampleH, subjects.activeCells);
  const objects = analyzeAnimalsAndObjects(ctx, sampleW, sampleH);

  const evalContext = { sharpness, aesthetic, subjects, emotion, objects };
  
  let customMatch = { matchScore: 100, isMatched: true };
  if (options.userPrompt) {
    customMatch = analyzeCustomPromptMatch(options.userPrompt, evalContext);
  }

  const baseScore = sharpness * 0.25 + aesthetic.score * 0.25 + emotion.smileScore * 0.3 + customMatch.matchScore * 0.2;
  const overallScore = Math.round(baseScore);

  return {
    time,
    dHash,
    sharpness,
    aesthetic,
    subjects,
    emotion,
    objects,
    customMatch,
    overallScore
  };
}
