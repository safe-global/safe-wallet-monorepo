import type { ReactElement } from 'react'
import styled from '@emotion/styled'
import NextLink from 'next/link'
import type { LinkProps } from 'next/link'
import { Link } from '@mui/material'
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
        '&:hover': { color: 'primary.main' },
      }}
    >
      {text || 'View all'} <ChevronRightIcon fontSize="small" />
    </Link>
  </NextLink>
)
