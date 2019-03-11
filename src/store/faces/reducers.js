import { FACES_SET_DETECTIONS } from './constants';

const initialState = {
  detections: [],
};

export default function (state = initialState, action) {
  switch (action.type) {
    case FACES_SET_DETECTIONS: {
      const { payload } = action;
      return {
        ...state,
        detections: payload,
      };
    }
    default:
      return state;
  }
}
