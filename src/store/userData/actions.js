import { USER_DATA_SET_LIST } from './constants';

export const setUserDataList = ({ uuids, list, profiles, headers, scores }) => ({
  type: USER_DATA_SET_LIST,
  uuids,
  list,
  profiles,
  headers,
  scores,
});
