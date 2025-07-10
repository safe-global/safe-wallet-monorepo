import { tokens } from '@/src/theme/tokens'

export const badgeTheme = {
  light_badge_success: {
    background: tokens.color.successLightDark,
    color: tokens.color.backgroundMainDark,
  },
  dark_badge_success: {
    color: tokens.color.backgroundMainDark,
    background: tokens.color.backgroundLightDark,
  },
  light_badge_success_variant1: {
    background: tokens.color.successBackgroundLight,
    color: tokens.color.successMainLight,
  },
  dark_badge_success_variant1: {
    background: tokens.color.successDarkDark,
    color: tokens.color.successMainLight,
  },
  light_badge_success_variant2: {
    background: tokens.color.secondaryLightLight,
    color: tokens.color.primaryMainLight,
  },
  dark_badge_success_variant2: {
    background: tokens.color.secondaryMainLight,
    color: tokens.color.primaryMainLight,
  },
  light_badge_warning: {
    color: tokens.color.warning1ContrastTextLight,
    background: tokens.color.warningBackgroundLight,
  },
  dark_badge_warning: {
    color: tokens.color.warning1MainDark,
    background: tokens.color.warning1ContrastTextDark,
  },
  light_badge_warning_variant1: {
    color: tokens.color.warning1TextLight,
    background: tokens.color.warning1ContrastTextLight,
  },
  dark_badge_warning_variant1: {
    color: tokens.color.warning1ContrastTextDark,
    background: tokens.color.warningDarkDark,
  },
  light_badge_warning_variant2: {
    color: tokens.color.warning1TextLight,
    background: tokens.color.warning1ContrastTextLight,
  },
  dark_badge_warning_variant2: {
    color: tokens.color.warning1MainDark,
    background: tokens.color.warning1ContrastTextDark,
  },
  dark_badge_background: {
    color: tokens.color.textPrimaryDark,
    background: tokens.color.backgroundSecondaryDark,
  },
  light_badge_background: {
    color: tokens.color.textPrimaryLight,
    background: tokens.color.backgroundSecondaryLight,
    borderColor: tokens.color.logoBackgroundLight,
  },
  light_badge_error: {
    color: tokens.color.errorMainLight,
    background: tokens.color.errorBackgroundLight,
  },
  dark_badge_error: {
    color: tokens.color.errorMainDark,
    background: tokens.color.errorDarkDark,
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
