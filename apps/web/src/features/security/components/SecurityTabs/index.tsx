import { type ReactElement, type SyntheticEvent } from 'react'
import { Tab, Tabs } from '@mui/material'

const TABS = ['Security overview', 'Account activity'] as const

type SecurityTabsProps = {
  value: number
  onChange: (event: SyntheticEvent, newValue: number) => void
}

const SecurityTabs = ({ value, onChange }: SecurityTabsProps): ReactElement => (
  <Tabs value={value} onChange={onChange} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 3 }}>
    {TABS.map((label, idx) => (
      <Tab
        key={label}
        label={label}
        sx={{
          textTransform: 'none',
          opacity: 1,
          px: 3,
          fontSize: 'body2.fontSize',
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
