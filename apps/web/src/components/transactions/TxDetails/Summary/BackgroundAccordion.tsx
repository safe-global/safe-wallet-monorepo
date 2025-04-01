import { Accordion, accordionClasses, accordionSummaryClasses, styled } from '@mui/material'

export const BackgroundAccordion = styled(Accordion)(() => {
  return {
    [`&.${accordionClasses.root}`]: {
      borderColor: 'var(--color-background-main)',
    },
    [`&:hover.${accordionClasses.root}`]: {
      borderColor: 'var(--color-border-light)',
    },
    [`&.${accordionClasses.expanded}.${accordionClasses.root}, &.${accordionClasses.expanded} .${accordionSummaryClasses.root}`]:
      {
        backgroundColor: 'var(--color-background-main)',
      },
  }
})
