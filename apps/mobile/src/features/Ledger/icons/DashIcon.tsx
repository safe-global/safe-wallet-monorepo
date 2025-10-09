import React from 'react'
import Svg, { Line } from 'react-native-svg'

export const DashIcon = () => (
  <Svg width="32" height="2">
    <Line x1="1" y1="1" x2="31" y2="1" stroke="#636669" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 6" />
  </Svg>
)
