import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import ReactModal from 'react-modal';

// For screen readers to not see the background text
ReactModal.setAppElement('#root');

class LoginDisclaimer extends Component {
  renderText = () => (
    `This warning banner provides privacy and security notices consistent with applicable federal laws, 
    directives, and other federal guidance for accessing this Government system, which includes all devices/storage 
    media attached to this system. This system is provided for Government-authorized use only. Unauthorized or 
    improper use of this system is prohibited and may result in disciplinary action and/or civil and criminal 
    penalties. At any time, and for any lawful Government purpose, the government may monitor, record, and 
    audit your system usage and/or intercept, search and seize any communication or data transiting or stored on 
    this system. Therefore, you have no reasonable expectation of privacy. Any communication or data transiting or 
    stored on this system may be disclosed or used for any lawful Government purpose.`
  );

  render() {
    return (
      <ReactModal contentLabel="Login Disclaimer"
        id='login-disclaimer'
        isOpen={this.props.showModal}
        onRequestClose={() => this.props.closeModal(false)}
        className="modal-style"
        shouldCloseOnOverlayClick={false}
        overlayClassName='modal-overlay'>
        <div className="modal__header">
          <span className="modal__heading">
            Login Disclaimer
          </span>
          <div className="modal__buttonbar">
            <button onClick={() => this.props.closeModal(false)}
              className="modal__deletebutton"
              aria-label="Close login disclaimer">
              <FontAwesome fixedWidth name='close'/>
            </button>
          </div>
        </div>
        <div className="modal__body">
          {this.renderText()}
          <br/><br/>
          <button onClick={() => this.props.closeModal(false)}>Cancel</button>
          <button
            className="primary-button"
            onClick={() => this.props.closeModal(true)}>
            OK
          </button>
        </div>
      </ReactModal>
    );
  }
}

export default LoginDisclaimer;