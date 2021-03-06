import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FontAwesome from 'react-fontawesome';
import _ from 'lodash';

// Try to keep these ordered same as in folder (i.e. alphabetically)
import NumberParameter from './parameters/NumberParameter';
import StaticParameter from './parameters/StaticParameter';
import StringParameter from './parameters/StringParameter';
import ValueSetParameter from './parameters/ValueSetParameter';

import Modifiers from '../../data/modifiers';
import BooleanComparison from './modifiers/BooleanComparison';
import CheckExistence from './modifiers/CheckExistence';
import LabelModifier from './modifiers/LabelModifier';
import LookBack from './modifiers/LookBack';
import ValueComparison from './modifiers/ValueComparison';
import ValueComparisonObservation from './modifiers/ValueComparisonObservation';
import WithUnit from './modifiers/WithUnit';

function getInstanceName(instance) {
  return (instance.parameters.find(p => p.id === 'element_name') || {}).value;
}

export default class TemplateInstance extends Component {
  constructor(props) {
    super(props);

    this.modifierMap = _.keyBy(Modifiers, 'id');
    this.modifersByInputType = {};

    Modifiers.forEach((modifier) => {
      modifier.inputTypes.forEach((inputType) => {
        this.modifersByInputType[inputType] = (this.modifersByInputType[inputType] || []).concat(modifier);
      });
    });

    this.state = {
      showElement: true,
      relevantModifiers: (this.modifersByInputType[this.props.templateInstance.returnType] || []),
      showModifiers: false
    };
  }

  componentWillMount() {
    this.props.templateInstance.parameters.forEach((param) => {
      this.setState({ [param.id]: param.value });
    });

    const otherInstances = this.getOtherInstances(this.props);
    this.setState({ otherInstances });

    this.setState({ returnType: this.props.templateInstance.returnType });
  }

  componentDidMount() {
    this.setAppliedModifiers(this.props.templateInstance.modifiers || []);
  }

  componentWillReceiveProps(nextProps) {
    const otherInstances = this.getOtherInstances(nextProps);
    let returnType;
    if (!(_.isEmpty(nextProps.templateInstance.modifiers))) {
      returnType = _.last(nextProps.templateInstance.modifiers).returnType;
    } else {
      returnType = this.props.templateInstance.returnType;
    }
    this.setState({
      otherInstances,
      returnType
    });
  }

  // Props will either be this.props or nextProps coming from componentWillReceiveProps
  getOtherInstances(props) {
    const otherInstances = props.otherInstances.filter(this.notThisInstance)
      .map(instance => ({
        name: getInstanceName(instance),
        id: instance.id,
        returnType: (_.isEmpty(instance.modifiers) ? instance.returnType : _.last(instance.modifiers).returnType)
      }));
    return otherInstances;
  }

  notThisInstance = instance => (
    // Look up by uniqueId to correctly identify the current instance
    // For example, "and" elements have access to all other "and" elements besides itself
    // They have different uniqueId's but the id's of all "and" elements is "And"
    this.props.templateInstance.uniqueId !== instance.uniqueId
  )

  updateInstance = (newState) => {
    this.setState(newState);
    this.props.editInstance(this.props.treeName, newState, this.getPath(), false);
  }

