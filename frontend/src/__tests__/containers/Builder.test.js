import { createMockStore } from 'redux-test-utils';
import _ from 'lodash';

import Builder, { Builder as BuilderComponent } from '../../containers/Builder'; // eslint-disable-line import/no-named-as-default
import ConjunctionGroup from '../../components/builder/ConjunctionGroup';
import TemplateInstance from '../../components/builder/TemplateInstance';
import { shallowRenderContainer, shallowRenderComponent, createTemplateInstance } from '../../utils/test_helpers';
import { instanceTree, emptyInstanceTree, elementGroups } from '../../utils/test_fixtures';
import * as types from '../../actions/types';

const operations = elementGroups.find(g => g.name === 'Operations');
const observations = elementGroups.find(g => g.name === 'Observations');
const orTemplate = operations.entries.find(e => e.id === 'Or');
const cholesterolTemplate = observations.entries.find(e => e.id === 'TotalCholesterol');

const baseState = {
  artifacts: { artifact: {} },
  resources: { resources: [] },
  valueSets: { valueSets: [] },
  templates: { templates: elementGroups }
};

test('children have correct classes', () => {
  const component = shallowRenderContainer(Builder, {}, createMockStore(baseState));
  const classNames = ['upload__modal', 'edit__modal', 'builder__header', 'builder__canvas'];
  component.find('.builder-wrapper').children().forEach((node, i) => {
    expect(node.hasClass(classNames[i])).toBeTruthy();
  });
});

test('shows loading screen when artifact is not loaded', () => {
  const component = shallowRenderContainer(Builder, {}, createMockStore({
    ...baseState,
    artifacts: { artifact: null }
  }));

  expect(component.dive().dive().hasClass('builder')).toBe(true);
  expect(component.dive().dive().text()).toContain('Loading...');
});

test('renders a single level tree for Inclusions and Exclusions', () => {
  const differentTree = _.cloneDeep(instanceTree);
  differentTree.childInstances.pop();

  const component = shallowRenderContainer(Builder, {}, createMockStore({
    ...baseState,
    artifacts: {
      artifact: {
        expTreeInclude: instanceTree,
        expTreeExclude: differentTree
      }
    }
  }));

  // Inclusions Tab

  expect(component.props().artifact.expTreeInclude.name).toEqual('And');
  expect(component.props().artifact.expTreeInclude.childInstances).toHaveLength(2);

  expect(component.dive().dive().find(ConjunctionGroup).first()
    .find(ConjunctionGroup)).toHaveLength(1);
  expect(component.dive().dive().find(ConjunctionGroup).first()
    .dive()
    .find(TemplateInstance)).toHaveLength(2);

  // Exclusions Tab

  expect(component.props().artifact.expTreeExclude.name).toEqual('And');
  expect(component.props().artifact.expTreeExclude.childInstances).toHaveLength(1);

  expect(component.dive().dive().find(ConjunctionGroup).at(1)
    .find(ConjunctionGroup)).toHaveLength(1);
  expect(component.dive().dive().find(ConjunctionGroup).at(1)
    .dive()
    .find(TemplateInstance)).toHaveLength(1);
});

test('adds instance', () => {
  const store = createMockStore({
    ...baseState,
    artifacts: {
      artifact: {
        expTreeInclude: emptyInstanceTree,
        expTreeExclude: emptyInstanceTree
      }
    }
  });
  const component = shallowRenderContainer(Builder, {}, store);

  const instance = createTemplateInstance(cholesterolTemplate);

  expect(component.props().artifact.expTreeInclude.childInstances).toHaveLength(0);
  expect(component.dive().dive().find(ConjunctionGroup).first()
    .dive()
    .find(ConjunctionGroup)).toHaveLength(0);
  expect(component.dive().dive().find(ConjunctionGroup).first()
    .dive()
    .find(TemplateInstance)).toHaveLength(0);

  component.dive().dive().instance().addInstance('expTreeInclude', instance, 'childInstances');

  store.getActions()[0]((action) => {
    expect(action.type).toEqual(types.UPDATE_ARTIFACT);
    expect(action.artifact.expTreeInclude.childInstances).toHaveLength(1);
    expect(action.artifact.expTreeInclude.childInstances[0].id).toEqual('TotalCholesterol');
  });
});

test('adds instance at correct tree position', () => {
  const conjunctionInstance = createTemplateInstance(orTemplate);

  const store = createMockStore({
    ...baseState,
    artifacts: {
      artifact: {
        expTreeInclude: { ...emptyInstanceTree, childInstances: [conjunctionInstance] },
        expTreeExclude: emptyInstanceTree
      }
    }
  });
  const component = shallowRenderContainer(Builder, {}, store);

  const observationInstance = createTemplateInstance(cholesterolTemplate);

  component.dive().dive().instance().addInstance('expTreeInclude', observationInstance, 'childInstances.0');

  store.getActions()[0]((action) => {
    const secondLevelChildren = action.artifact.expTreeInclude.childInstances[0].childInstances;

    expect(action.type).toEqual(types.UPDATE_ARTIFACT);
    expect(secondLevelChildren).toHaveLength(1);
    expect(secondLevelChildren[0].id).toEqual('TotalCholesterol');
  });
});

