import type { Theme, PaletteMode } from '@mui/material'
import { alpha } from '@mui/material'
import type { Shadows } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'

import palette from './lightPalette'
import darkPalette from './darkPalette'
import typography from './typography'

export const base = 8

declare module '@mui/material/styles' {
  // Custom color palettes
  export interface Palette {
    border: Palette['primary']
    logo: Palette['primary']
    backdrop: Palette['primary']
    static: Palette['primary']
  }

  export interface PaletteOptions {
    border: PaletteOptions['primary']
    logo: PaletteOptions['primary']
    backdrop: PaletteOptions['primary']
    static: PaletteOptions['primary']
  }

  export interface TypeBackground {
    main: string
    light: string
    lightGrey: string
  }

  // Custom color properties
  export interface PaletteColor {
    background?: string
  }

  export interface SimplePaletteColorOptions {
    background?: string
  }
}

declare module '@mui/material/SvgIcon' {
  export interface SvgIconPropsColorOverrides {
    border: unknown
  }
}

declare module '@mui/material/Button' {
  export interface ButtonPropsSizeOverrides {
    stretched: true
    compact: true
  }

  export interface ButtonPropsColorOverrides {
    background: true
    static: true
    'background.paper': true
  }

  export interface ButtonPropsVariantOverrides {
    danger: true
  }
}

declare module '@mui/material/IconButton' {
  export interface IconButtonPropsColorOverrides {
    border: true
  }
}

