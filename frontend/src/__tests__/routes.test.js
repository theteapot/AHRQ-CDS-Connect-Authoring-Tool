import { Route } from 'react-router-dom';
import PrivateRoute from '../containers/PrivateRoute';
import Landing from '../components/Landing';
import Builder from '../containers/Builder';
import Artifact from '../containers/Artifact';
import NoMatch from '../components/NotFoundPage';
import Root from '../containers/Root';
import { shallowRenderComponent } from '../utils/test_helpers';

test('Routes renders correct routes', () => {
  const component = shallowRenderComponent(Root);
  const pathMap = component.find(Route).reduce((paths, route) => {
    Object.assign(paths, { [route.props().path]: route.props().component });
    return paths;
  }, {});

  const privatePathMap = component.find(PrivateRoute).reduce((paths, route) => {
    Object.assign(paths, { [route.props().path]: route.props().component });
    return paths;
  }, {});

  expect(pathMap['/']).toBe(Landing);
  expect(pathMap[undefined]).toBe(NoMatch);

  expect(privatePathMap['/build']).toBe(Builder);
  expect(privatePathMap['/build/:id']).toBe(Builder);
  expect(privatePathMap['/artifacts']).toBe(Artifact);
});
