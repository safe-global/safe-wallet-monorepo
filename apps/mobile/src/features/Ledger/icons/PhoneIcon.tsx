import React from 'react'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'

export const PhoneIcon = () => (
  <Svg width="100" height="70" viewBox="0 0 100 70" fill="none">
    <Path
      d="M8.29297 1.5H91.707C95.4586 1.5 98.5 4.54139 98.5 8.29297V68.5H1.5V8.29297C1.5 4.54139 4.54139 1.5 8.29297 1.5Z"
      fill="#121312"
    />
    <Path
      d="M8.29297 1.5H91.707C95.4586 1.5 98.5 4.54139 98.5 8.29297V68.5H1.5V8.29297C1.5 4.54139 4.54139 1.5 8.29297 1.5Z"
      stroke="url(#paint0_linear_8061_34172)"
      strokeWidth="3"
    />
    <Path
      d="M27.0669 0H72.9336C72.0499 0 71.3336 0.716344 71.3336 1.6V1.79021C71.3336 2.45555 71.3336 2.78822 71.3073 3.06855C71.0372 5.9529 68.7531 8.23699 65.8688 8.50708C65.5885 8.53333 65.2558 8.53333 64.5904 8.53333H35.41C34.7447 8.53333 34.412 8.53333 34.1317 8.50708C31.2473 8.23699 28.9632 5.9529 28.6931 3.06855C28.6669 2.78822 28.6669 2.45555 28.6669 1.79021V1.6C28.6669 0.716344 27.9505 0 27.0669 0Z"
      fill="#636669"
    />
    <Defs>
      <LinearGradient id="paint0_linear_8061_34172" x1="50" y1="0" x2="50" y2="70" gradientUnits="userSpaceOnUse">
        <Stop stopColor="#636669" />
        <Stop offset="1" stopColor="#121312" />
      </LinearGradient>
    </Defs>
  </Svg>
)
