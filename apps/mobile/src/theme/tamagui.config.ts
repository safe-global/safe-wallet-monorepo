import { createTamagui } from 'tamagui'
import { createDmSansFont } from '@tamagui/font-dm-sans'
import { badgeTheme } from '@/src/components/Badge/theme'
import { badgeTheme as NetworkBadgeTheme } from '@/src/components/NetworkBadge/theme'
import { navbarTheme } from '@/src/features/Assets/components/Navbar/theme'
import { fontSizes, tokens } from '@/src/theme/tokens'
import { createAnimations } from '@tamagui/animations-moti'
import { inputTheme, inputWithLabelTheme } from '../components/SafeInput/theme'
import { safeTabTheme } from '@/src/components/SafeTab/theme'
import { SafeListItemTheme } from '@/src/components/SafeListItem/theme'

const DmSansFont = createDmSansFont({
  face: {
    500: { normal: 'DMSans-Medium', italic: 'DMSans-MediumItalic' },
    600: { normal: 'DMSans-SemiBold', italic: 'DMSans-SemiBoldItalic' },
    700: { normal: 'DMSans-Bold', italic: 'DMSans-BoldItalic' },
  },
  size: fontSizes,
})
export const config = createTamagui({
  fonts: {
    body: DmSansFont,
    heading: DmSansFont,
    button: DmSansFont,
  },
  themes: {
    light: {
      background: tokens.color.backgroundDefaultLight,
      backgroundSecondary: tokens.color.backgroundSecondaryLight,
      backgroundPaper: tokens.color.backgroundPaperLight,
      backgroundHover: tokens.color.backgroundLightLight,
      backgroundPress: tokens.color.primaryLightLight,
      backgroundFocus: tokens.color.backgroundMainLight,
      backgroundStrong: tokens.color.primaryDarkLight,
      backgroundDisabled: tokens.color.backgroundDisabledLight,
      backgroundSuccess: tokens.color.successBackgroundLight,
      backgroundWarning: tokens.color.warningBackgroundLight,
      backgroundError: tokens.color.errorBackgroundLight,
      backgroundTransparent: 'transparent',
      backgroundSkeleton: tokens.color.backgroundSkeletonLight,
      color: tokens.color.textPrimaryLight,
      primary: tokens.color.primaryMainLight,
      colorHover: tokens.color.textSecondaryLight,
      colorSecondary: tokens.color.textSecondaryLight,
      colorLight: tokens.color.primaryLightLight,
      colorContrast: tokens.color.textContrastLight,
      colorOutline: tokens.color.textSecondaryLight,
      borderLight: tokens.color.borderLightLight,
      error: tokens.color.errorMainLight,
      success: tokens.color.successMainLight,
      warning: tokens.color.warningMainLight,
      errorDark: tokens.color.errorDarkDark,
      errorLight: tokens.color.errorLightLight,
      errorBackground: tokens.color.errorBackgroundLight,
      contrast: tokens.color.textContrastLight,
    },
    light_label: {
      color: tokens.color.textSecondaryLight,
    },
    dark_label: {
      color: tokens.color.textSecondaryDark,
    },
    light_info: {
      background: tokens.color.infoBackgroundLight,
      color: tokens.color.infoMainLight,
    },
    dark_info: {
      background: tokens.color.infoBackgroundDark,
      color: tokens.color.infoMainDark,
    },
    ...badgeTheme,
    ...inputTheme,
    ...NetworkBadgeTheme,
    ...navbarTheme,
    ...safeTabTheme,
    ...inputWithLabelTheme,
    light_success: {
      background: tokens.color.successBackgroundLight,
      color: tokens.color.successMainLight,
      badgeBackground: tokens.color.successDarkLight,
      badgeTextColor: tokens.color.backgroundMainDark,
    },
    dark_success: {
      background: tokens.color.successBackgroundDark,
      color: tokens.color.successMainDark,
      badgeBackground: tokens.color.successDarkDark,
    },
    dark_success_light: {},
    light_warning: {
      background: tokens.color.warning1MainLight,
      color: tokens.color.warning1TextLight,
    },
    dark_warning: {
      background: tokens.color.warning1MainDark,
      color: tokens.color.warning1TextDark,
    },
    light_error: {
      background: tokens.color.error1MainLight,
      color: tokens.color.error1ContrastTextLight,
    },
    dark_error: {
      background: tokens.color.error1MainDark,
      color: tokens.color.error1ContrastTextDark,
    },
    light_logo: {
      background: tokens.color.logoBackgroundLight,
    },
    dark_logo: {
      background: tokens.color.logoBackgroundDark,
    },
    light_container: {
      background: tokens.color.backgroundDefaultLight,
    },
    dark_container: {
      background: tokens.color.backgroundPaperDark,
    },
    light_settings: {
      background: tokens.color.backgroundDefaultLight,
    },
    dark_settings: {
      background: tokens.color.backgroundPaperDark,
    },
    ...SafeListItemTheme,
    dark: {
      background: tokens.color.backgroundDefaultDark,
      backgroundSecondary: tokens.color.backgroundSecondaryDark,
      backgroundPaper: tokens.color.backgroundPaperDark,
      backgroundHover: tokens.color.backgroundLightDark,
      backgroundPress: tokens.color.primaryLightDark,
      backgroundFocus: tokens.color.backgroundMainDark,
      backgroundStrong: tokens.color.primaryDarkDark,
      backgroundTransparent: 'transparent',
      backgroundDisabled: tokens.color.backgroundDisabledDark,
      backgroundSkeleton: tokens.color.backgroundSkeletonDark,
      backgroundSuccess: tokens.color.successBackgroundDark,
      backgroundWarning: tokens.color.warningBackgroundDark,
      backgroundError: tokens.color.errorBackgroundDark,
      color: tokens.color.textPrimaryDark,
      colorLight: tokens.color.primaryLightDark,
      colorOutline: tokens.color.primaryLightDark,
      primary: tokens.color.primaryMainDark,
      borderLight: tokens.color.borderLightDark,
      colorHover: tokens.color.textSecondaryDark,
      colorSecondary: tokens.color.primaryLightDark,
      error: tokens.color.errorMainDark,
      errorDark: tokens.color.errorDarkDark,
      errorLight: tokens.color.errorLightDark,
      errorBackground: tokens.color.errorBackgroundDark,
      success: tokens.color.successMainLight,
      warning: tokens.color.warningMainDark,
      contrast: tokens.color.textContrastDark,
    },
  },
  tokens,
  animations: createAnimations({
    fast: {
      type: 'spring',
      damping: 20,
      mass: 1.2,
      stiffness: 250,
    },
    medium: {
      type: 'spring',
      damping: 10,
      mass: 0.9,
      stiffness: 100,
    },
    slow: {
      type: 'spring',
      damping: 20,
      stiffness: 60,
    },
    '100ms': {
      type: 'timing',
      duration: 100,
    },
    '200ms': {
      type: 'timing',
      duration: 200,
    },
    bouncy: {
      type: 'spring',
      damping: 10,
      mass: 0.9,
      stiffness: 100,
    },
    lazy: {
      type: 'spring',
      damping: 20,
      stiffness: 60,
    },
    quick: {
      type: 'spring',
      damping: 20,
      mass: 1.2,
      stiffness: 250,
    },
    tooltip: {
      damping: 10,
      mass: 0.9,
      stiffness: 100,
    },
  }),
})

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {
    tokens: typeof tokens
  }
}

export default config
