import { selectUndeployedSafes } from '@/features/counterfactual/store'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Checkbox,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material'
import { Fragment, useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useChains from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { useNotificationPreferences } from './hooks/useNotificationPreferences'
import { useNotificationRegistrations } from './hooks/useNotificationRegistrations'
import { trackEvent } from '@/services/analytics'
import { PUSH_NOTIFICATION_EVENTS } from '@/services/analytics/events/push-notifications'
import { requestNotificationPermission } from './logic'
import type { NotifiableSafes } from './logic'
import CheckWalletWithPermission from '@/components/common/CheckWalletWithPermission'
import { Permission } from '@/permissions/config'

import css from './styles.module.css'
import { useAllOwnedSafes } from '@/hooks/safes'
import useWallet from '@/hooks/wallets/useWallet'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { useNotificationsRenewal } from './hooks/useNotificationsRenewal'
import {
  _filterUndeployedSafes,
  _transformCurrentSubscribedSafes,
  _mergeNotifiableSafes,
  _sanitizeNotifiableSafes,
  _getTotalNotifiableSafes,
  _areAllSafesSelected,
  _getTotalSignaturesRequired,
  _shouldRegisterSelectedSafes,
  _shouldUnregisterSelectedSafes,
  _getSafesToRegister,
  _getSafesToUnregister,
  _shouldUnregisterDevice,
} from './GlobalPushNotifications.utils'

export {
  _filterUndeployedSafes,
  _transformAddedSafes,
  _transformCurrentSubscribedSafes,
  _mergeNotifiableSafes,
  _sanitizeNotifiableSafes,
  _getTotalNotifiableSafes,
  _areAllSafesSelected,
  _getTotalSignaturesRequired,
  _shouldRegisterSelectedSafes,
  _shouldUnregisterSelectedSafes,
  _getSafesToRegister,
  _getSafesToUnregister,
  _shouldUnregisterDevice,
} from './GlobalPushNotifications.utils'

export const GlobalPushNotifications = (): ReactElement | null => {
  const chains = useChains()
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const [isLoading, setIsLoading] = useState(false)
  const { address = '' } = useWallet() || {}
  const [ownedSafes] = useAllOwnedSafes(address)
  const addedSafes = useAppSelector(selectAllAddedSafes)

  const { getAllPreferences } = useNotificationPreferences()
  const { unregisterDeviceNotifications, unregisterSafeNotifications, registerNotifications } =
    useNotificationRegistrations()

  const { safesForRenewal } = useNotificationsRenewal()

  // Safes selected in the UI
  const [selectedSafes, setSelectedSafes] = useState<NotifiableSafes>({})

  // Current Safes registered for notifications in indexedDB
  const currentNotifiedSafes = useMemo(() => {
    const allPreferences = getAllPreferences()
    return _transformCurrentSubscribedSafes(allPreferences)
  }, [getAllPreferences])

  // `currentNotifiedSafes` is initially undefined until indexedDB resolves
  useEffect(() => {
    let isMounted = true

    if (currentNotifiedSafes && isMounted) {
      setSelectedSafes(currentNotifiedSafes)
    }

    return () => {
      isMounted = false
    }
  }, [currentNotifiedSafes])

  // Merged added Safes and `currentNotifiedSafes` (in case subscriptions aren't added)
  const notifiableSafes = useMemo(() => {
    const safes = _mergeNotifiableSafes(ownedSafes, addedSafes, currentNotifiedSafes)
    const deployedSafes = _filterUndeployedSafes(safes, undeployedSafes)
    return _sanitizeNotifiableSafes(chains.configs, deployedSafes)
  }, [ownedSafes, addedSafes, currentNotifiedSafes, undeployedSafes, chains.configs])

  const totalNotifiableSafes = useMemo(() => {
    return _getTotalNotifiableSafes(notifiableSafes)
  }, [notifiableSafes])

  const isAllSelected = useMemo(() => {
    return _areAllSafesSelected(notifiableSafes, selectedSafes)
  }, [notifiableSafes, selectedSafes])

  const onSelectAll = () => {
    setSelectedSafes(() => {
      if (isAllSelected) {
        return []
      }

      return Object.entries(notifiableSafes).reduce((acc, [chainId, safeAddresses]) => {
        return {
          ...acc,
          [chainId]: safeAddresses,
        }
      }, {})
    })
  }

  const totalSignaturesRequired = useMemo(() => {
    return _getTotalSignaturesRequired(selectedSafes, currentNotifiedSafes)
  }, [currentNotifiedSafes, selectedSafes])

  const canSave = useMemo(() => {
    return (
      _shouldRegisterSelectedSafes(selectedSafes, currentNotifiedSafes) ||
      _shouldUnregisterSelectedSafes(selectedSafes, currentNotifiedSafes)
    )
  }, [selectedSafes, currentNotifiedSafes])

  const onSave = async () => {
    if (!canSave) {
      return
    }

    setIsLoading(true)

    // Although the (un-)registration functions will request permission in getToken we manually
    // check beforehand to prevent multiple promises in registrationPromises from throwing
    const isGranted = await requestNotificationPermission()

    if (!isGranted) {
      setIsLoading(false)
      return
    }

    const registrationPromises: Array<Promise<unknown>> = []

    const newlySelectedSafes = _getSafesToRegister(selectedSafes, currentNotifiedSafes)

    // Merge Safes that need to be registered with the ones for which notifications need to be renewed
    const safesToRegister = _mergeNotifiableSafes(newlySelectedSafes, {}, safesForRenewal)

    if (safesToRegister) {
      registrationPromises.push(registerNotifications(safesToRegister))
    }

    const safesToUnregister = _getSafesToUnregister(selectedSafes, currentNotifiedSafes)
    if (safesToUnregister) {
      const unregistrationPromises = Object.entries(safesToUnregister).flatMap(([chainId, safeAddresses]) => {
        if (_shouldUnregisterDevice(chainId, safeAddresses, currentNotifiedSafes)) {
          return unregisterDeviceNotifications(chainId)
        }
        return safeAddresses.map((safeAddress) => unregisterSafeNotifications(chainId, safeAddress))
      })

      registrationPromises.push(...unregistrationPromises)
    }

    await Promise.all(registrationPromises)

    trackEvent(PUSH_NOTIFICATION_EVENTS.SAVE_SETTINGS)

    setIsLoading(false)
  }

  if (totalNotifiableSafes === 0) {
    return (
      <Typography sx={{ color: ({ palette }) => palette.primary.light }}>
        {address ? 'No owned Safes' : 'No wallet connected'}
      </Typography>
    )
  }

  return (
    <Grid container>
      <Grid item xs={12} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h4" fontWeight={700} display="inline">
          My Safes Accounts ({totalNotifiableSafes})
        </Typography>

        <Box display="flex" alignItems="center">
          {totalSignaturesRequired > 0 && (
            <Typography display="inline" mr={2} textAlign="right">
              We&apos;ll ask you to verify ownership of each Safe Account with your signature per chain{' '}
              {totalSignaturesRequired} time{maybePlural(totalSignaturesRequired)}
            </Typography>
          )}

          <CheckWalletWithPermission permission={Permission.EnablePushNotifications}>
            {(isOk) => (
              <Button variant="contained" disabled={!canSave || !isOk || isLoading} onClick={onSave}>
                {isLoading ? <CircularProgress size={20} /> : 'Save'}
              </Button>
            )}
          </CheckWalletWithPermission>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ border: ({ palette }) => `1px solid ${palette.border.light}` }}>
          <List>
            <ListItem disablePadding className={css.item}>
              <ListItemButton onClick={onSelectAll} dense>
                <ListItemIcon className={css.icon}>
                  <Checkbox edge="start" checked={isAllSelected} disableRipple />
                </ListItemIcon>
                <ListItemText primary="Select all" primaryTypographyProps={{ variant: 'h5' }} />
              </ListItemButton>
            </ListItem>
          </List>

          <Divider />

          {Object.entries(notifiableSafes).map(([chainId, safeAddresses], i, arr) => {
            if (safeAddresses.length === 0) return
            const chain = chains.configs?.find((chain) => chain.chainId === chainId)

            const isChainSelected = safeAddresses.every((address) => {
              return selectedSafes[chainId]?.includes(address)
            })

            const onSelectChain = () => {
              setSelectedSafes((prev) => {
                return {
                  ...prev,
                  [chainId]: isChainSelected ? [] : safeAddresses,
                }
              })
            }

            return (
              <Fragment key={chainId}>
                <List>
                  <ListItem disablePadding className={css.item}>
                    <ListItemButton onClick={onSelectChain} dense>
                      <ListItemIcon className={css.icon}>
                        <Checkbox edge="start" checked={isChainSelected} disableRipple />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${chain?.chainName} Safe Accounts`}
                        primaryTypographyProps={{ variant: 'h5' }}
                      />
                    </ListItemButton>
                  </ListItem>

                  <List disablePadding className={css.item}>
                    {safeAddresses.map((safeAddress) => {
                      const isSafeSelected = selectedSafes[chainId]?.includes(safeAddress) ?? false

                      const onSelectSafe = () => {
                        setSelectedSafes((prev) => {
                          return {
                            ...prev,
                            [chainId]: isSafeSelected
                              ? prev[chainId]?.filter((addr) => !sameAddress(addr, safeAddress))
                              : [...(prev[chainId] ?? []), safeAddress],
                          }
                        })
                      }

                      return (
                        <ListItem disablePadding key={safeAddress}>
                          <ListItemButton sx={{ pl: 7, py: 0.5 }} onClick={onSelectSafe} dense>
                            <ListItemIcon className={css.icon}>
                              <Checkbox edge="start" checked={isSafeSelected} disableRipple />
                            </ListItemIcon>
                            <EthHashInfo
                              avatarSize={36}
                              prefix={chain?.shortName}
                              key={safeAddress}
                              address={safeAddress || ''}
                              shortAddress={false}
                              showName={true}
                              chainId={chainId}
                            />
                          </ListItemButton>
                        </ListItem>
                      )
                    })}
                  </List>
                </List>

                {i !== arr.length - 1 ? <Divider /> : null}
              </Fragment>
            )
          })}
        </Paper>
      </Grid>
    </Grid>
  )
}
