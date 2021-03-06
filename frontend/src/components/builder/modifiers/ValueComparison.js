import React, { Component } from 'react';
import _ from 'lodash';

class ValueComparison extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  render() {
    const minId = _.uniqueId('min-');
    const minInclusiveId = _.uniqueId('minInclusive-');
    const maxId = _.uniqueId('max-');
    const maxInclusiveId = _.uniqueId('maxInclusive-');

    return (
      <div>
        <div >
          <label htmlFor={minId}>
            Min:
            <input id={minId} type="number" name="min" value={this.props.min}
              onChange={(event) => {
                this.props.updateAppliedModifier(this.props.index, { min: parseInt(event.target.value, 10) });
              }}
            />
          </label>
          <label htmlFor={minInclusiveId}>
            <input id={minInclusiveId} type="checkbox" name="minInclusive" checked={this.props.minInclusive}
              onChange={(event) => {
                this.props.updateAppliedModifier(this.props.index, { minInclusive: event.target.checked });
              }}
            />
            Inclusive
          </label>
          <label htmlFor={maxId}>
            Max:
            <input id={maxId} type="number" name="max" value={this.props.max}
              onChange={(event) => {
                this.props.updateAppliedModifier(this.props.index, { max: parseInt(event.target.value, 10) });
              }}
            />
          </label>
          <label htmlFor={maxInclusiveId}>
            <input id={maxInclusiveId} type="checkbox" name="maxInclusive" checked={this.props.maxInclusive}
              onChange={(event) => {
                this.props.updateAppliedModifier(this.props.index, { maxInclusive: event.target.checked });
              }}
            />
            Inclusive
          </label>

        </div>
      </div>
    );
  }
}

export default ValueComparison;
