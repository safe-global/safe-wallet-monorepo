import { CowSwapWidget } from '@cowprotocol/widget-react'
import { type CowSwapWidgetParams, TradeType } from '@cowprotocol/widget-lib'
import type { OnTradeParamsPayload } from '@cowprotocol/events'
import { type CowEventListeners, CowEvents } from '@cowprotocol/events'
import { type MutableRefObject, useEffect, useMemo, useRef, useState } from 'react'
import { Box, useTheme } from '@mui/material'
import {
  SafeAppAccessPolicyTypes,
  type SafeAppData,
  SafeAppFeatures,
} from '@safe-global/safe-gateway-typescript-sdk/dist/types/safe-apps'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useCustomAppCommunicator } from '@/hooks/safe-apps/useCustomAppCommunicator'
import { useAppDispatch, useAppSelector } from '@/store'

import css from './styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import BlockedAddress from '@/components/common/BlockedAddress'
import useSwapConsent from './useSwapConsent'
import Disclaimer from '@/components/common/Disclaimer'
import WidgetDisclaimer from '@/components/common/WidgetDisclaimer'
import { selectSwapParams, setSwapParams, type SwapState } from './store/swapParamsSlice'
import { setSwapOrder } from '@/store/swapOrderSlice'
import useChainId from '@/hooks/useChainId'
import { type BaseTransaction } from '@safe-global/safe-apps-sdk'
import { id } from 'ethers'
import {
  LIMIT_ORDER_TITLE,
  SWAP_TITLE,
  SWAP_ORDER_TITLE,
  TWAP_ORDER_TITLE,
  SWAP_FEE_RECIPIENT,
} from '@/features/swap/constants'
import { calculateFeePercentageInBps } from '@/features/swap/helpers/fee'
import { UiOrderTypeToOrderType } from '@/features/swap/helpers/utils'
import { FEATURES } from '@/utils/chains'
import { useGetIsSanctionedQuery } from '@/store/api/ofac'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { getKeyWithTrueValue } from '@/utils/helpers'
import { BRAND_NAME } from '@/config/constants'
import { APPROVAL_SIGNATURE_HASH } from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'

const BASE_URL = typeof window !== 'undefined' && window.location.origin ? window.location.origin : ''

const PRE_SIGN_SIGHASH = id('setPreSignature(bytes,bool)').slice(0, 10)
const WRAP_SIGHASH = id('deposit()').slice(0, 10)
const UNWRAP_SIGHASH = id('withdraw(uint256)').slice(0, 10)
const CREATE_WITH_CONTEXT_SIGHASH = id('createWithContext((address,bytes32,bytes),address,bytes,bool)').slice(0, 10)
const CANCEL_ORDER_SIGHASH = id('invalidateOrder(bytes)').slice(0, 10)

type Params = {
  sell?: {
    // The token address
    asset: string
    amount: string
  }
}

export const getSwapTitle = (tradeType: SwapState['tradeType'], txs: BaseTransaction[] | undefined) => {
  const hashToLabel = {
    [PRE_SIGN_SIGHASH]: tradeType === 'limit' ? LIMIT_ORDER_TITLE : SWAP_ORDER_TITLE,
    [APPROVAL_SIGNATURE_HASH]: 'Approve',
    [WRAP_SIGHASH]: 'Wrap',
    [UNWRAP_SIGHASH]: 'Unwrap',
    [CREATE_WITH_CONTEXT_SIGHASH]: TWAP_ORDER_TITLE,
    [CANCEL_ORDER_SIGHASH]: 'Cancel Order',
  }

  const swapTitle = txs
    ?.map((tx) => hashToLabel[tx.data.slice(0, 10)])
    .filter(Boolean)
    .join(' and ')

  return swapTitle
}

