import { FACES_SET_DETECTIONS } from './constants';
import { getFaceDetectionsRaw } from './selectors';
import { identifyDetections, updateFoundDetections, updateLostDetections, getBetterDetections } from './helpers';
import { getUserDataScores } from '../userData/selectors';

const sendMessage = (type, message) => {
  window.socket.emit(type, message);
};

const sendUnknownSnapshot = ({ uuid, imageData, imageScore }) => sendMessage('image', { uuid, imageData, imageScore });
const sendKeepAliveFaces = uuids => sendMessage('keepalive', { uuids });

export const setFaceDetections = ({ detections: nextDetections, getDetectionSnapshot }) =>
  (dispatch, getState) => {
    const state = getState();

    const prevDetections = getFaceDetectionsRaw(state);
    // const prevDetectionUUIDs = getFaceDetectionUUIDs(state);

    const detections = identifyDetections(nextDetections, prevDetections);

    const nextDetectionUUIDs = detections.map(item => item.uuid);
    const lostDetections = prevDetections.filter(item => nextDetectionUUIDs.indexOf(item.uuid) === -1);
    // const newDetections = detections.filter(item => prevDetectionUUIDs.indexOf(item.uuid) === -1);

    /**
     * for found detections, we clean lost marks,
     * for lost detections, we set marks or remove detections
     */
    const activeDetections = updateFoundDetections(detections);

    const allDetections = [
      ...activeDetections,
      ...updateLostDetections(lostDetections),
    ];

    /**
     * now we cycle through detections to send better photos to server
     */

    const prevScores = getUserDataScores(state);
    const betterDetections = getBetterDetections(activeDetections, prevScores);

    betterDetections.forEach((detection) => {
      const imageData = getDetectionSnapshot(detection);
      sendUnknownSnapshot({ uuid: detection.uuid, imageData, imageScore: detection.score });
    });

    const scores = betterDetections.reduce((result, { uuid, score }) => {
      result[uuid] = score;
      return result;
    }, {});

    dispatch({
      type: FACES_SET_DETECTIONS,
      payload: allDetections,
      scores,
    });

    sendKeepAliveFaces(nextDetectionUUIDs);
  };
