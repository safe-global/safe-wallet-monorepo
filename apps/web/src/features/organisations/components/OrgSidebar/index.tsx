import { type ReactElement } from 'react'

import css from './styles.module.css'
import { Drawer } from '@mui/material'

const Sidebar = (): ReactElement => {
  return (
    <Drawer variant="permanent" anchor="left">
      <div className={css.container}></div>
    </Drawer>
  )
}

export default Sidebar
