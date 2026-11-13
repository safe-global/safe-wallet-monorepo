import type { CowSwapWidgetParams } from '@cowprotocol/widget-lib'
import {
  type OnTradeParamsPayload,
  type CowWidgetEventListeners as CowEventListeners,
  CowWidgetEvents as CowEvents,
} from '@cowprotocol/events'
import { type MutableRefObject, useEffect, useMemo, useRef, useState } from 'react'
import { CowSwapWidget } from '@cowprotocol/widget-react'
import { SafeAppAccessPolicyTypes, SafeAppFeatures } from '@safe-global/store/gateway/types'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useCustomAppCommunicator } from '@/hooks/safe-apps/useCustomAppCommunicator'
import { useAppDispatch, useAppSelector } from '@/store'

import css from '../../styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import BlockedAddress from '@/components/common/BlockedAddress'
import useSwapConsent from '../../useSwapConsent'
import Disclaimer from '@safe-global/views/components/common/Disclaimer'
import WidgetDisclaimer from '@/components/common/WidgetDisclaimer'
import { selectSwapParams, setSwapParams } from '../../store/swapParamsSlice'
import { setSwapOrder } from '@/store/swapOrderSlice'
import useChainId from '@/hooks/useChainId'
import { SWAP_TITLE, SWAP_FEE_RECIPIENT } from '../../constants'
import { calculateFeePercentageInBps } from '../../helpers/fee'
import { UiOrderTypeToOrderType, parseCowTradeParams } from '../../helpers/utils'
import { useGetIsSanctionedQuery } from '@/store/api/ofac'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { getKeyWithTrueValue } from '@/utils/helpers'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { parseCowSupportedChainId } from '../../helpers/cowSupportedChainId'
import { getCowSwapBaseUrl, getSwapWidgetParams, getSwapWidgetTheme } from '../../helpers/widgetParams'

type Params = {
  sell?: {
    // The token address
    asset: string
    amount: string
  }
}

