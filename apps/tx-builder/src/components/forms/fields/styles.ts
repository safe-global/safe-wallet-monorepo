import { TextFieldProps } from '@mui/material'
import { css } from 'styled-components'

export const inputLabelStyles = css<TextFieldProps>`
  &:hover {
    .MuiInputLabel-root {
      &.MuiInputLabel-shrink:not(.Mui-focused):not(.Mui-disabled) {
        &.Mui-error {
          color: ${({ theme }) => theme.palette.error.main};
        }
      }
    }
  }

  .MuiInputLabel-root {
    font-family: ${({ theme }) => theme.typography.fontFamily};
    color: ${({ theme }) => theme.palette.text.secondary};
    font-weight: 300;
    font-size: 16px;

    &.MuiInputLabel-shrink {
      color: ${({ theme }) => theme.palette.border.main};

      &.Mui-error {
        color: ${({ theme }) => theme.palette.error.main};
      }
    }
    &.Mui-disabled {
      color: #dadada;
    }

    /* Hide Label */
    ${({ hiddenLabel }) =>
      hiddenLabel
        ? `border: 0;
            border: 1px solid red;    
            clip: rect(0 0 0 0);
            height: 1px;
            margin: -1px;
            overflow: hidden;
            padding: 0;
            position: absolute;
            width: 1px;`
        : ''}
  }
`

export const inputStyles = css<TextFieldProps>`
  .MuiOutlinedInput-input:-webkit-autofill {
    -webkit-text-fill-color: ${({ theme }) => theme.palette.text.primary};
    /* needs to use important because we have important styles being injected in this component */
    box-shadow: inset 0 0 0 100px ${({ theme }) => theme.palette.background.paper} !important;
  }

  .MuiSvgIcon-root {
    color: ${({ theme }) => theme.palette.text.primary};
  }

  .MuiOutlinedInput-root {
    font-family: ${({ theme }) => theme.typography.fontFamily};
    color: ${({ theme }) => theme.palette.text.primary};
    /* Input */
    .MuiOutlinedInput-input {
      &::placeholder,
      &.Mui-disabled {
        cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'auto')};
        color: #b2bbc0;
      }
    }

    /* fieldset */
    .MuiOutlinedInput-notchedOutline {
      ${({ hiddenLabel }) => (hiddenLabel ? 'top: 0' : '')};
      transition: border-color 0.2s ease-in-out;
      border: 1px solid ${({ theme, value }) => (value ? theme.palette.border.main : theme.palette.border.light)};
      border-radius: 6px;
      legend {
        display: ${({ hiddenLabel }) => (hiddenLabel ? 'none' : 'block')};
      }
    }

    &:hover {
      .MuiOutlinedInput-notchedOutline {
        border-color: ${({ theme }) => theme.palette.border.light};
      }
    }

    &.Mui-focused {
      .MuiOutlinedInput-notchedOutline {
        border-color: ${({ theme }) => theme.palette.border.light};
      }
      &.Mui-error {
        .MuiOutlinedInput-notchedOutline {
          border-color: ${({ theme }) => theme.palette.error.main};
        }
      }
    }
    &.Mui-disabled {
      .MuiOutlinedInput-notchedOutline {
        border-color: #dadada;
      }
    }
  }
  .MuiFormLabel-filled + .MuiOutlinedInput-root:not(:hover):not(.Mui-disabled) .MuiOutlinedInput-notchedOutline {
    border-color: ${({ theme, error }) => (error ? theme.palette.error.main : theme.palette.border.light)};
  }
`

export const errorStyles = css<TextFieldProps>`
  .Mui-error {
    &:hover,
    .Mui-focused {
      .MuiOutlinedInput-notchedOutline {
        border-color: ${({ theme }) => theme.palette.error.main};
      }
    }
    .MuiOutlinedInput-notchedOutline {
      border-color: ${({ theme }) => theme.palette.error.main};
    }
  }
`
