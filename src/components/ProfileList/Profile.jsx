import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { connect } from 'react-redux';

// import { Parameter } from '../Parameters';
import { getProfileDataFields, getProfileDataModelById } from 'store/userData/selectors';

import styles from './styles.pcss';
const cx = classNames.bind(styles);


const FieldRenderer = ({ field, value }) => {
  switch (field) {
    case 'photoTarget':
      return (
        <img src={value} alt="" />
      );
    default:
      return value;
  }
};

function Profile({ fields, data, className }) {
  return (
    <tr className={cx('row', className)}>
      {fields.map(field => (
        <td key={field}><FieldRenderer field={field} value={data[field]} /></td>
      ))}
    </tr>
  );
}

Profile.propTypes = {
  /** redux props */
  fields: PropTypes.arrayOf(PropTypes.string),
  data: PropTypes.object,

  /** normal props */
  className: PropTypes.string,
};

const mapStateToProps = (state, { id }) => ({
  data: getProfileDataModelById(state)[id],
  fields: getProfileDataFields(state),
});

export default connect(mapStateToProps)(Profile);
