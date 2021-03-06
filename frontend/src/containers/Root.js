import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { Route, Switch } from 'react-router-dom';

import PrivateRoute from './PrivateRoute';
import App from './App';
import Landing from '../components/Landing';
import Builder from '../containers/Builder';
import Artifact from '../containers/Artifact';
import UserGuide from '../components/UserGuide';
import NoMatch from '../components/NotFoundPage';

const Root = (props) => {
  const { store } = props;

  return (
    <Provider store={store}>
      <App>
        <Switch>
          <Route exact path="/" component={Landing} />
          <PrivateRoute path='/build/:id' component={Builder} />
          <PrivateRoute path='/build' component={Builder} />
          <PrivateRoute path='/artifacts' component={Artifact} />
          <Route path='/userguide' component={UserGuide} />
          <Route component={NoMatch} />
        </Switch>
      </App>
    </Provider>
  );
};

Root.propTypes = {
  store: PropTypes.object.isRequired
};

Root.displayName = 'Root';

export default Root;
