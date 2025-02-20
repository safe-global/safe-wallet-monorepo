import { tokens } from '@/src/theme/tokens'

export const badgeTheme = {
  light_badge_success: {
    background: tokens.color.successLightDark,
    color: tokens.color.backgroundMainDark,
  },
  dark_badge_success: {
    color: tokens.color.backgroundMainDark,
    background: tokens.color.primaryMainDark,
  },
  light_badge_success_variant1: {
    background: tokens.color.successDarkDark,
    color: tokens.color.successMainLight,
  },
  dark_badge_success_variant1: {
    background: tokens.color.successDarkDark,
    color: tokens.color.successMainLight,
  },
  light_badge_warning: {
    color: tokens.color.warning1MainLight,
    background: tokens.color.warningBackgroundLight,
  },
  dark_badge_warning: {
    color: tokens.color.warning1MainDark,
    background: tokens.color.warning1ContrastTextDark,
  },
  light_badge_warning_variant1: {
    color: tokens.color.warning1ContrastTextLight,
    background: tokens.color.warningDarkDark,
  },
  dark_badge_warning_variant1: {
    color: tokens.color.warning1ContrastTextDark,
    background: tokens.color.warningDarkDark,
  },
  dark_badge_background: {
    color: tokens.color.textPrimaryDark,
    background: tokens.color.logoBackgroundDark,
  },
  light_badge_background: {
    color: tokens.color.textPrimaryLight,
    background: tokens.color.logoBackgroundLight,
  },
  light_badge_error: {
    color: tokens.color.errorMainLight,
    background: tokens.color.errorBackgroundLight,
  },
  dark_badge_error: {
    color: tokens.color.errorMainDark,
    background: tokens.color.errorBackgroundDark,
  },
  light_badge_background_inverted: {
    color: tokens.color.logoBackgroundLight,
    background: tokens.color.textPrimaryLight,
  },
  dark_badge_background_inverted: {
    color: tokens.color.logoBackgroundDark,
    background: tokens.color.textPrimaryDark,
  },
}
