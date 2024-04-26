import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { List, ListItem, ListItemIcon, Typography } from '@mui/material'

import css from './styles.module.css'

const PayNowPayLater = () => {
  return (
    <>
      <Typography variant="h4" fontWeight="bold">
        Before you continue
      </Typography>
      <List>
        <ListItem disableGutters>
          <ListItemIcon className={css.listItem}>
            <CheckRoundedIcon fontSize="small" color="inherit" />
          </ListItemIcon>
          <Typography variant="body2">
            There will be a one-time network fee to activate your Superchain account.
          </Typography>
        </ListItem>
        <ListItem disableGutters>
          <ListItemIcon className={css.listItem}>
            <CheckRoundedIcon fontSize="small" color="inherit" />
          </ListItemIcon>
          <Typography variant="body2">Superchain Eco doesn&apost profit from the fees.</Typography>
        </ListItem>
      </List>
    </>
  )
}

export default PayNowPayLater
