import { createSelector } from 'reselect';
import { getFaceDetectionUUIDs } from '../faces/selectors';
const getUsersData = state => state.userData;

/** returns unfiltered currently active profile ids from file */
export const getActiveUnfilteredProfileIdList = state => getUsersData(state).list || [];
export const getProfileDataHeaders = state => getUsersData(state).headers || [];
export const getProfileDataFields = state => getUsersData(state).fields || [];

export const getProfileDataArrayList = state => getUsersData(state).profiles || [];

/**
 * bases on the fact that id is the first field in csv
 */
export const getProfileDataArrayById = createSelector(
  getProfileDataArrayList,
  list => list.reduce((result, item) => {
    const [id] = item;
    result[id] = item;
    return result;
  }, {}),
);

export const getExistingProfileIdList = createSelector(
  getProfileDataArrayById,
  list => Object.keys(list),
);


export const getProfileDataModelById = createSelector(
  getProfileDataFields,
  getProfileDataArrayById,
  (fields, profileDict) => Object.keys(profileDict).reduce((result, id) => {
    const profile = profileDict[id];
    const item = {};
    fields.forEach((field, index) => {
      item[field] = profile[index];
    });
    result[id] = item;
    return result;
  }, {}),
);

// TODO: uncomment this function
const getIdByUUIDTable = state => getUsersData(state).uuids;

// const getIdByUUIDTable = createSelector(
//   getFaceDetectionUUIDs,
//   uuids => uuids.reduce((result, uuid) => {
//     const id = Math.round(Math.random() * 16);
//     result[uuid] = id;
//     return result;
//   }, {}),
// );

export const getProfileDataModelByUUID = createSelector(
  getProfileDataModelById,
  getIdByUUIDTable,
  (models, ids) => {
    const result = Object.keys(ids).reduce((result, uuid) => {
      const id = ids[uuid];
      result[uuid] = models[id];
      return result;
    }, {});
    return result;
  },
);

/** returns currently active profile ids that have info */
export const getActiveExistingProfileIdList = createSelector(
  getActiveUnfilteredProfileIdList,
  getExistingProfileIdList,
  (activeIds, existingIds) => activeIds.filter(id => existingIds.indexOf(id) !== -1),
);


export const getUserDataScores = state => getUsersData(state).scores;
