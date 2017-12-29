import PropTypes from 'prop-types';
import React from 'react';
import volumeMeter from 'volume-meter';

import styles from './VolumeMeter.css';

class VolumeMeter extends React.PureComponent {
  static propTypes = {
    connector: PropTypes.object.isRequired,
    stream: PropTypes.object.isRequired,
  };

  state = {
    volume: 0,
  }

  audioContext = new AudioContext();

  componentDidMount() {
    const { connector, stream } = this.props;
    this.meter = volumeMeter(this.audioContext, { tweenIn: 2, tweenOut: 6 }, (volume) => {
      this.setState({ volume });
    });
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.meter);
  }

  componentWillUnmount() {
    this.meter.stop();
    this.meter = null;
  }

  render() {
    const { volume } = this.state;

    return (
      <svg className={ styles.volumeMeter } width={ `${volume * 3}px` }>
        <polygon points="0,20 25,0 25,20" />
      </svg>
    );
  }
}

export default VolumeMeter;
