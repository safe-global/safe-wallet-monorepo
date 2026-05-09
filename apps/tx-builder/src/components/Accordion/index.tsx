import { ReactElement } from 'react'
import AccordionMUI, { AccordionProps as AccordionMUIProps } from '@mui/material/Accordion'
import AccordionSummaryMUI, { AccordionSummaryProps as AccordionSummaryMUIProps } from '@mui/material/AccordionSummary'
import styled from 'styled-components'
import FixedIcon from '../FixedIcon'

type AccordionProps = AccordionMUIProps & {
  compact?: boolean
}

type StyledAccordionProps = AccordionMUIProps & {
  $compact?: AccordionProps['compact']
}

const StyledAccordion = styled(AccordionMUI)<StyledAccordionProps>`
  &.MuiAccordion-root {
    border-radius: ${({ $compact }) => ($compact ? '8px' : '0')};
    border: ${({ $compact, theme }) => ($compact ? '2px solid ' + theme.palette.divider : 'none')};
    border-bottom: 2px solid ${({ theme }) => theme.palette.divider};
    margin-bottom: ${({ $compact }) => ($compact ? '16px' : '0')};
    overflow: hidden;

    &:before {
      height: 0;
    }

    &:first-child {
      border-top: 2px solid ${({ theme }) => theme.palette.divider};
    }

    &.Mui-expanded {
      margin: ${({ $compact }) => ($compact ? '0 0 16px 0' : '0')};
    }

    .MuiAccordionDetails-root {
      padding: 16px;
    }
  }
`

const StyledAccordionSummary = styled(AccordionSummaryMUI)`
  &.MuiAccordionSummary-root {
    &.Mui-expanded {
      min-height: 48px;
      border-bottom: 2px solid ${({ theme }) => theme.palette.divider};
      background-color: ${({ theme }) => theme.palette.background.default};
    }

    &:hover {
      background-color: ${({ theme }) => theme.palette.background.default};
    }

    .MuiAccordionSummary-content {
      &.Mui-expanded {
        margin: 0;
      }
    }
    .MuiIconButton-root {
      font-size: 0;
      padding: 16px;
    }
  }
`

export const Accordion = ({ compact, children, ...props }: AccordionProps): ReactElement => {
  return (
    <StyledAccordion square elevation={0} $compact={compact} {...props}>
      {children}
    </StyledAccordion>
  )
}

export const AccordionSummary = ({ children, ...props }: AccordionSummaryMUIProps): ReactElement => {
  return (
    <StyledAccordionSummary expandIcon={<FixedIcon type="chevronDown" />} {...props}>
      {children}
    </StyledAccordionSummary>
  )
}

export { default as AccordionActions } from '@mui/material/AccordionActions'
export { default as AccordionDetails } from '@mui/material/AccordionDetails'