const createSafeTheme = (mode: PaletteMode): Theme => {
  const isDarkMode = mode === 'dark'
  const colors = isDarkMode ? darkPalette : palette
  const shadowColor = colors.primary.light

  return createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      ...colors,
    },
    spacing: base,
    shape: {
      borderRadius: 6,
    },
    shadows: [
      'none',
      isDarkMode ? `0 0 2px ${shadowColor}` : `0 1px 4px ${shadowColor}0a, 0 4px 10px ${shadowColor}14`,
      isDarkMode ? `0 0 2px ${shadowColor}` : `0 1px 4px ${shadowColor}0a, 0 4px 10px ${shadowColor}14`,
      isDarkMode ? `0 0 2px ${shadowColor}` : `0 2px 20px ${shadowColor}0a, 0 8px 32px ${shadowColor}14`,
      isDarkMode ? `0 0 2px ${shadowColor}` : `0 8px 32px ${shadowColor}0a, 0 24px 60px ${shadowColor}14`,
      ...Array(20).fill('none'),
    ] as Shadows,
    typography,
    components: {
      MuiTableCell: {
        styleOverrides: {
          head: ({ theme }) => ({
            ...theme.typography.body1,
            color: theme.palette.primary.light,
          }),
        },
      },
      MuiButton: {
        variants: [
          {
            props: { size: 'compact' },
            style: {
              padding: '8px 16px',
            },
          },
          {
            props: { size: 'stretched' },
            style: {
              padding: '12px 48px',
            },
          },
          {
            props: { color: 'background.paper' },
            style: ({ theme }) => ({
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              '&:hover': {
                backgroundColor: theme.palette.background.main,
              },
            }),
          },

          {
            props: { color: 'background' },
            style: ({ theme }) => ({
              backgroundColor: theme.palette.background.main,
              color: theme.palette.text.primary,
              '&:hover': {
                backgroundColor: theme.palette.background.lightGrey,
              },
            }),
          },
          {
            props: { variant: 'danger' },
            style: ({ theme }) => ({
              backgroundColor: theme.palette.error.background,
              color: theme.palette.error.main,
              '&:hover': {
                color: theme.palette.error.dark,
                backgroundColor: theme.palette.error.light,
              },
            }),
          },
        ],
        styleOverrides: {
          sizeSmall: {
            fontSize: '14px',
            padding: '8px 24px',
          },
          sizeMedium: {
            fontSize: '16px',
            padding: '12px 24px',
          },
          root: ({ theme }) => ({
            borderRadius: theme.shape.borderRadius,
            fontWeight: 'bold',
            lineHeight: 1.25,
            borderColor: theme.palette.primary.main,
            textTransform: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          }),
          outlined: {
            border: '2px solid',
            '&:hover': {
              border: '2px solid',
            },
          },
          sizeLarge: { fontSize: '16px' },
        },
      },
      MuiAccordion: {
        variants: [
          {
            props: { variant: 'elevation' },
            style: ({ theme }) => ({
              border: 'none',
              boxShadow: '0',
              '&:not(:last-of-type)': {
                borderRadius: '0 !important',
                borderBottom: `1px solid ${theme.palette.border.light}`,
              },
              '&:last-of-type': {
                borderBottomLeftRadius: '8px',
              },
            }),
          },
        ],
        styleOverrides: {
          root: ({ theme }) => ({
            transition: 'background 0.2s, border 0.2s',
            borderRadius: theme.shape.borderRadius,
            border: `1px solid ${theme.palette.border.light}`,
            overflow: 'hidden',

            '&::before': {
              content: 'none',
            },

            '&:hover': {
              borderColor: theme.palette.secondary.light,
            },

            '&:hover > .MuiAccordionSummary-root': {
              background: theme.palette.background.light,
            },

            '&.Mui-expanded': {
              margin: 0,
              borderColor: theme.palette.secondary.light,
            },
          }),
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: ({ theme }) => ({
            '&.Mui-expanded': {
              minHeight: '48px',
              background: theme.palette.background.light,
            },
          }),
          content: {
            '&.Mui-expanded': {
              margin: '12px 0',
            },
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: ({ theme }) => ({
            padding: theme.spacing(2),
          }),
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: theme.shape.borderRadius,
            boxSizing: 'border-box',
            border: '2px solid transparent',
            boxShadow: 'none',
          }),
        },
      },
      MuiDialog: {
        defaultProps: {
          fullWidth: true,
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: ({ theme }) => ({
            padding: theme.spacing(3),
          }),
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderColor: theme.palette.border.light,
          }),
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          outlined: ({ theme }) => ({
            borderWidth: 2,
            borderColor: theme.palette.border.light,
          }),
          root: ({ theme }) => ({
            borderRadius: theme.shape.borderRadius,
            backgroundImage: 'none',
          }),
        },
      },
      MuiPopover: {
        defaultProps: {
          elevation: 2,
        },
        styleOverrides: {
          paper: {
            overflow: 'visible',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          sizeSmall: {
            padding: '4px',
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          colorSuccess: ({ theme }) => ({
            backgroundColor: theme.palette.secondary.light,
            height: '24px',
          }),
        },
      },
      MuiAlert: {
        styleOverrides: {
          standardError: ({ theme }) => ({
            '& .MuiAlert-icon': {
              color: theme.palette.error.main,
            },
            '&.MuiPaper-root': {
              backgroundColor: theme.palette.error.background,
            },
          }),
          standardInfo: ({ theme }) => ({
            '& .MuiAlert-icon': {
              color: theme.palette.info.main,
            },
            '&.MuiPaper-root': {
              backgroundColor: theme.palette.info.background,
            },
          }),
          standardSuccess: ({ theme }) => ({
            '& .MuiAlert-icon': {
              color: theme.palette.success.main,
            },
            '&.MuiPaper-root': {
              backgroundColor: theme.palette.success.background,
            },
          }),
          standardWarning: ({ theme }) => ({
            '& .MuiAlert-icon': {
              color: theme.palette.warning.main,
            },
            '&.MuiPaper-root': {
              backgroundColor: theme.palette.warning.background,
            },
          }),
          root: ({ theme }) => ({
            color: theme.palette.text.primary,
            padding: '12px 16px',
          }),
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: ({ theme }) => ({
            '& .MuiTableCell-root': {
              borderBottom: `1px solid ${theme.palette.border.light}`,
            },

            [theme.breakpoints.down('sm')]: {
              '& .MuiTableCell-root:first-of-type': {
                paddingRight: theme.spacing(1),
              },

              '& .MuiTableCell-root:not(:first-of-type):not(:last-of-type)': {
                paddingLeft: theme.spacing(1),
                paddingRight: theme.spacing(1),
              },

              '& .MuiTableCell-root:last-of-type': {
                paddingLeft: theme.spacing(1),
              },
            },
          }),
        },
      },
      MuiTableBody: {
        styleOverrides: {
          root: ({ theme }) => ({
            '& .MuiTableCell-root': {
              paddingTop: theme.spacing(1),
              paddingBottom: theme.spacing(1),
              borderBottom: 'none',
            },

            [theme.breakpoints.down('sm')]: {
              '& .MuiTableCell-root:first-of-type': {
                paddingRight: theme.spacing(1),
              },

              '& .MuiTableCell-root:not(:first-of-type):not(:last-of-type)': {
                paddingLeft: theme.spacing(1),
                paddingRight: theme.spacing(1),
              },

              '& .MuiTableCell-root:last-of-type': {
                paddingLeft: theme.spacing(1),
              },
            },

            '& .MuiTableRow-root': {
              transition: 'background-color 0.2s',
              '&:not(:last-of-type)': {
                borderBottom: `1px solid ${theme.palette.border.light}`,
              },
            },

            '& .MuiTableRow-root:hover': {
              backgroundColor: theme.palette.background.light,
            },
            '& .MuiTableRow-root.Mui-selected': {
              backgroundColor: theme.palette.background.light,
            },
          }),
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.primary.main,
          }),
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: ({ theme }) => ({
            borderColor: theme.palette.border.main,
          }),
          root: ({ theme }) => ({
            borderColor: theme.palette.border.main,
          }),
        },
      },
      MuiSvgIcon: {
        styleOverrides: {
          fontSizeSmall: {
            width: '1rem',
            height: '1rem',
          },
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 4,
            backgroundColor: theme.palette.background.paper,
            border: '1px solid transparent',
            transition: 'border-color 0.2s',

            '&:hover, &:focus, &.Mui-focused': {
              backgroundColor: theme.palette.background.paper,
              borderColor: theme.palette.primary.main,
            },
          }),
        },
      },
      MuiSelect: {
        defaultProps: {
          MenuProps: {
            sx: {
              '& .MuiPaper-root': {
                overflow: 'auto',
              },
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: ({ theme }) => ({
            ...theme.typography.body2,
            color: theme.palette.background.main,
            backgroundColor: theme.palette.text.primary,
            '& .MuiLink-root': {
              color: isDarkMode ? theme.palette.background.main : theme.palette.secondary.main,
              textDecorationColor: isDarkMode ? theme.palette.background.main : theme.palette.secondary.main,
            },
            '& .MuiLink-root:hover': {
              color: isDarkMode ? theme.palette.text.secondary : theme.palette.secondary.light,
            },
          }),
          arrow: ({ theme }) => ({
            color: theme.palette.text.primary,
          }),
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.backdrop.main, 0.75),
          }),
        },
      },
      MuiSwitch: {
        defaultProps: {
          color: isDarkMode ? undefined : 'success',
        },
        styleOverrides: {
          thumb: () => ({
            boxShadow:
              '0px 2px 6px -1px rgba(0, 0, 0, 0.2), 0px 1px 4px rgba(0, 0, 0, 0.14), 0px 1px 4px rgba(0, 0, 0, 0.14)',
          }),
        },
      },
      MuiLink: {
        styleOverrides: {
          root: ({ theme }) => ({
            fontWeight: 700,
            '&:hover': {
              color: theme.palette.primary.light,
            },
          }),
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.border.light,
          }),
        },
      },
    },
  })
}

export default createSafeTheme
