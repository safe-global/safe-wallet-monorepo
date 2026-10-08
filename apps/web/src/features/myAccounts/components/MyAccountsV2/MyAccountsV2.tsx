import { useState } from 'react'
import AccountsNavigation from '../AccountsNavigation'
import AccountsList from './components/AccountsList'
import AccountsSearch from './components/AccountsSearch'
import GetStartedCard from './components/GetStartedCard'
import TrustedAccountsActions from './components/TrustedAccountsActions'
import SafeListSortToggle from '@/components/common/SafeListSortToggle'
import AddTrustedSafesCard from '@/components/common/AddTrustedSafesCard'
import { useDarkMode } from '@/hooks/useDarkMode'
import madProps from '@/utils/mad-props'
import useWallet from '@/hooks/wallets/useWallet'
import { type AllSafeItemsGrouped, useAllSafesGrouped } from '@/hooks/safes'
import useTrackSafesCount from '../../hooks/useTrackedSafesCount'
import useMigrationPrompt from '../../hooks/useMigrationPrompt'
import useTrustedSafesModal from '@/components/common/TrustedSafesModal/useTrustedSafesModal'
import TrustedSafesModal from '@/components/common/TrustedSafesModal'
import WelcomeContentCard from '@/components/common/WelcomeContentCard'
import { DataWidget } from '../DataWidget'
import { useLoadFeature } from '@/features/__core__'
import { SafeProFeature, useIsSafeProAnnouncementEnabled } from '@/features/safe-pro-announcement'
import { MyAccountsV2View } from '@views/features/myAccounts/components/MyAccountsV2/MyAccountsV2View'

type MyAccountsProps = {
  safes: AllSafeItemsGrouped
  onLinkClick?: () => void
}

const MyAccountsV2 = ({ safes, onLinkClick }: MyAccountsProps) => {
  const wallet = useWallet()
  const isDarkMode = useDarkMode()
  const { SafeProBanner, SafeProWorkspacesBanner } = useLoadFeature(SafeProFeature)
  const isSafeProAnnouncementEnabled = useIsSafeProAnnouncementEnabled()
  const [searchQuery, setSearchQuery] = useState('')
  const modal = useTrustedSafesModal()
  const migration = useMigrationPrompt()
  useTrackSafesCount(safes, wallet)

  const showGetStarted = !wallet && !migration.hasPinnedSafes
  const showEmptyState = !showGetStarted && !migration.isLoading && !migration.hasPinnedSafes
  const showList = !showGetStarted && !showEmptyState

  return (
    <MyAccountsV2View
      isDarkMode={isDarkMode}
      isSafeProAnnouncementEnabled={isSafeProAnnouncementEnabled}
      showGetStarted={showGetStarted}
      showEmptyState={showEmptyState}
      showList={showList}
      navigation={<AccountsNavigation />}
      renderSafeProWorkspacesBanner={(props) => <SafeProWorkspacesBanner {...props} />}
      renderSafeProBanner={(props) => <SafeProBanner {...props} />}
      getStartedCard={<GetStartedCard />}
      addTrustedSafesCard={<AddTrustedSafesCard onAdd={modal.open} onLinkClick={onLinkClick} />}
      renderContentCard={(props) => <WelcomeContentCard {...props} />}
      search={<AccountsSearch setSearchQuery={setSearchQuery} />}
      renderSortToggle={(props) => <SafeListSortToggle {...props} />}
      trustedAccountsActions={<TrustedAccountsActions onManage={modal.open} onLinkClick={onLinkClick} />}
      accountsList={<AccountsList searchQuery={searchQuery} safes={safes} onLinkClick={onLinkClick} />}
      trustedSafesModal={<TrustedSafesModal modal={modal} />}
      dataWidget={<DataWidget />}
    />
  )
}

export default madProps(MyAccountsV2, {
  safes: useAllSafesGrouped,
})
