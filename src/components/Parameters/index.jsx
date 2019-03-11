import React from 'react';
import classNames from 'classnames/bind';
import PropTypes from 'prop-types';

import styles from './styles.pcss';
const cx = classNames.bind(styles);


/**
 * Parameter is item for displaying label/value
 */
export function Parameter({ children, label, isLabelCollapsed, className, isMobile }) {
  return (
    <div className={cx('component', className, isMobile ? 'mobile' : null)}>
      <div className={cx('label', { collapsed: isLabelCollapsed })}>
        {label}
      </div>
      <div className={cx('value')}>
        {children}
      </div>
    </div>
  );
}

Parameter.propTypes = {
  children: PropTypes.node, // represents parameter value
  label: PropTypes.node, // represents parameter title/value
  isLabelCollapsed: PropTypes.bool,
  className: PropTypes.any,
  isMobile: PropTypes.bool,
};
