import { combineReducers } from 'redux';

import userDataReducer from './userData/reducers';
import faceDetectionsReducer from './faces/reducers';

export default combineReducers({
  userData: userDataReducer,
  faces: faceDetectionsReducer,
});
