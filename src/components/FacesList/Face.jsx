import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { connect } from 'react-redux';
import regression from 'regression';

import styles from './styles.pcss';
import { getFaceDetectionsDict } from '../../store/faces/selectors';
import { getProfileDataModelByUUID } from '../../store/userData/selectors';
const cx = classNames.bind(styles);

/**
 * takes a row of { width, x, y } and returns approximate position for the new number
 */
const composeApproximate = () => {
  let row = [];
  return (value) => {
    row = [...row.slice(-4), value];
    if (row.length > 4) {
      const reg = regression.linear(row.map((val, index) => [index, val]), { precision: 4, order: 2 });
      row[row.length - 2] = reg.predict(row.length - 2)[1]; // eslint-disable-line prefer-destructuring
      row[row.length - 1] = reg.predict(row.length - 1)[1]; // eslint-disable-line prefer-destructuring
      return reg.predict(row.length - 1)[1];
    }
    return row[row.length - 1];
  };
};

class Face extends React.PureComponent {
  constructor(props) {
    super(props);
    const regX = composeApproximate();
    const regY = composeApproximate();
    const regWidth = composeApproximate();
    const regHeight = composeApproximate();
    this.state = {
      regX, // eslint-disable-line react/no-unused-state
      regY, // eslint-disable-line react/no-unused-state
      regWidth, // eslint-disable-line react/no-unused-state
      regHeight, // eslint-disable-line react/no-unused-state
      // eslint-enable
      x: regX(props.x),
      y: regX(props.y),
      width: regWidth(props.width),
      height: regHeight(props.height),
    };
  }

  static getDerivedStateFromProps({ x, y, width, height }, { regX, regY, regWidth, regHeight }) {
    const data = {
      x: regX(x),
      y: regY(y),
      width: regWidth(width),
      height: regHeight(height),
    };
    return data;
  }

  getMinSize() {
    const { width, height } = this.props;
    return Math.min(width, height);
  }

  renderData() {
    const { data } = this.props;
    if (!data) return null
    const { id, name, currentDevice, currentDeviceUrl, targetDevice, targetDeviceUrl } = this.props.data;
    return (
      <div className={cx('data')} style={this.getStyles()}>
        <div className={cx('name')}>{name}</div>
        <div className={cx('devices')}>
          <div className={cx('device', 'currentDevice')}>
            <img src={currentDeviceUrl} alt={currentDevice} />
            <div className={cx('title')}>{currentDevice}</div>
          </div>
          <div className={cx('device', 'targetDevice')}>
            <img src={targetDeviceUrl} alt={targetDevice} />
            <div className={cx('title')}>{targetDevice}</div>
          </div>
        </div>
      </div>
    );
  }

  getStyles = () => {
    const { width, height, x, y } = this.state;
    return {
      width: `${width * 100}%`,
      height: `${height * 100}%`,
      left: `${x * 100}%`,
      top: `${y * 100}%`,
    }
  }

  render() {
    const { uuid, score, data, className } = this.props;
    return (
      <div className={cx('component', { detected: !!data })}>
        <div className={cx('content', className)} style={this.getStyles()} />
        {/* {`${data ? data.id : `_${uuid.substring(0, 3)}`} (${Math.round(score * 100)}%)`} */}
        {/* </div> */}
        {this.renderData()}
      </div>
    );
  }
}

Face.propTypes = {
  uuid: PropTypes.string,
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  data: PropTypes.object,
  score: PropTypes.number,
  className: PropTypes.string,
};

const mapStateToProps = (state, { uuid }) => ({
  ...getFaceDetectionsDict(state)[uuid],
  data: getProfileDataModelByUUID(state)[uuid] || null,
});

export default connect(mapStateToProps)(Face);

