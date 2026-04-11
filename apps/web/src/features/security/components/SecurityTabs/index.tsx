import { type ReactElement, type SyntheticEvent } from 'react'
import { Tab, Tabs, Typography } from '@mui/material'

const TABS = ['Security overview', 'Account activity'] as const

const tabSx = { textTransform: 'none', opacity: 1, px: 3 } as const
const firstTabSx = { ...tabSx, '&:first-of-type': { pl: 0 } } as const

type SecurityTabsProps = {
  value: number
  onChange: (event: SyntheticEvent, newValue: number) => void
}

const SecurityTabs = ({ value, onChange }: SecurityTabsProps): ReactElement => (
  <Tabs value={value} onChange={onChange} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 3 }}>
    {TABS.map((label, idx) => (
      <Tab
        key={label}
        label={
          <Typography variant="body2" fontWeight={700} color={value === idx ? 'primary' : 'primary.light'}>
            {label}
          </Typography>
        }
        sx={idx === 0 ? firstTabSx : tabSx}
      />
    ))}
  </Tabs>
)

export default SecurityTabs
