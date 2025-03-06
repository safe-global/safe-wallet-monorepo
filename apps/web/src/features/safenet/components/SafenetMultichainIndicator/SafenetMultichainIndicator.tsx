import ChainIndicator from '@/components/common/ChainIndicator'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import { useDarkMode } from '@/hooks/useDarkMode'
import SafenetDarkLogo from '@/public/images/safenet/logo-safenet-dark-gradient.svg'
import SafenetLightLogo from '@/public/images/safenet/logo-safenet-light-gradient.svg'
import { Box, Divider } from '@mui/material'
import css from './styles.module.css'

const SafenetMultichainIndicator = ({ safenetSafes }: { safenetSafes: SafeItem[] }) => {
  const isDarkMode = useDarkMode()

  return safenetSafes.length > 0 ? (
    <Box className={css.safenetTooltip}>
      <Divider className={css.divider} />
      <Box className={css.safenetLogo}>
        {isDarkMode ? <SafenetDarkLogo height="12" /> : <SafenetLightLogo height="12" />}
      </Box>
      {safenetSafes.map((safeItem) => (
        <Box key={safeItem.chainId} sx={{ p: '4px 0px' }}>
          <ChainIndicator chainId={safeItem.chainId} />
        </Box>
      ))}
    </Box>
  ) : undefined
}

export default SafenetMultichainIndicator
