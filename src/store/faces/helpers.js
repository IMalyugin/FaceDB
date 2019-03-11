import { generateUUID } from '../../utils/uuid';

/**
 * detection: {
 *   x, y, width, height,
 *   predictedX, predictedY, predictedWidth, predictedHeight,
 *   score
 * }
 */

/**
 * Find a score 0, 1 for distance,
 * given absolute distance value
 * and Maximum value used as a scale
 */
const getNumberDistance = (dist, scale = 1) => Math.abs(dist / scale);

/**
 * TODO: Use predicted values for size and position to compensate for dynamics
 */
const findDetectionDistance = ({ x, y, size, _size }, { x: prevX, y: prevY, size: prevSize, _size: _prevSize }) => {
  const vectorDist = Math.sqrt((x - prevX) ** 2 + (y - prevY) ** 2);

  const _avgSize = (_size + _prevSize) / 2;
  const posDist = getNumberDistance(vectorDist, _avgSize);

  const sizeDist = getNumberDistance(size - prevSize, prevSize);

  return Math.max(posDist, sizeDist);
};


/**
 * For every detection in nextDetection most likely found in prevDetections, restore persistent id
 */
export const identifyDetections = (nextDetections, prevDetections) =>
  nextDetections.map((detection) => {
    let minDistance = 999;
    let closestDetection = null;
    prevDetections.forEach((compareDetection) => {
      const distance = findDetectionDistance(detection, compareDetection);
      if (distance < minDistance) {
        minDistance = distance;
        closestDetection = compareDetection;
      }
    });

    /** we assume new detection matches old one */
    if (minDistance < 0.4) {
      prevDetections = prevDetections.filter(item => item !== closestDetection);
      return {
        ...detection,
        distance: minDistance,
        uuid: closestDetection.uuid,
      };
    }

    /**
     * incase we found a new detection, but we are yet unsure it is a real face,
     * we ditch it, unless it gets a good score
     */
    return detection.score > 0.5 && detection.width < 0.6 && detection.height < 0.8 ? {
      ...detection,
      uuid: generateUUID(),
      goodFrames: 0,
    } : null;
  }).filter(item => !!item);


export const updateFoundDetections = detections =>
  detections.map((item) => {
    const { lastSeenAt, skippedFrames, goodFrames, ...detectionData } = item;

    /**
     * good frames are a sanity check to avoid random noise detection
     * if good frames hit 0, detection is erased
     * if it hits 3, we make it permanent
     */
    if (typeof goodFrames === 'number') {
      const newGoodFrames = item.score > 0.5 ? goodFrames + 1 : goodFrames - 1;

      if (newGoodFrames > 3) return detectionData;
      if (newGoodFrames <= 0) return null;
      return { ...detectionData, goodFrames: newGoodFrames };
    }
    return skippedFrames ? detectionData : item;
  }).filter(item => !!item);


export const updateLostDetections = detections =>
  detections.map((item) => {
    const { lastSeenAt, skippedFrames } = item;
    const now = Date.now();

    if (skippedFrames) {
      if (skippedFrames > 3 && (now - lastSeenAt) > 500) {
        return null;
      }
      return { ...item, skippedFrames: skippedFrames + 1 };
    }
    return { ...item, skippedFrames: 1, lastSeenAt: now };
  }).filter(item => !!item);


export const getBetterDetections = (detections, prevScores) =>
  detections.map((detection) => {
    const { uuid } = detection;
    const prevScore = prevScores[uuid] || 0;
    const nextScore = detection.score;
    return nextScore > prevScore + 0.1 ? detection : null;
  }, {}).filter(item => !!item);
