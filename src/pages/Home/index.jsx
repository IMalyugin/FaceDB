import React from 'react';

import { withHMR } from 'utils/hmr-provider';
import connectProvider from 'utils/redux-provider';
import rootReducer from 'store/reducers';

import { DataUpdateListener, ProfileList } from 'components';


function HomePage() {
  return (
    <DataUpdateListener>
      <ProfileList />
    </DataUpdateListener>
  );
}


/**
 * Standalone connected Product Catalog Page
 */
export default withHMR(module)(connectProvider(rootReducer)(HomePage));
