import React from 'react'
import { Typography } from '@mui/material'
import css from './styles.module.css'
import WelcomeLogin from './WelcomeLogin'
import SafeLabsLogo from '@/public/images/logo-safe-labs.svg'
import WelcomeFooter from './WelcomeFooter'

const NewSafe = () => {
  return (
    <div className={css.loginPage}>
      <div className={css.leftSide}>
        <div className={css.logoContainer}>
          <SafeLabsLogo className={css.logo} />
        </div>
        <div className={css.loginContainer}>
          <WelcomeLogin />
        </div>
        <WelcomeFooter />
      </div>

      <div className={css.mockupBackground}>
        <div className={css.rightContent}>
          <div className={css.heroContent}>
            <Typography className={css.label}>FOR TEAMS AND POWER USERS</Typography>
            <Typography className={css.mainTitle}>Manage and secure treasury and developer on-chain assets</Typography>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewSafe
