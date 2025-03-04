import { tokens } from '@/src/theme/tokens'

export const inputTheme = {
  light_input_default: {
    borderColor: tokens.color.borderLightLight,
    textColor: tokens.color.textPrimaryLight,
    placeholderColor: tokens.color.textSecondaryLight,
    inputTextColor: tokens.color.textPrimaryLight,
    inputBackgroundColor: tokens.color.backgroundDefaultLight,
    containerBackgroundColor: tokens.color.backgroundDefaultLight,
  },
  dark_input_default: {
    borderColor: tokens.color.borderLightDark,
    textColor: tokens.color.textPrimaryDark,
    placeholderColor: tokens.color.textSecondaryDark,
    inputTextColor: tokens.color.textPrimaryDark,
    inputBackgroundColor: tokens.color.backgroundPaperDark,
    containerBackgroundColor: tokens.color.backgroundPaperDark,
  },
  light_input_success: {
    borderColor: tokens.color.primaryMainDark,
    textColor: tokens.color.textPrimaryLight,
    placeholderColor: tokens.color.textSecondaryLight,
    inputTextColor: tokens.color.textPrimaryLight,
    inputBackgroundColor: tokens.color.backgroundDefaultLight,
    containerBackgroundColor: tokens.color.backgroundDefaultLight,
  },
  dark_input_success: {
    borderColor: tokens.color.primaryMainDark,
    textColor: tokens.color.textPrimaryDark,
    placeholderColor: tokens.color.textSecondaryDark,
    inputTextColor: tokens.color.textPrimaryDark,
    inputBackgroundColor: tokens.color.backgroundPaperDark,
    containerBackgroundColor: tokens.color.backgroundPaperDark,
  },
  light_input_error: {
    borderColor: tokens.color.errorMainLight,
    textColor: tokens.color.errorMainLight,
    placeholderColor: tokens.color.errorMainLight,
    inputTextColor: tokens.color.textPrimaryLight,
    inputBackgroundColor: tokens.color.backgroundDefaultLight,
    containerBackgroundColor: tokens.color.backgroundDefaultLight,
  },
  dark_input_error: {
    borderColor: tokens.color.errorMainDark,
    textColor: tokens.color.errorMainDark,
    placeholderColor: tokens.color.errorMainDark,
    inputTextColor: tokens.color.textPrimaryDark,
    inputBackgroundColor: tokens.color.backgroundPaperDark,
    containerBackgroundColor: tokens.color.backgroundPaperDark,
  },
}
