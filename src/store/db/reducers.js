import { APPEND_FACE, UNITE_FACES } from './constants';

const initialState = {
  detections: [],
};

export default function (state = initialState, action) {
  switch (action.type) {
    case APPEND_FACE: {
      const { payload } = action;
      return {
        ...state,
        detections: payload,
      };
    }
    case UNITE_FACES: {
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
