import { createSelector } from 'reselect';
import update from 'immutability-helper';

const getFacesData = state => state.faces;

export const getFaceDetectionsRaw = state => getFacesData(state).detections;

/**
 * Remove uncertain frames from selection
 */
export const getFaceDetections = createSelector(
  getFaceDetectionsRaw,
  item => item.filter(({ goodFrames }) => typeof goodFrames !== 'number'),
);
export const getFaceDetectionUUIDs = createSelector(
  getFaceDetections,
  list => list.map(item => item.uuid),
);

export const getFaceDetectionsDict = createSelector(
  getFaceDetections,
  list => list.reduce((result, item) => update(result, { [item.uuid]: { $set: item } }), {}),
);
