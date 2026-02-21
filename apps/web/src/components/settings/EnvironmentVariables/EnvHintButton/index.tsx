import Link from 'next/link'
import { useRouter } from 'next/router'
import { SvgIcon, IconButton, Tooltip } from '@mui/material'
import { AppRoutes } from '@/config/routes'
import { useAppSelector } from '@/store'
import { isEnvInitialState } from '@/store/settingsSlice'
import css from './styles.module.css'
import AlertIcon from '@/public/images/common/alert.svg'
import useChainId from '@/hooks/useChainId'

const EnvHintButton = () => {
  const router = useRouter()
  const chainId = useChainId()
  const isInitialState = useAppSelector((state) => isEnvInitialState(state, chainId))

  if (isInitialState) {
    return null
  }

  return (
    <Link href={{ pathname: AppRoutes.settings.environmentVariables, query: router.query }} passHref legacyBehavior>
      <Tooltip title="Default environment has been changed" placement="top" arrow>
        <IconButton className={css.button} size="small" color="warning" disableRipple>
          <SvgIcon component={AlertIcon} inheritViewBox fontSize="small" />
        </IconButton>
      </Tooltip>
    </Link>
  )
}

export default EnvHintButton
