import React from 'react';
import { Provider } from 'react-redux';

import { configureStore } from 'store';

/** HOC for connecting App to everything - store, routing, adaptivity, ... */
const connectProvider = (rootReducer, mapPropsToState = d => d) => (
  (WrappedComponent) => {
    class ProviderConnector extends React.Component {
      constructor(props) {
        super(props);
        this.store = configureStore(mapPropsToState(props), rootReducer);
      }

      render() {
        return (
          <Provider store={this.store}>
            <WrappedComponent />
          </Provider>
        );
      }
    }

    return ProviderConnector;
  }
);

export default connectProvider;
