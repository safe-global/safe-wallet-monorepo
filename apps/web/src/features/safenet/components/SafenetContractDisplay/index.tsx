import EthHashInfo from '@/components/common/EthHashInfo'
import { AppRoutes } from '@/config/routes'
import SafenetLogo from '@/public/images/logo-safenet.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import { Box, SvgIcon, Tooltip, Typography } from '@mui/material'
import MuiLink from '@mui/material/Link'
import Link from 'next/link'
import { useRouter } from 'next/router'
import css from './styles.module.css'

const SafenetContractDisplay = ({
  address,
  name,
  chainId,
  message,
}: {
  address: string
  name?: string
  chainId: string
  message?: React.ReactElement
}) => (
  <Box className={css.safenetDisplay}>
    <Box sx={{ minWidth: 0 }}>
      <EthHashInfo shortAddress={false} name={name} address={address} showCopyButton hasExplorer chainId={chainId} />
    </Box>
    <Box className={css.tags}>
      <Box className={css.tag}>
        <SafenetLogo height="12" />
      </Box>
      {message && (
        <Tooltip title={message} placement="top" arrow>
          <SvgIcon component={InfoIcon} inheritViewBox sx={({ palette }) => ({ color: palette.text.secondary })} />
        </Tooltip>
      )}
    </Box>
  </Box>
)

export const SafenetModuleDisplay = ({
  address,
  name,
  chainId,
  showTooltip,
}: {
  address: string
  name?: string
  chainId: string
  showTooltip?: boolean
}) => {
  const router = useRouter()

  const message = showTooltip ? (
    <Typography variant="body2">
      To disable the Module, you must go to{' '}
      <Link href={{ pathname: AppRoutes.settings.setup, query: { safe: router.query.safe } }} passHref legacyBehavior>
        <MuiLink>Safenet Settings</MuiLink>
      </Link>{' '}
      and disable Safenet.
    </Typography>
  ) : undefined

  return <SafenetContractDisplay address={address} name={name} chainId={chainId} message={message} />
}

export const SafenetGuardDisplay = ({
  address,
  name,
  chainId,
  showTooltip,
}: {
  address: string
  name?: string
  chainId: string
  showTooltip?: boolean
}) => {
  const router = useRouter()

  const message = showTooltip ? (
    <Typography variant="body2">
      To disable the Guard, you must go to{' '}
      <Link href={{ pathname: AppRoutes.settings.setup, query: { safe: router.query.safe } }} passHref legacyBehavior>
        <MuiLink>Safenet Settings</MuiLink>
      </Link>{' '}
      and disable Safenet.
    </Typography>
  ) : undefined

  return <SafenetContractDisplay address={address} name={name} chainId={chainId} message={message} />
}
