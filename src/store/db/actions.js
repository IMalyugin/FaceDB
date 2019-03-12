/**
 *
 * @param descriptor - a set of weights for face identification
 * @param score {number} - a number from 0 to 1, indicating probability that descriptor contains a face
 */
import { findMatchingFace } from './processors';

export const matchOrAppendFace = ({ descriptor, score }) => {
  const matchId = findMatchingFace(descriptor);

};