const SwapWidget = ({ sell }: Params) => {
  const darkMode = useDarkMode()
  const chainId = useChainId()
  const cowChainId = useMemo(() => parseCowSupportedChainId(chainId), [chainId])
  const dispatch = useAppDispatch()
  const swapParams = useAppSelector(selectSwapParams)
  const { safeAddress, safeLoading } = useSafeInfo()
  const [recipientAddress, setRecipientAddress] = useState('')
  const wallet = useWallet()
  const { isConsentAccepted, onAccept } = useSwapConsent()
  const feeEnabled = useHasFeature(FEATURES.NATIVE_SWAPS_FEE_ENABLED)
  const nativeCowSwapFeeV2Enabled = useHasFeature(FEATURES.NATIVE_COW_SWAP_FEE_V2)
  const isEurcvBoostEnabled = useHasFeature(FEATURES.EURCV_BOOST)
  const useStagingCowServer = useHasFeature(FEATURES.NATIVE_SWAPS_USE_COW_STAGING_SERVER)
  const cowSwapBaseUrl = getCowSwapBaseUrl(useStagingCowServer)

  const { data: isSafeAddressBlocked } = useGetIsSanctionedQuery(safeAddress || skipToken)
  const { data: isWalletAddressBlocked } = useGetIsSanctionedQuery(wallet?.address || skipToken)
  const { data: isRecipientAddressBlocked } = useGetIsSanctionedQuery(recipientAddress || skipToken)
  const blockedAddresses = {
    [safeAddress]: !!isSafeAddressBlocked,
    [wallet?.address || '']: !!isWalletAddressBlocked,
    [recipientAddress]: !!isRecipientAddressBlocked,
  }

  const blockedAddress = getKeyWithTrueValue(blockedAddresses)

  const [params, setParams] = useState<CowSwapWidgetParams>(() =>
    getSwapWidgetParams({
      chainId: cowChainId,
      darkMode,
      flags: { feeEnabled, useStagingCowServer },
      tradeType: swapParams.tradeType,
      sell,
    }),
  )

  const appData: SafeAppData = useMemo(
    () => ({
      id: 1,
      url: cowSwapBaseUrl,
      name: SWAP_TITLE,
      iconUrl: darkMode ? './images/common/safe-swap-dark.svg' : './images/common/safe-swap.svg',
      description: 'Safe Apps',
      chainIds: ['1', '100'],
      accessControl: { type: SafeAppAccessPolicyTypes.NoRestrictions },
      tags: ['safe-apps'],
      features: [SafeAppFeatures.BATCHED_TRANSACTIONS],
      socialProfiles: [],
      featured: false,
    }),
    [darkMode, cowSwapBaseUrl],
  )

  const listeners = useMemo<CowEventListeners>(() => {
    return [
      {
        event: CowEvents.ON_TOAST_MESSAGE,
        handler: (event) => {
          console.info('[Swaps] message:', event)
          const { messageType } = event

          switch (messageType) {
            case 'ORDER_CREATED':
              dispatch(
                setSwapOrder({
                  orderUid: event.data.orderUid,
                  status: 'created',
                }),
              )
              break
            case 'ORDER_PRESIGNED':
              dispatch(
                setSwapOrder({
                  orderUid: event.data.orderUid,
                  status: 'open',
                }),
              )
              break
            case 'ORDER_FULFILLED':
              dispatch(
                setSwapOrder({
                  orderUid: event.data.orderUid,
                  status: 'fulfilled',
                }),
              )
              break
            case 'ORDER_EXPIRED':
              dispatch(
                setSwapOrder({
                  orderUid: event.data.orderUid,
                  status: 'expired',
                }),
              )
              break
            case 'ORDER_CANCELLED':
              dispatch(
                setSwapOrder({
                  orderUid: event.data.orderUid,
                  status: 'cancelled',
                }),
              )
              break
          }
        },
      },
      {
        event: CowEvents.ON_CHANGE_TRADE_PARAMS,
        handler: (newTradeParams: OnTradeParamsPayload) => {
          const { recipient } = newTradeParams
          const { uiOrderType: tradeType, sellAsset, buyAsset } = parseCowTradeParams(newTradeParams)

          const newFeeBps = feeEnabled
            ? calculateFeePercentageInBps(newTradeParams, nativeCowSwapFeeV2Enabled, isEurcvBoostEnabled)
            : 0

          setParams((params) => ({
            ...params,
            tradeType: UiOrderTypeToOrderType(tradeType),
            partnerFee: {
              recipient: SWAP_FEE_RECIPIENT,
              bps: newFeeBps,
            },
            sell: {
              asset: sellAsset,
            },
            buy: {
              asset: buyAsset,
            },
          }))

          if (recipient) {
            setRecipientAddress(recipient)
          }

          dispatch(setSwapParams({ tradeType }))
        },
      },
    ]
  }, [dispatch, feeEnabled, nativeCowSwapFeeV2Enabled, isEurcvBoostEnabled])

  useEffect(() => {
    setParams((params) => ({
      ...params,
      baseUrl: cowSwapBaseUrl,
      chainId: cowChainId,
      theme: getSwapWidgetTheme(darkMode),
    }))
  }, [darkMode, cowChainId, cowSwapBaseUrl])

  useEffect(() => {
    if (!sell) return
    setParams((params) => ({
      ...params,
      sell,
    }))
  }, [sell])

  const chain = useCurrentChain()

  const iframeRef: MutableRefObject<HTMLIFrameElement | null> = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    const iframeElement = document.querySelector('#swapWidget iframe')
    if (iframeElement) {
      iframeRef.current = iframeElement as HTMLIFrameElement
    }
  }, [params, isConsentAccepted, safeLoading])

  useCustomAppCommunicator(iframeRef, appData, chain)

  if (blockedAddress) {
    return <BlockedAddress address={blockedAddress} featureTitle="embedded swaps feature with CoW Swap" />
  }

  if (!isConsentAccepted) {
    return (
      <Disclaimer
        title="Note"
        content={<WidgetDisclaimer widgetName="CoW Swap Widget" />}
        onAccept={onAccept}
        buttonText="Continue"
      />
    )
  }

  return (
    <div className={css.swapWidget} id="swapWidget">
      <CowSwapWidget params={params} listeners={listeners} />
    </div>
  )
}

export default SwapWidget
