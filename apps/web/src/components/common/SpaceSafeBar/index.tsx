import { useCallback } from 'react'
import { useRouter } from 'next/router'
import SafeSelectorDropdown from '@/features/spaces/components/SafeSelectorDropdown'
import { useIsQualifiedSafe, useCurrentSpaceId } from '@/features/spaces'
import { useSpaceSafeSelectorItems } from './hooks/useSpaceSafeSelectorItems'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { AppRoutes } from '@/config/routes'
import BackLink from '@/components/common/BackLink'
import InitialsAvatar from '@/features/spaces/components/InitialsAvatar'

function SpaceSafeBar() {
  const isQualifiedSafe = useIsQualifiedSafe()
  const { items, selectedItemId, handleItemSelect, handleChainChange, isError, refetch } = useSpaceSafeSelectorItems()
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !isUserSignedIn || !spaceId })
  const router = useRouter()

  const handleBackToSpace = useCallback(() => {
    if (spaceId) {
      router.push({
        pathname: AppRoutes.spaces.index,
        query: { spaceId },
      })
    }
  }, [spaceId, router])

  if (!isQualifiedSafe) return null

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 pt-4 pb-0" style={{ backgroundColor: 'var(--color-background-main)' }}>
      {space && (
        <BackLink onClick={handleBackToSpace}>
          <InitialsAvatar name={space.name} size="medium" />
        </BackLink>
      )}
      <SafeSelectorDropdown
        items={items}
        selectedItemId={selectedItemId}
        onItemSelect={handleItemSelect}
        onChainChange={handleChainChange}
        isError={isError}
        onRetry={refetch}
      />
    </div>
  )
}

export default SpaceSafeBar
