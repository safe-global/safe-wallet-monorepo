import React from 'react'
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg'

export const BluetoothIcon = () => (
  <Svg width="26" height="34" viewBox="0 0 26 34" fill="none">
    <Rect x="1" y="1" width="24" height="32" rx="8" fill="url(#paint0_linear_8061_34196)" />
    <Rect x="1" y="1" width="24" height="32" rx="8" stroke="black" />
    <Path
      d="M8 13L18 21L13 25V9L18 13L8 21"
      stroke="#0A0A0A"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Defs>
      <LinearGradient id="paint0_linear_8061_34196" x1="13" y1="1" x2="13" y2="33" gradientUnits="userSpaceOnUse">
        <Stop stopColor="white" />
        <Stop offset="1" stopColor="#12FF80" />
      </LinearGradient>
    </Defs>
  </Svg>
)
