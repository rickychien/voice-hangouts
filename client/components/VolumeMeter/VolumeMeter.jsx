import PropTypes from 'prop-types';
import React from 'react';
import volumeMeter from 'volume-meter';

import styles from './VolumeMeter.css';

class VolumeMeter extends React.PureComponent {
  static propTypes = {
    enabled: PropTypes.bool.isRequired,
    stream: PropTypes.object.isRequired,
  };

  state = {
    volume: 0,
  }

  componentDidMount() {
    const { stream } = this.props;

    const audioContext = new AudioContext();
    this.meter = volumeMeter(audioContext, { tweenIn: 2, tweenOut: 6 }, (volume) => {
      this.setState({ volume: this.props.enabled ? volume * 2 : 0 });
    });
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(this.meter);
  }

  componentWillUnmount() {
    this.meter.stop();
    this.meter = null;
  }

  render() {
    const { volume } = this.state;

    return (
      <svg className={ styles.volumeMeter } width={ `${volume}px` }>
        <polygon points="0,20 25,0 25,20" />
      </svg>
    );
  }
}

export default VolumeMeter;
