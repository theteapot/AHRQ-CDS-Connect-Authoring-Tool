import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import _ from 'lodash';

/* eslint-disable jsx-a11y/label-has-for */

export default class ErrorStatement extends Component {
  static propTypes = {
    booleanParameters: PropTypes.array.isRequired,
    subpopulations: PropTypes.array.isRequired,
    errorStatement: PropTypes.object.isRequired,
    updateErrorStatement: PropTypes.func.isRequired
  };

  // Ensures there is at least one statement to start
  componentWillMount = () => {
    const { statements } = this.props.errorStatement;
    if (statements.length < 1) {
      this.addStatement(null);
    }
  }

  // Prepopulates dropdown with recommendation is null and then adds bool params
  options = () => {
    const dropdown = [{ label: 'Recommendations is null', value: '"Recommendation" is null' }];
    const params = this.props.booleanParameters.map(p => ({ label: p.name, value: p.value }));
    const subpops = this.props.subpopulations.map((s) => {
      if (s.special) {
        return ({ label: s.subpopulationName, value: s.special_subpopulationName });
      }
      return ({
        label: s.subpopulationName,
        value: s.subpopulationName ? `"${s.subpopulationName}"` : `"${s.uniqueId}"`
      });
    });
    return dropdown.concat(params).concat(subpops);
  }

  // Generic statement used to handle if then
  baseStatement = parent => ({
    condition: { label: null, value: null },
    thenClause: '',
    child: null,
    useThenClause: true
  })

  // Child object when doing single layer nesting
  baseChild = parent => ({
    statements: [
      {
        condition: { label: null, value: null },
        thenClause: '',
        child: null,
        useThenClause: true
      }
    ],
    elseClause: 'null'
  })

  // Adds and if/then statement to base or child
  addStatement = (parent) => {
    const newStatement = this.baseStatement(parent);
    const newErrorStatement = _.cloneDeep(this.props.errorStatement);
    const { statements } = newErrorStatement;
    if (parent == null) {
      statements.push(newStatement);
    } else {
      statements[parent].child.statements.push(newStatement);
    }
    this.props.updateErrorStatement(newErrorStatement);
  }

  // Updates the if/then statements in base and child
  setStatement = (value, parent, index, type) => {
    let newValue = value;
    if (newValue === null) {
      newValue = { label: null, value: null };
    }
    const newErrorStatement = _.cloneDeep(this.props.errorStatement);
    const { statements } = newErrorStatement;
    if (parent == null) {
      statements[index][type] = newValue;
    } else {
      statements[parent].child.statements[index][type] = newValue;
    }
    this.props.updateErrorStatement(newErrorStatement);
  }

  // Delete an if/then statement in base and child
  deleteStatement = (parent, index) => {
    const newErrorStatement = _.cloneDeep(this.props.errorStatement);
    const { statements } = newErrorStatement;
    if (parent == null) {
      statements.splice(index, 1);
    } else {
      statements[parent].child.statements.splice(index, 1);
    }
    this.props.updateErrorStatement(newErrorStatement);
  }

  // Updates the else statements in base and child
  setElse = (value, parent) => {
    const newErrorStatement = _.cloneDeep(this.props.errorStatement);
    if (parent == null) {
      newErrorStatement.elseClause = value;
    } else {
      newErrorStatement.statements[parent].child.elseClause = value;
    }
    this.props.updateErrorStatement(newErrorStatement);
  }

  // Functionality on whether to use then or nested if
  handleUseThenClause = (parent) => {
    const newErrorStatement = _.cloneDeep(this.props.errorStatement);
    const statement = newErrorStatement.statements[parent];
    if (statement.child == null) {
      const newChild = this.baseChild(parent);
      statement.child = newChild;
    }
    statement.useThenClause = !statement.useThenClause;
    this.props.updateErrorStatement(newErrorStatement);
  }

