import type { ReactElement } from 'react'
import { useCallback, useMemo, useRef } from 'react'
import { ListItemButton, Box, Typography, IconButton, SvgIcon, Skeleton, useMediaQuery, useTheme } from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/router'

import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import { useGetHref } from '@/features/myAccounts/hooks/useGetHref'
import { useChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import useChainId from '@/hooks/useChainId'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import SafeIcon from '@/components/common/SafeIcon'
import EthHashInfo from '@/components/common/EthHashInfo'
import ChainIndicator from '@/components/common/ChainIndicator'
import FiatValue from '@/components/common/FiatValue'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import { useAppDispatch, useAppSelector } from '@/store'
import SafeListContextMenu from '@/components/sidebar/SafeListContextMenu'
import { addOrUpdateSafe, unpinSafe } from '@/store/addedSafesSlice'
import { showNotification, useGetSafeOverviewQuery } from '@/store/slices'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { skipToken } from '@reduxjs/toolkit/query'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { trackEvent, OVERVIEW_EVENTS, OVERVIEW_LABELS, PIN_SAFE_LABELS } from '@/services/analytics'
import BookmarkIcon from '@/public/images/apps/bookmark.svg'
import BookmarkedIcon from '@/public/images/apps/bookmarked.svg'
import useOnceVisible from '@/hooks/useOnceVisible'
import { selectUndeployedSafe } from '@/features/counterfactual/store/undeployedSafesSlice'
import { AccountInfoChips } from '@/features/myAccounts/components/AccountInfoChips'
import classnames from 'classnames'

import css from './styles.module.css'

type AccountListItemProps = {
  safeItem: SafeItem
  onSelect?: () => void
  showBalance?: boolean
  isMultiChainItem?: boolean
}

/**
 * Account list item for dropdown
 * Shows status chips (activating, read-only, queue actions) and all account info
 */
const AccountListItem = ({
  safeItem,
  onSelect,
  showBalance = true,
  isMultiChainItem = false,
}: AccountListItemProps): ReactElement => {
  const { chainId, address, isPinned, isReadOnly } = safeItem
  const chain = useChain(chainId)
  const router = useRouter()
  const safeAddress = useSafeAddress()
  const currChainId = useChainId()
  const isCurrentSafe = chainId === currChainId && sameAddress(safeAddress, address)
  const elementRef = useRef<HTMLDivElement>(null)
  const isVisible = useOnceVisible(elementRef)
  const dispatch = useAppDispatch()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, chainId, address))
  const isActivating = undeployedSafe?.status.status !== 'AWAITING_EXECUTION'

  const getHref = useGetHref(router)
  const href = useMemo(() => {
    return chain ? getHref(chain, address) : ''
  }, [chain, getHref, address])

  const name = useAppSelector(selectAllAddressBooks)[chainId]?.[address]

  // Fetch safe overview for balance and threshold/owners
  const { data: safeOverview } = useGetSafeOverviewQuery(
    !isVisible
      ? skipToken
      : {
          chainId: safeItem.chainId,
          safeAddress: safeItem.address,
        },
  )

  const safeThreshold = safeOverview?.threshold ?? defaultSafeInfo.threshold
  const safeOwners = safeOverview?.owners ?? defaultSafeInfo.owners

  const addToPinnedList = () => {
    dispatch(
      addOrUpdateSafe({
        safe: {
          ...defaultSafeInfo,
          chainId,
          address: { value: address },
          owners: safeOwners,
          threshold: safeThreshold,
        },
      }),
    )

    dispatch(
      showNotification({
        title: 'Pinned Safe',
        message: name ?? shortenAddress(address),
        groupKey: `pin-safe-success-${address}`,
        variant: 'success',
      }),
    )

    trackEvent({ ...OVERVIEW_EVENTS.PIN_SAFE, label: PIN_SAFE_LABELS.pin })
  }

  const removeFromPinnedList = () => {
    dispatch(unpinSafe({ chainId, address }))

    dispatch(
      showNotification({
        title: 'Unpinned Safe',
        message: name ?? shortenAddress(address),
        groupKey: `unpin-safe-success-${address}`,
        variant: 'success',
      }),
    )

    trackEvent({ ...OVERVIEW_EVENTS.PIN_SAFE, label: PIN_SAFE_LABELS.unpin })
  }

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (onSelect) {
        event.preventDefault()
        onSelect()
      }
    },
    [onSelect],
  )

  return (
    <ListItemButton
      ref={elementRef}
      data-testid="account-list-item"
      selected={isCurrentSafe}
      className={classnames(css.accountListItem, {
        [css.currentItem]: isCurrentSafe,
      })}
      onClick={handleClick}
    >
      <Link href={href} className={css.safeLink}>
        <Box className={css.safeIcon} sx={{ pr: 2.5 }}>
          <SafeIcon
            address={address}
            owners={safeOwners.length > 0 ? safeOwners.length : undefined}
            threshold={safeThreshold > 0 ? safeThreshold : undefined}
            isMultiChainItem={isMultiChainItem}
            chainId={chainId}
          />
        </Box>

        <Box className={css.safeInfo}>
          {isMultiChainItem ? (
            <Typography
              component="span"
              sx={{
                color: 'var(--color-primary-light)',
                fontSize: 'inherit',
              }}
            >
              {chain?.chainName}
            </Typography>
          ) : (
            <EthHashInfo address={address} name={name} showName shortAddress showAvatar={false} copyAddress={false} />
          )}
          {!isMobile && (
            <AccountInfoChips
              isActivating={isActivating}
              isReadOnly={isReadOnly}
              undeployedSafe={!!undeployedSafe}
              isVisible={isVisible}
              safeOverview={safeOverview ?? null}
              chain={chain}
              href={href}
              onLinkClick={onSelect}
              trackingLabel={OVERVIEW_LABELS.sidebar_dropdown}
            />
          )}
        </Box>

        {!isMultiChainItem && (
          <Box className={css.chainBadge}>
            <ChainIndicator chainId={chainId} responsive onlyLogo />
          </Box>
        )}

        {showBalance && (
          <Typography variant="body2" className={css.balance}>
            {safeOverview ? <FiatValue value={safeOverview.fiatTotal} /> : <Skeleton variant="text" width={60} />}
          </Typography>
        )}
      </Link>

      {!isMultiChainItem && (
        <Box className={css.accountActions}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              isPinned ? removeFromPinnedList() : addToPinnedList()
            }}
          >
            <SvgIcon
              component={isPinned ? BookmarkedIcon : BookmarkIcon}
              inheritViewBox
              color={isPinned ? 'primary' : undefined}
              fontSize="small"
            />
          </IconButton>

          <SafeListContextMenu
            name={name}
            address={address}
            chainId={chainId}
            addNetwork={false}
            rename
            undeployedSafe={!!undeployedSafe}
          />

          {isMobile && (
            <AccountInfoChips
              isActivating={isActivating}
              isReadOnly={isReadOnly}
              undeployedSafe={!!undeployedSafe}
              isVisible={isVisible}
              safeOverview={safeOverview ?? null}
              chain={chain}
              href={href}
              onLinkClick={onSelect}
              trackingLabel={OVERVIEW_LABELS.sidebar_dropdown}
            />
          )}
        </Box>
      )}
    </ListItemButton>
  )
}

export default AccountListItem
