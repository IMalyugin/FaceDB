import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { connect } from 'react-redux';

import { ProfileIdPropType } from 'utils/propTypes';
import { getActiveExistingProfileIdList, getProfileDataHeaders } from 'store/userData/selectors';
import Profile from './Profile';

import styles from './styles.pcss';
const cx = classNames.bind(styles);


class ProfileList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      list: props.list || [],
    };
  }
  static getDerivedStateFromProps(nextProps, prevState) {
    const nextList = nextProps.list;
    const prevList = prevState.list;

    const newItems = nextList.filter(id => prevList.indexOf(id) === -1);
    const unchangedItems = prevList.filter(id => nextList.indexOf(id) !== -1);
    return {
      list: [...newItems, ...unchangedItems],
    };
  }
  render() {
    const { headers, className } = this.props;
    const { list } = this.state;
    return (
      <table className={cx('container', className)} cellSpacing={0} cellPadding={0}>
        <thead>
          <tr>
            {headers.map(item => <th key={item}>{item}</th>)}
          </tr>
        </thead>
        <tbody>
          {list.map(id => <Profile key={id} id={id} />)}
        </tbody>
      </table>
    );
  }
}

ProfileList.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string),
  list: PropTypes.arrayOf(ProfileIdPropType),
  className: PropTypes.string,
};

const mapStateToProps = state => ({
  list: getActiveExistingProfileIdList(state),
  headers: getProfileDataHeaders(state),
});

export default connect(mapStateToProps)(ProfileList);
