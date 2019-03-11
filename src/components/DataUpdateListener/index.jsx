import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { setUserDataList } from 'store/userData/actions';


class DataUpdateListener extends React.Component {
  componentDidMount() {
    this.socket = window.io();
    this.socket.on('dataChange', ({ list, profiles, headers }) => {
      this.props.onListUpdate({ list, profiles, headers });
    });
  }

  render() {
    const { children } = this.props;
    return children;
  }
}

DataUpdateListener.propTypes = {
  children: PropTypes.node,
  onListUpdate: PropTypes.func,
};


const mapDispatchToProps = {
  onListUpdate: setUserDataList,
};

export default connect(null, mapDispatchToProps)(DataUpdateListener);
