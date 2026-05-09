import { Tooltip, SvgIcon, Typography, List, ListItem, Box, ListItemAvatar, Avatar, ListItemText } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import type { ReactElement } from 'react'

import NestedSafesIcon from '@/public/images/sidebar/nested-safes-icon.svg'
import NestedSafes from '@/public/images/sidebar/nested-safes.svg'
import InfoIcon from '@/public/images/notifications/info.svg'

export function NestedSafeInfo(): ReactElement {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" pt={1}>
      <NestedSafes />
      <Box display="flex" gap={1} py={2}>
        <Typography fontWeight={700}>No Nested Safes yet</Typography>
        <Tooltip
          title="Nested Safes are separate wallets owned by your main Account, perfect for organizing different funds and projects."
          placement="top"
          arrow
          sx={{ ml: 1 }}
        >
          <span>
            <SvgIcon
              component={InfoIcon}
              inheritViewBox
              fontSize="small"
              color="border"
              sx={{ verticalAlign: 'middle' }}
            />
          </span>
        </Tooltip>
      </Box>
      <Box display="flex" gap={2} alignItems="center" pt={1} pb={4}>
        <Avatar sx={{ padding: '20px', backgroundColor: 'success.background' }}>
          <SvgIcon component={NestedSafesIcon} inheritViewBox color="primary" sx={{ fontSize: 20 }} />
        </Avatar>
        <Typography variant="body2" fontWeight={700}>
          Nested Safes allow you to:
        </Typography>
      </Box>
      <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[
          'rebuild your organizational structure onchain',
          'explore new DeFi opportunities without exposing your main Account',
          'deploy specialized modules and extend Safe functionality',
        ].map((item) => {
          return (
            <ListItem key={item} sx={{ p: 0, pl: 1.5, alignItems: 'unset' }}>
              <ListItemAvatar sx={{ minWidth: 'unset', mr: 3 }}>
                <Avatar sx={{ width: 25, height: 25, backgroundColor: 'success.background' }}>
                  <CheckIcon fontSize="small" color="success" />
                </Avatar>
              </ListItemAvatar>
              <ListItemText sx={{ m: 0 }} primaryTypographyProps={{ variant: 'body2' }}>
                {item}
              </ListItemText>
            </ListItem>
          )
        })}
      </List>
    </Box>
  )
}
