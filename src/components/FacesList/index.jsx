import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames/bind';

import { getFaceDetectionUUIDs } from 'store/faces/selectors';

import Face from './Face';
import styles from './styles.pcss';
const cx = classNames.bind(styles);


function FacesList({ uuids, className }) {
  return (
    <div className={cx('container', className)}>
      {uuids.map(uuid => <Face key={uuid} uuid={uuid} />)}
    </div>
  );
}

FacesList.propTypes = {
  uuids: PropTypes.arrayOf(PropTypes.string),
  className: PropTypes.string,
};

const mapStateToProps = state => ({
  uuids: getFaceDetectionUUIDs(state),
});

export default connect(mapStateToProps)(FacesList);
