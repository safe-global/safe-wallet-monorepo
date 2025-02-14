import SingleAccountItem from '@/features/myAccounts/components/AccountItems/SingleAccountItem'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import { useDarkMode } from '@/hooks/useDarkMode'
import SafenetDarkLogo from '@/public/images/safenet/logo-safenet-dark-gradient.svg'
import SafenetLogo from '@/public/images/safenet/logo-safenet.svg'
import { Box } from '@mui/material'
import css from './styles.module.css'

const SafenetAccountList = ({ safenetSafes, onLinkClick }: { safenetSafes: SafeItem[]; onLinkClick?: () => void }) => {
  const isDarkMode = useDarkMode()

  return safenetSafes.length > 0 ? (
    <Box className={css.safenetList}>
      <Box className={css.safenetListHeader}>
        {isDarkMode ? <SafenetLogo height="12" /> : <SafenetDarkLogo height="12" />}
      </Box>
      {safenetSafes.map((safeItem) => (
        <SingleAccountItem
          onLinkClick={onLinkClick}
          safeItem={safeItem}
          key={`${safeItem.chainId}:${safeItem.address}`}
          isMultiChainItem
          isSafenetItem
        />
      ))}
    </Box>
  ) : undefined
}

export default SafenetAccountList
