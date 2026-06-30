import { useContext } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/router'
import { TxModalContext } from '@/components/tx-flow'
import { AppRoutes } from '@/config/routes'
import { useIsQualifiedSafe, SafeSelectorDropdown } from '@/features/spaces'
import TrustedSafesModal from '@/components/common/TrustedSafesModal'
import useTrustedSafesModal from '@/components/common/TrustedSafesModal/useTrustedSafesModal'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { useSpaceSafeSelectorItems } from './hooks/useSpaceSafeSelectorItems'
import { useSpaceBackLink } from './hooks/useSpaceBackLink'
import SpaceBackLink from './SpaceBackLink'
import SpaceChainSelector from './SpaceChainSelector'
import SpaceNestedSafesButton from './SpaceNestedSafesButton'

const HIDDEN_ROUTES = [
  AppRoutes.welcome.accounts,
  AppRoutes.welcome.spaces,
  AppRoutes.newSafe.create,
  AppRoutes.newSafe.advancedCreate,
  AppRoutes.newSafe.load,
  AppRoutes.terms,
  AppRoutes.privacy,
  AppRoutes.licenses,
  AppRoutes.imprint,
  AppRoutes.cookie,
  AppRoutes['403'],
  AppRoutes['404'],
  AppRoutes['_offline'],
]

function SpaceSafeBar() {
  const pathname = usePathname()
  const router = useRouter()
  const urlSafeAddress = useSafeAddressFromUrl()
  const isQualifiedSafe = useIsQualifiedSafe()
  const {
    items,
    workspaceItems,
    localItems,
    hasWorkspace,
    selectedItemId,
    handleItemSelect,
    isLoading,
    isError,
    refetch,
    isInSpaceContext,
  } = useSpaceSafeSelectorItems()
  const { space, handleBackToSpace } = useSpaceBackLink()
  const { txFlow } = useContext(TxModalContext)
  const trustedSafesModal = useTrustedSafesModal()

  // Use the matched Next.js route, not `usePathname`: error pages (404/403) render
  // under the original unmatched URL (e.g. `/hom`), where `usePathname` wouldn't match.
  if (HIDDEN_ROUTES.includes(router.pathname)) return null
  // /settings/* serves both per-safe (URL has ?safe=) and global pages — hide when no safe context.
  if (pathname?.startsWith(AppRoutes.settings.index) && !urlSafeAddress) return null

  return (
    <div data-testid="safe-level-navigation" className="flex flex-wrap items-center gap-2 max-[899px]:justify-end">
      {/* Back-link + safe selector are one unit so they never split across rows. Under 430px
          the group dissolves (display:contents) so the back-link joins the nested/network
          controls on one row and the safe selector drops to its own full-width row below. */}
      <div className="flex min-w-0 items-center gap-2 max-[429px]:contents">
        {isQualifiedSafe && space && !txFlow && <SpaceBackLink space={space} onClick={handleBackToSpace} />}
        <div className="contents max-[429px]:block max-[429px]:order-[10000] max-[429px]:min-w-0 max-[429px]:basis-full">
          <SafeSelectorDropdown
            items={items}
            workspaceItems={workspaceItems}
            localItems={localItems}
            hasWorkspace={hasWorkspace}
            workspaceName={space?.name}
            isInSpaceContext={isInSpaceContext}
            selectedItemId={selectedItemId}
            onItemSelect={handleItemSelect}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onManageTrustedSafes={trustedSafesModal.open}
            onSignIn={() => router.push(AppRoutes.welcome.spaces)}
          />
        </div>
      </div>
      <SpaceNestedSafesButton />
      <SpaceChainSelector isLoading={isLoading} />
      <TrustedSafesModal modal={trustedSafesModal} />
    </div>
  )
}

export default SpaceSafeBar