  renderAppliedModifier = (modifier, index) => {
    const modifierForm = ((mod) => {
      // Reset values on modifiers that were not previously set or saved in the database
      if (!mod.values && this.modifierMap[mod.id].values) {
        mod.values = this.modifierMap[mod.id].values;
      }

      switch (mod.type || mod.id) {
        case 'ValueComparison':
          return (
            <ValueComparison
              key={index}
              index={index}
              min={mod.values.min}
              minInclusive={mod.values.minInclusive}
              max={mod.values.max}
              maxInclusive={mod.values.maxInclusive}
              updateAppliedModifier={this.updateAppliedModifier}/>
          );
        case 'ValueComparisonObservation':
          return (
            <ValueComparisonObservation
              key={index}
              index={index}
              minOperator={mod.values.minOperator}
              minValue={mod.values.minValue}
              maxOperator={mod.values.maxOperator}
              maxValue={mod.values.maxValue}
              updateAppliedModifier={this.updateAppliedModifier}/>
          );
        case 'LookBack':
          return (
            <LookBack
              key={index}
              index={index}
              value={mod.values.value}
              unit={mod.values.unit}
              updateAppliedModifier={this.updateAppliedModifier}/>
          );
        case 'WithUnit':
          return (
            <WithUnit
              key={index}
              index={index}
              unit={mod.values.unit}
              updateAppliedModifier={this.updateAppliedModifier}/>
          );
        case 'BooleanComparison':
          return (
            <BooleanComparison
              key={index}
              index={index}
              value={mod.values.value}
              updateAppliedModifier={this.updateAppliedModifier}/>
          );
        case 'CheckExistence':
          return (
            <CheckExistence
              key={index}
              index={index}
              value={mod.values.value}
              updateAppliedModifier={this.updateAppliedModifier}/>
          );
        default:
          return (<LabelModifier key={index} name={mod.name} id={mod.id}/>);
      }
    })(modifier);

    return (
      <div key={index} className="modifier">
        {modifierForm}
        { (index + 1 === this.props.templateInstance.modifiers.length)
          ? <button
            onClick={this.removeLastModifier}
            className="modifier__deletebutton secondary-button"
            aria-label={'remove last expression'}>
              <FontAwesome fixedWidth name='close'/>
            </button>
          : null
        }
      </div>
    );
  }

  renderAppliedModifiers = () => (
    <div className="modifier__list" aria-label="Expression List">
      {(this.props.templateInstance.modifiers || []).map((modifier, index) =>
        this.renderAppliedModifier(modifier, index))}
    </div>
  )

  setAppliedModifiers = (modifiers) => {
    const returnType = _.isEmpty(modifiers) ? this.props.templateInstance.returnType : _.last(modifiers).returnType;
    this.setState({ returnType }, this.filterRelevantModifiers);
    this.props.updateInstanceModifiers(this.props.treeName, modifiers, this.getPath(), this.props.subpopulationIndex);
  }

  filterRelevantModifiers = () => {
    const relevantModifiers = this.modifersByInputType[this.state.returnType] || [];
    if (!this.props.templateInstance.checkInclusionInVS) { // Rather than suppressing `CheckInclusionInVS` in every element, assume it's suppressed unless explicity stated otherwise
      _.remove(relevantModifiers, modifier => modifier.id === 'CheckInclusionInVS');
    }
    if (_.has(this.props.templateInstance, 'suppressedModifiers')) {
      this.props.templateInstance.suppressedModifiers.forEach(suppressedModifier =>
        _.remove(relevantModifiers, relevantModifier => relevantModifier.id === suppressedModifier));
    }
    this.setState({ relevantModifiers });
  }

  handleModifierSelected = (event) => {
    const selectedModifier = _.cloneDeep(this.modifierMap[event.target.value]);
    const modifiers = (this.props.templateInstance.modifiers || []).concat(selectedModifier);
    this.setState({ showModifiers: false });
    this.setAppliedModifiers(modifiers);
  }

  removeLastModifier = () => {
    const modifiers = _.initial(this.props.templateInstance.modifiers);
    this.setAppliedModifiers(modifiers);
  }

  updateAppliedModifier = (index, value) => {
    const modifiers = this.props.templateInstance.modifiers;
    _.assign(modifiers[index].values, value);
    this.setAppliedModifiers(modifiers);
  }

