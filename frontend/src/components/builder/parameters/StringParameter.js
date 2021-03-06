import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

/**
 * props are from a templateInstance parameters object,
 * and a function called UpdateInstance that takes an object with
 * key-value pairs that represents that state of the templateInstance
 */
export default class StringParameter extends Component {
  render() {
    const { id, name, value, updateInstance } = this.props;
    const formId = _.uniqueId('parameter-');

    return (
      <div className="form__group">
        <label htmlFor={formId}>
          {name}:

          <input
            id={formId}
            type="text"
            name={id}
            value={value || ''}
            onChange={(event) => {
              updateInstance({ [event.target.name]: event.target.value });
            }}
          />
        </label>
      </div>
    );
  }
}

StringParameter.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  updateInstance: PropTypes.func.isRequired
};
