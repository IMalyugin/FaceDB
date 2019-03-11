import React from 'react';
import {
  hot,
  AppContainer,
  // setConfig,
} from 'react-hot-loader';
import Redbox from 'redbox-react';

/**
 * configure react-hot-loader to show warnings
 */
// setConfig({ logLevel: 'debug' });


/**
 * HOC that provides
 * HotModuleReload + ErrorBoundary
 * the actual highest parental module must be passed for HMR to work
 */

export const withHMR = module => (
  (WrappedComponent) => {
    if (process.env.NODE_ENV !== 'production') {
      const HMRProvider = props => (
        <AppContainer errorReporter={Redbox}>
          <WrappedComponent {...props} />
        </AppContainer>
      );

      return hot(module)(HMRProvider);
    }
    return WrappedComponent;
  }
);
