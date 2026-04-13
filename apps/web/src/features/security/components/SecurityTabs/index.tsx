import { type ReactElement, type SyntheticEvent } from 'react'
import { Tab, Tabs } from '@mui/material'

const TABS = ['Security overview', 'Account activity'] as const

type SecurityTabsProps = {
  value: number
  onChange: (event: SyntheticEvent, newValue: number) => void
  compact?: boolean
}

const SecurityTabs = ({ value, onChange, compact }: SecurityTabsProps): ReactElement => (
  <Tabs
    value={value}
    onChange={onChange}
    variant="scrollable"
    allowScrollButtonsMobile
    sx={{ mb: compact ? 2 : 3, minHeight: compact ? 36 : undefined }}
  >
    {TABS.map((label) => (
      <Tab
        key={label}
        label={label}
        sx={{
          textTransform: 'none',
          opacity: 1,
          px: compact ? 1.5 : 3,
          py: compact ? 0.5 : undefined,
          minHeight: compact ? 36 : undefined,
          fontSize: compact ? '0.8rem' : 'body2.fontSize',
          fontWeight: 700,
          color: 'primary.light',
          '&.Mui-selected': { color: 'primary.main' },
          '&:first-of-type': { pl: 0 },
        }}
      />
    ))}
  </Tabs>
)

export default SecurityTabs
