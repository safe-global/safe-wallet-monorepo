import { getTokenValue } from 'tamagui'
import type { Theme } from '@react-navigation/native/src/types'
import { DarkTheme, DefaultTheme } from '@react-navigation/native'
export const NavDarkTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    primary: getTokenValue('$color.primaryMainDark'),
    background: getTokenValue('$color.backgroundMainDark'),
    card: getTokenValue('$color.backgroundMainDark'),
    text: getTokenValue('$color.textPrimaryDark'),
    border: getTokenValue('$color.backgroundMainDark'),
    notification: getTokenValue('$color.warningBackgroundDark'),
  },
}

export const NavLightTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    primary: getTokenValue('$color.primaryMainLight'),
    background: getTokenValue('$color.backgroundDefaultLight'),
    card: getTokenValue('$color.backgroundMainLight'),
    text: getTokenValue('$color.textPrimaryLight'),
    border: getTokenValue('$color.backgroundMainLight'),
    notification: getTokenValue('$color.warningBackgroundLight'),
  },
}