const SwapWidget = ({ sell }: Params) => {
  const { palette } = useTheme()
  const darkMode = useDarkMode()
  const chainId = useChainId()
  const dispatch = useAppDispatch()
  const swapParams = useAppSelector(selectSwapParams)
  const { safeAddress, safeLoading } = useSafeInfo()
  const [recipientAddress, setRecipientAddress] = useState('')
  const wallet = useWallet()
  const { isConsentAccepted, onAccept } = useSwapConsent()
  const feeEnabled = useHasFeature(FEATURES.NATIVE_SWAPS_FEE_ENABLED)
  const useStagingCowServer = useHasFeature(FEATURES.NATIVE_SWAPS_USE_COW_STAGING_SERVER)

  const { data: isSafeAddressBlocked } = useGetIsSanctionedQuery(safeAddress || skipToken)
  const { data: isWalletAddressBlocked } = useGetIsSanctionedQuery(wallet?.address || skipToken)
  const { data: isRecipientAddressBlocked } = useGetIsSanctionedQuery(recipientAddress || skipToken)
  const blockedAddresses = {
    [safeAddress]: !!isSafeAddressBlocked,
    [wallet?.address || '']: !!isWalletAddressBlocked,
    [recipientAddress]: !!isRecipientAddressBlocked,
  }

  const blockedAddress = getKeyWithTrueValue(blockedAddresses)

  const [params, setParams] = useState<CowSwapWidgetParams>({
    appCode: 'Safe Wallet Swaps', // Name of your app (max 50 characters)
    width: '100%', // Width in pixels (or 100% to use all available space)
    height: '860px',
    chainId,
    baseUrl: useStagingCowServer ? 'https://staging.swap.cow.fi' : 'https://swap.cow.fi',
    standaloneMode: false,
    disableToastMessages: true,
    disablePostedOrderConfirmationModal: true,
    hideLogo: true,
    hideNetworkSelector: true,
    sounds: {
      orderError: null,
      orderExecuted: null,
      postOrder: null,
    },
    tradeType: swapParams.tradeType,
    sell: sell || {
      asset: '',
      amount: '0',
    },
    buy: {
      asset: '',
      amount: '0',
    },
    images: {
      emptyOrders: darkMode
        ? BASE_URL + '/images/common/swap-empty-dark.svg'
        : BASE_URL + '/images/common/swap-empty-light.svg',
    },
    enabledTradeTypes: [TradeType.SWAP, TradeType.LIMIT, TradeType.ADVANCED],
    theme: {
      baseTheme: darkMode ? 'dark' : 'light',
      primary: palette.primary.main,
      background: palette.background.main,
      paper: palette.background.paper,
      text: palette.text.primary,
      danger: palette.error.dark,
      info: palette.info.main,
      success: palette.success.main,
      warning: palette.warning.main,
      alert: palette.warning.main,
    },
    partnerFee: {
      bps: feeEnabled ? 35 : 0,
      recipient: SWAP_FEE_RECIPIENT,
    },
    content: {
      feeLabel: 'Widget Fee',
      feeTooltipMarkdown: `The [tiered widget fee](https://help.safe.global/en/articles/178530-how-does-the-widget-fee-work-for-native-swaps) incurred here is charged by CoW Protocol for the operation of this widget. The fee is automatically calculated into this quote. Part of the fee will contribute to a license fee that supports the Safe Community. Neither the Safe Ecosystem Foundation nor ${BRAND_NAME} operate the CoW Swap Widget and/or CoW Swap`,
    },
  })

  const appData: SafeAppData = useMemo(
    () => ({
      id: 1,
      url: 'https://app.safe.global',
      name: SWAP_TITLE,
      iconUrl: darkMode ? './images/common/safe-swap-dark.svg' : './images/common/safe-swap.svg',
      description: 'Safe Apps',
      chainIds: ['1', '100'],
      accessControl: { type: SafeAppAccessPolicyTypes.NoRestrictions },
      tags: ['safe-apps'],
      features: [SafeAppFeatures.BATCHED_TRANSACTIONS],
      socialProfiles: [],
    }),
    [darkMode],
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
          const { orderType: tradeType, recipient, sellToken, buyToken } = newTradeParams

          const newFeeBps = feeEnabled ? calculateFeePercentageInBps(newTradeParams) : 0

          setParams((params) => ({
            ...params,
            tradeType: UiOrderTypeToOrderType(tradeType),
            partnerFee: {
              recipient: SWAP_FEE_RECIPIENT,
              bps: newFeeBps,
            },
            sell: {
              asset: sellToken?.address,
            },
            buy: {
              asset: buyToken?.address,
            },
          }))

          if (recipient) {
            setRecipientAddress(recipient)
          }

          dispatch(setSwapParams({ tradeType }))
        },
      },
    ]
  }, [dispatch, feeEnabled])

  useEffect(() => {
    setParams((params) => ({
      ...params,
      chainId,
      theme: {
        baseTheme: darkMode ? 'dark' : 'light',
        primary: palette.primary.main,
        background: palette.background.main,
        paper: palette.background.paper,
        text: palette.text.primary,
        danger: palette.error.dark,
        info: palette.info.main,
        success: palette.success.main,
        warning: palette.warning.main,
        alert: palette.warning.main,
      },
    }))
  }, [palette, darkMode, chainId])

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
    <Box className={css.swapWidget} id="swapWidget">
      <CowSwapWidget params={params} listeners={listeners} />
    </Box>
  )
}

export default SwapWidget