test('edits a template instance', () => {
  const store = createMockStore({
    ...baseState,
    artifacts: {
      artifact: {
        expTreeInclude: instanceTree,
        expTreeExclude: instanceTree
      }
    }
  });
  const component = shallowRenderContainer(Builder, {}, store);

  const name = 'test';
  component.dive().dive().instance().editInstance('expTreeInclude', { element_name: name }, 'childInstances.0');

  store.getActions()[0]((action) => {
    expect(action.type).toEqual(types.UPDATE_ARTIFACT);
    expect(action.artifact.expTreeInclude.childInstances[0].parameters[0].value).toEqual(name);
  });
});

test('edits a conjunction instance', () => {
  const store = createMockStore({
    ...baseState,
    artifacts: {
      artifact: {
        expTreeInclude: instanceTree,
        expTreeExclude: instanceTree
      }
    }
  });
  const component = shallowRenderContainer(Builder, {}, store);

  expect(store.getState().artifacts.artifact.expTreeInclude.childInstances[0].id).toEqual('AgeRange');
  expect(store.getState().artifacts.artifact.expTreeInclude.childInstances[0].name).toEqual('Age Range');

  component.dive().dive().instance()
    .editInstance('expTreeInclude', { id: 'And', name: 'And' }, 'childInstances.0', true);

  store.getActions()[0]((action) => {
    const instance = action.artifact.expTreeInclude.childInstances[0];
    expect(action.type).toEqual(types.UPDATE_ARTIFACT);
    expect(instance.id).toEqual('And');
    expect(instance.name).toEqual('And');
  });
});

test('updates an instance\'s modifiers', () => {
  const store = createMockStore({
    ...baseState,
    artifacts: {
      artifact: {
        expTreeInclude: instanceTree,
        expTreeExclude: instanceTree
      }
    }
  });
  const component = shallowRenderContainer(Builder, {}, store);

  const modifiers = [
    {
      id: 'BooleanNot',
      name: 'Not',
      inputTypes: [
        'boolean'
      ],
      returnType: 'boolean',
      cqlTemplate: 'BaseModifier',
      cqlLibraryFunction: 'not'
    }
  ];

  component.dive().dive().instance()
    .updateInstanceModifiers('expTreeInclude', modifiers, 'childInstances.0');

  store.getActions()[0]((action) => {
    const instance = action.artifact.expTreeInclude.childInstances[0];
    expect(action.type).toEqual(types.UPDATE_ARTIFACT);
    expect(instance.modifiers).toEqual(modifiers);
  });
});

test('deletes instance at correct tree position', () => {
  const store = createMockStore({
    ...baseState,
    artifacts: {
      artifact: {
        expTreeInclude: instanceTree,
        expTreeExclude: instanceTree
      }
    }
  });
  const component = shallowRenderContainer(Builder, {}, store);

  const initialInstancesLength = instanceTree.childInstances.length;

  const deleteButton = component.dive().dive()
    .find(ConjunctionGroup).first()
    .dive()
    .find(TemplateInstance)
    .first()
    .dive()
    .find('.element__deletebutton');

  deleteButton.simulate('click');

  store.getActions()[0]((action) => {
    const children = action.artifact.expTreeInclude.childInstances;
    expect(action.type).toEqual(types.UPDATE_ARTIFACT);

    expect(children).toHaveLength(initialInstancesLength - 1);
    expect(children.find(c => c.id === 'age_range')).toEqual(undefined);
    expect(children[0].id).toEqual('LDLTest');
  });
});

test('gets a list of all instances', () => {
  const store = createMockStore({
    ...baseState,
    artifacts: {
      artifact: {
        expTreeInclude: instanceTree,
        expTreeExclude: emptyInstanceTree
      }
    }
  });
  const component = shallowRenderContainer(Builder, {}, store);

  expect(component.dive().dive().instance()
    .getAllInstances('expTreeExclude')).toHaveLength(0);

  const fullInstanceTree = _.cloneDeep(emptyInstanceTree);
  fullInstanceTree.childInstances = [
    createTemplateInstance(orTemplate),
    createTemplateInstance(cholesterolTemplate)
  ];

  const storeWithTemplateInstances = createMockStore({
    ...baseState,
    artifacts: {
      artifact: {
        expTreeInclude: instanceTree,
        expTreeExclude: fullInstanceTree
      }
    }
  });
  const componentWithTemplateInstances = shallowRenderContainer(Builder, {}, storeWithTemplateInstances);

  expect(componentWithTemplateInstances.dive().dive().instance()
    .getAllInstances('expTreeExclude')).toHaveLength(2);
});

test('increments the uniqueId counter', () => {
  const component = shallowRenderComponent(BuilderComponent);

  const currentValue = component.state().uniqueIdCounter;
  component.instance().incrementUniqueIdCounter();

  expect(component.state().uniqueIdCounter).toEqual(currentValue + 1);
});
