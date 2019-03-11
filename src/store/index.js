import thunk from 'redux-thunk';
import { applyMiddleware, createStore, compose } from 'redux';
import mergeDeep from 'deepmerge';

/**
 * Project wide typical redux store
 * has three arguments, neither of which are required
 */
export function configureStore(state, rootReducer, extraMiddleware) {
  const composeEnhancers = global.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;


  const initialState = rootReducer(undefined, {});
  const mergedState = mergeDeep(initialState, state);
  return createStore(
    rootReducer,
    mergedState,
    composeEnhancers(applyMiddleware(thunk, ...(extraMiddleware || []))),
  );
}