  renderModifierSelect = () => (
    <div>
      { (
          !this.props.templateInstance.cannotHaveModifiers
          && (this.state.relevantModifiers.length > 0 || this.props.templateInstance.modifiers.length === 0)
        ) ?
          <div className="modifier__selection">
            <button
              onClick={() => this.setState({ showModifiers: !this.state.showModifiers })}
              className="modifier__addbutton secondary-button"
              aria-label={'add expression'}>
              Add Expression</button>
            { (this.state.showModifiers)
              ? this.state.relevantModifiers.map(modifier =>
                  <button key={modifier.id}
                    value={modifier.id}
                    onClick={this.handleModifierSelected} className="modifier__button secondary-button">
                    {modifier.name}
                  </button>)
              : null
            }
          </div>
        : null
      }
    </div>
  )

  selectTemplate = (param) => {
    if (param.static) {
      return (
        <StaticParameter
          key={param.id}
          param={param}
          updateInstance={this.updateInstance} />
      );
    }

    switch (param.type) {
      case 'number':
        return (
          <NumberParameter
            key={param.id}
            param={param}
            value={this.state[param.id]}
            typeOfNumber={param.typeOfNumber}
            updateInstance={this.updateInstance} />
        );
      case 'string':
        return (
          <StringParameter
            key={param.id}
            {...param}
            updateInstance={this.updateInstance} />
        );
      case 'observation_vsac':
      case 'condition_vsac':
      case 'medication_vsac':
      case 'procedure_vsac':
      case 'encounter_vsac':
      case 'allergyIntolerance_vsac':
        return (
          <StringParameter
            key={param.id}
            {...param}
            updateInstance={this.updateInstance} />
        );
      case 'valueset':
        return (
          <ValueSetParameter
            key={param.id}
            param={param}
            valueset={this.props.resources}
            valueSets={this.props.valueSets}
            loadValueSets={this.props.loadValueSets}
            updateInstance={this.updateInstance} />
        );
      default:
        return undefined;
    }
  }

  showHideElementBody = () => {
    this.setState({ showElement: !this.state.showElement });
  }

  getPath = () => this.props.getPath(this.props.templateInstance.uniqueId)

  renderBody() {
    return (
      <div className="element__body">
        <div>
          {this.props.templateInstance.parameters.map((param, index) =>
            // todo: each parameter type should probably have its own component
            this.selectTemplate(param))}
        </div>

        {this.renderAppliedModifiers()}

        <div className='modifier__return__type'>
          Return Type: {_.startCase(this.state.returnType)}
        </div>

        {this.renderModifierSelect()}
      </div>
    );
  }

  render() {
    return (
      <div className="element element__expanded">
        <div className="element__header">
          <span className="element__heading">
            {this.props.templateInstance.name}
          </span>

          <div className="element__buttonbar">
            {this.props.renderIndentButtons(this.props.templateInstance)}

            <button
              onClick={this.showHideElementBody}
              className="element__hidebutton secondary-button"
              aria-label={`hide ${this.props.templateInstance.name}`}>
              <FontAwesome fixedWidth name={this.state.showElement ? 'angle-double-down' : 'angle-double-right'}/>
            </button>

            <button
              onClick={() => this.props.deleteInstance(this.props.treeName, this.getPath())}
              className="element__deletebutton secondary-button"
              aria-label={`remove ${this.props.templateInstance.name}`}>
              <FontAwesome fixedWidth name='close'/>
            </button>
          </div>
        </div>

        <div>
          {this.state.showElement ? this.renderBody() : null}
        </div>
      </div>
    );
  }
}

TemplateInstance.propTypes = {
  resources: PropTypes.object.isRequired,
  valueSets: PropTypes.array,
  loadValueSets: PropTypes.func.isRequired,
  getPath: PropTypes.func.isRequired,
  treeName: PropTypes.string.isRequired,
  templateInstance: PropTypes.object.isRequired,
  otherInstances: PropTypes.array.isRequired,
  editInstance: PropTypes.func.isRequired,
  updateInstanceModifiers: PropTypes.func.isRequired,
  deleteInstance: PropTypes.func.isRequired
};
