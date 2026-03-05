import type { ReactElement, ReactNode } from 'react'
import styled from '@emotion/styled'
import NextLink from 'next/link'
import type { LinkProps } from 'next/link'
import { Card as MuiCard, Link, Stack, Typography } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

export const WidgetContainer = styled.section`
  display: flex;
  flex-direction: column;
  height: 100%;
`

export const WidgetBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
`

export const Card = styled.div`
  background: var(--color-background-paper);
  padding: var(--space-3);
  border-radius: 6px;
  flex-grow: 1;
  position: relative;
  box-sizing: border-box;
  height: 100%;
  overflow: hidden;

  & h2 {
    margin-top: 0;
  }
`

export const ViewAllLink = ({ url, text }: { url: LinkProps['href']; text?: string }): ReactElement => (
  <NextLink href={url} passHref legacyBehavior>
    <Link
      data-testid="view-all-link"
      sx={{
        textDecoration: 'none',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        color: 'primary.light',
        fontSize: '14px',
        marginRight: '-4px', // Make up for 4px space at ChevronIcon
        '&:hover': { color: 'primary.main' },
      }}
    >
      {text || 'View all'} <ChevronRightIcon fontSize="small" />
    </Link>
  </NextLink>
)

export const WidgetCard = ({
  title,
  titleExtra,
  viewAllUrl,
  viewAllText,
  viewAllWrapper,
  children,
  testId,
}: {
  title: string
  titleExtra?: ReactNode
  viewAllUrl?: LinkProps['href']
  viewAllText?: string
  viewAllWrapper?: (children: ReactElement) => ReactElement
  children: ReactNode
  testId?: string
}): ReactElement => {
  const viewAllLink = viewAllUrl ? <ViewAllLink url={viewAllUrl} text={viewAllText} /> : null
  const wrappedViewAllLink = viewAllWrapper && viewAllLink ? viewAllWrapper(viewAllLink) : viewAllLink

  return (
    <MuiCard data-testid={testId} sx={{ border: 0, px: { xs: 3, lg: 1.5 }, pt: 2.5, pb: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ px: 1.5, mb: 1 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography fontWeight={700}>{title}</Typography>
          {titleExtra}
        </Stack>

        {wrappedViewAllLink}
      </Stack>

      {children}
    </MuiCard>
  )
}
