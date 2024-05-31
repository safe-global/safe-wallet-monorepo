import { useMemo, type ReactElement } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import { Box, Button, Grid, MenuItem, Select, SvgIcon } from '@mui/material'
import { makeStyles } from '@mui/styles'
import css from './styles.module.css'
import classNames from 'classnames'
import NounsAvatar from '@/components/common/NounsAvatar'
import CopyButton from '@/components/common/CopyButton'
import ExplorerButton from '@/components/common/ExplorerButton'
import Image from 'next/image'
import OETH from '@/public/images/currencies/ethereum.svg'
import lightPalette from '@/components/theme/lightPalette'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'
const useStyles = makeStyles({
  select: {
    color: 'white',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: lightPalette.primary.main,
    '&:before': {
      borderColor: lightPalette.primary.main,
    },
    '&:after': {
      borderColor: lightPalette.primary.main,
    },
    '&:not(.Mui-disabled):hover::before': {
      borderColor: lightPalette.primary.main,
    },
  },
  icon: {
    fill: 'white',
  },
  root: {
    color: 'white',
  },
})
const TopUpModal = ({ open, onClose }: { open: boolean; onClose: () => void }): ReactElement => {
  const superChainSmartAccount = useAppSelector(selectSuperChainAccount)
  const nounSeed = useMemo(() => {
    return {
      background: Number(superChainSmartAccount.data.noun[0]),
      body: Number(superChainSmartAccount.data.noun[1]),
      accessory: Number(superChainSmartAccount.data.noun[2]),
      head: Number(superChainSmartAccount.data.noun[3]),
      glasses: Number(superChainSmartAccount.data.noun[4]),
    }
  }, [superChainSmartAccount])
  const classes = useStyles()
  return (
    <ModalDialog open={open} hideChainIndicator dialogTitle="Top-up your account" onClose={onClose}>
      <Grid>
        <Grid item>
          <Box display="flex" gap={2} className={classNames(css.container, css.optimismBadge)}>
            <Image
              src="https://safe-transaction-assets.safe.global/chains/10/chain_logo.png"
              alt="Optimism Logo"
              width={24}
              height={24}
              loading="lazy"
            />
            <p>
              <strong>Optimism network</strong>— only send Optimism assets to this Account.
            </p>
          </Box>
        </Grid>
        <Grid item>
          <Box className={classNames(css.container, css.description)}>
            This is the address of your Superchain Account. Deposit funds by topping up or copying the address below.
            Only send OETH and tokens (e.g. ERC20, ERC721) to this address.
          </Box>
        </Grid>
        <Grid item>
          <Box justifyContent="space-between" alignItems="center" display="flex" className={css.container}>
            <Box justifyContent="flex-start" alignItems="center" gap={2} display="flex">
              <Select
                className={classes.select}
                inputProps={{
                  classes: {
                    icon: classes.icon,
                    root: classes.root,
                  },
                }}
                value="OETH"
              >
                <MenuItem value="OETH">
                  <Box pr={1} display="flex" gap={1}>
                    <SvgIcon component={OETH} />
                    ETH
                  </Box>
                </MenuItem>
              </Select>
              <Button className={css.amountButton} variant="outlined">
                0.02
              </Button>
              <Button className={css.amountButton} variant="outlined">
                0.5
              </Button>
              <Button className={css.amountButton} variant="outlined">
                0.1
              </Button>
              <Button className={css.amountButton} variant="outlined">
                0.2
              </Button>
            </Box>
            <Button className={css.topUpButton} variant="contained" disabled>
              Top up
            </Button>
          </Box>
        </Grid>
        <Grid item>
          {!superChainSmartAccount.loading && (
            <Box display="flex" gap={2} alignItems="center" className={css.container}>
              <div className={css.noun}>
                <NounsAvatar seed={nounSeed} />
              </div>
              <Box>
                <p>{superChainSmartAccount.data.superChainID}</p>
                <Box display="flex" lineHeight={1.2} gap={1}>
                  <p>
                    <strong>oeth:</strong>
                    {superChainSmartAccount.data.smartAccount}
                  </p>
                  <CopyButton text="0xD0be338562D78fAf8B3Sv567a9943bfaab0a3051e" />
                  <Box color="border.main">
                    <ExplorerButton />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>
    </ModalDialog>
  )
}

export default TopUpModal
