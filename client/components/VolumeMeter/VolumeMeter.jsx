import PropTypes from 'prop-types'
import React, { useState, useEffect } from 'react'
import volumeMeter from 'volume-meter'
import styles from './VolumeMeter.css'

function VolumeMeter ({ enabled, stream }) {
  const [volume, setVolume] = useState(0)

  useEffect(
    () => {
      if (!enabled) return

      const audioContext = new AudioContext()
      let meter = volumeMeter(
        audioContext,
        { tweenIn: 2, tweenOut: 6 },
        volume => {
          if (enabled) {
            setVolume(volume)
          }
        }
      )
      audioContext.createMediaStreamSource(stream).connect(meter)

      return () => {
        audioContext.close()
        meter.stop()
        meter = null
      }
    },
    [enabled]
  )

  return (
    <svg className={styles.volumeMeter} width={enabled ? `${volume}px` : 0}>
      <polygon points='0,20 25,0 25,20' />
    </svg>
  )
}

VolumeMeter.propTypes = {
  enabled: PropTypes.bool.isRequired,
  stream: PropTypes.object.isRequired
}

export default VolumeMeter
