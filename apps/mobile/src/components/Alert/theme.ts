import { tokens } from '@/src/theme/tokens'

export const alertTheme = {
  light_success: {
    background: tokens.color.successBackgroundLight,
    color: tokens.color.successMainLight,
    badgeBackground: tokens.color.successDarkLight,
    badgeTextColor: tokens.color.backgroundMainDark,
  },
  light_info: {
    background: tokens.color.infoBackgroundLight,
    color: tokens.color.infoMainLight,
  },
  light_warning: {
    background: tokens.color.warning1MainLight,
    color: tokens.color.warning1TextLight,
  },
  light_error: {
    background: tokens.color.error1MainLight,
    color: tokens.color.error1ContrastTextLight,
  },
  dark_success: {
    background: tokens.color.successBackgroundDark,
    color: tokens.color.successMainDark,
    badgeBackground: tokens.color.successDarkDark,
  },
  dark_info: {
    background: tokens.color.infoBackgroundDark,
    color: tokens.color.infoMainDark,
  },
  dark_warning: {
    background: tokens.color.warning1MainDark,
    color: tokens.color.warning1TextDark,
  },
  dark_error: {
    background: tokens.color.error1MainDark,
    color: tokens.color.error1ContrastTextDark,
  },
}