  // Renders if part
  renderCondition = (statement, parent, index) => (<Select
      key={`condition-${parent != null ? parent : -1}-${index}`}
      inputProps={{ id: `condition-${parent != null ? parent : -1}-${index}` }}
      index={index}
      value={statement.condition.value}
      options={this.options()}
      onChange={ e => this.setStatement(e, parent, index, 'condition')}
    />)

  // Renders then part of statement
  renderThen = (statement, parent, index) => (
    <div className="field recommendation__block-then">
      <label className="label">Then</label>
      <div className="control">
        <textarea
          className="textarea"
          name="text"
          title="ThenClause"
          aria-label="ThenClause"
          placeholder='Describe your error'
          value={statement.thenClause}
          onChange={e => this.setStatement(e.target.value, parent, index, 'thenClause')} />
      </div>
    </div>
  )

  // Renders nested if
  renderChildren = (statement, parent) => (
    <div className="recommendation__block">
      { statement.child && statement.child.statements.map((cStatement, i) => {
        const ifLabel = i ? 'Else if' : 'If';
        return (
          <div key={i}>
            <div className="field recommendation__block-if">
              <label className="label" htmlFor={`condition-${parent != null ? parent : -1}-${i}`}>{ifLabel}</label>
              <div className="form__group control">
                {this.renderCondition(cStatement, parent, i)}
                {statement.child.statements.length > 1 && this.renderDeleteButton(parent, i)}
              </div>
            </div>
            {this.renderThen(cStatement, parent, i)}
          </div>);
      })}
      { this.renderAddIfButton(parent) }
      { this.renderElse(parent) }
    </div>
  )

  // Renders button to manage then or nested if
  renderNestingButton = (statement, index) => (
    <div className="field recommendation__action">
      <button
        className="button primary-button"
        onClick={e => this.handleUseThenClause(index)}>
        {this.props.errorStatement.statements[index].useThenClause ? 'And Also If...' : '(Remove nested statements)'}
      </button>
    </div>
  )

  // Renders button to add if else statements
  renderAddIfButton = parent => (
    <div className="field recommendation__action">
      <button
        className="button primary-button"
        onClick={e => this.addStatement(parent)}> Or Else If... </button>
    </div>
  )

  // Renders delete if/then button
  renderDeleteButton = (parent, index) => (
    <div className="recommendation__action">
      <button
        className="button"
        onClick={e => this.deleteStatement(parent, index)}> Delete If Clause </button>
    </div>
  )

  // Renders else text box
  renderElse = (parent) => {
    let elseText = '';
    if (parent == null) {
      elseText = this.props.errorStatement.elseClause;
    } else {
      elseText = this.props.errorStatement.statements[parent].child.elseClause;
    }
    return (
      <div className="field recommendation__block-else">
        <label className="label">Else</label>
        <div className="control">
          <textarea
            className="textarea"
            name="text"
            title="Else"
            aria-label="Else"
            placeholder='If none of the conditions hold...'
            value={elseText}
            onChange={e => this.setElse(e.target.value, parent)} />
        </div>
      </div>
    );
  }

  // Main render function
  render() {
    return (
      <section className="section is-clearfix recommendation">
        <div className="field is-horizontal">
          <div className="field-label is-large">
            <label className="label has-text-left">Errors</label>
          </div>
        </div>
        { this.props.errorStatement && this.props.errorStatement.statements.map((statement, i) => {
          const ifLabel = i ? 'Else if' : 'If';
          return (
            <div key={i}>
              <div className="field recommendation__block-if">
                <label className="label" htmlFor={`condition-${i}`}>{ifLabel}</label>
                <div className="form__group control">
                  {this.renderCondition(statement, null, i)}
                  {this.props.errorStatement.statements.length > 1 && this.renderDeleteButton(null, i)}
                </div>
                {this.renderNestingButton(statement, i)}
              </div>
              {statement.useThenClause
              ? this.renderThen(statement, null, i)
              : this.renderChildren(statement, i)}
            </div>);
        })}
        { this.renderAddIfButton(null) }
        { this.renderElse(null) }
      </section>
    );
  }
}
