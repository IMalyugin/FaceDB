// import update from 'immutability-helper';

// import { } from './constants';

import { USER_DATA_SET_LIST } from './constants';
import { FACES_SET_DETECTIONS } from '../faces/constants';

const initialState = {
  list: [],
  profiles: [],
  headers: [],
  fields: ['id', 'name', 'currentDevice', 'currentDeviceUrl', 'targetDevice', 'targetDeviceUrl'],
  uuids: {},
  scores: {},
};

export default function (state = initialState, action) {
  switch (action.type) {
    case USER_DATA_SET_LIST: {
      const { list, profiles, uuids, scores } = action;
      return {
        ...state,
        ...list ? { list } : {},
        ...profiles ? { profiles } : {},
        ...uuids ? { uuids: { ...state.uuids, ...uuids } } : {},
        ...scores ? { scores: { ...state.scores, ...scores } } : {},
      };
    }
    case FACES_SET_DETECTIONS: {
      const { scores } = action;
      return {
        ...state,
        scores: { ...state.scores, ...scores },
      };
    }
    default:
      return state;
  }
}
