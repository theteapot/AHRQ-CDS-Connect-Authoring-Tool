import React, { Component } from 'react';
import _ from 'lodash';

// this.props are from a templateInstance parameters object,
// and a function called UpdateInstance that takes an object with
// key-value pairs that represents that state of the templateInstance
class NumberParameter extends Component {
  constructor(props) {
    super(props);
    this.state = { checked: this.props.param.exclusive };
  }

  updateExclusive = (event) => {
    this.props.param.exclusive = event.target.checked;
    this.setState({ checked: event.target.checked });
  }

  render() {
    const id = _.uniqueId('parameter-');

    return (
      <div>
      <div className='form__group'>
        <label htmlFor={id}>
          {this.props.param.name}:

          <input id={id}
            type="number"
            name={this.props.param.id}
            value={this.props.value || ''} // if .value is undefined, will switch between controlled and uncontrolled input. See https://github.com/twisty/formsy-react-components/issues/66
            onChange={(event) => {
              // eslint-disable-next-line max-len
              const value = (this.props.typeOfNumber === 'integer') ? parseInt(event.target.value, 10) : parseFloat(event.target.value, 10);
              this.props.updateInstance({ [event.target.name]: value });
            }}
          />
          { ('exclusive' in this.props.param)
          ? <div className="form__caption">
              <input id={`${id}-exclusive`}
                type='checkbox'
                checked={this.state.checked}
                onChange={event => this.updateExclusive(event)}/>
              <label htmlFor={`${id}-exclusive`}>{'Exclusive'}</label>
            </div>
          : null }
        </label>
      </div>
      </div>
    );
  }
}

export default NumberParameter;
