import { useCurrentChain } from '@/hooks/useChains'
import { createCryptoPaymentIntent, getTokenAddresses } from '@/services/pro/api'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { parseUnits } from 'ethers'
import { useContext, useEffect, useState } from 'react'
import type { GetTokenInfoDto } from './types'
import { Alert, Button } from '@mui/material'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { useSpaceSafes } from '@/features/spaces/hooks/useSpaceSafes'
import { PayInCryptoFlow } from '../tx-flow/flows'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { gtmSetSafeAddress } from '@/services/analytics/gtm'
import router from 'next/router'
import { TxModalContext } from '../tx-flow'
import { networks } from '@safe-global/protocol-kit/dist/src/utils/eip-3770/config'
import { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'

type Chains = Record<string, string>

const chains = networks.reduce<Chains>((result, { shortName, chainId }) => {
  result[chainId.toString()] = shortName.toString()
  return result
}, {})

const enum PayInCryptoState {
  SELECT_TOKEN = 'SELECT_TOKEN',
  SELECT_SAFE = 'SELECT_SAFE',
  READY_TO_PAY = 'READY_TO_PAY',
  PAYING = 'PAYING',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
}

export const PayinCryptoSelector = ({ planId }: { planId: string }) => {
  const spaceId = useCurrentSpaceId()
  const { allSafes } = useSpaceSafes()
  const [payInCryptoState, setPayInCryptoState] = useState<PayInCryptoState>(PayInCryptoState.SELECT_TOKEN)
  const [tokenAddresses, setTokenAddresses] = useState<GetTokenInfoDto[]>([])
  const [selectedToken, setSelectedToken] = useState<GetTokenInfoDto>()
  const [safe, setSafe] = useState<SafeItem>()
  const [subscriptionId, setSubscriptionId] = useState<string>('')
  const chain = useCurrentChain()
  const RECEIVER_ADDRESS = process.env.NEXT_PUBLIC_PRO_RECEIVER_ADDRESS as string
  const PRICE = '1'
  const ERC20_INTERFACE = ERC20__factory.createInterface()
  const [calldata, setCallData] = useState<string>('0x')
  const { setTxFlow } = useContext(TxModalContext)

  const onNewTxClick = async () => {
    if (!safe) {
      console.error('Safe is not selected')
      return
    }

    if (!selectedToken) {
      console.error('Selected token is not set')
      return
    }

    await setActiveSafe()
    // We have to set it explicitly otherwise its missing in the trackEvent below
    gtmSetSafeAddress(safe.address)
    trackEvent(SPACE_EVENTS.CREATE_SPACE_TX)

    setTxFlow(
      <PayInCryptoFlow subscriptionId={subscriptionId} tokenInfo={selectedToken} callData={calldata} />,
      resetActiveSafe,
      false,
    )
  }

  const setActiveSafe = async () => {
    if (!safe) {
      console.error('Safe is not selected')
      return
    }
    const shortname = chains[safe.chainId]

    await router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        safe: `${shortname}:${safe.address}`,
        chain: shortname,
      },
    })
  }

  const resetActiveSafe = async () => {
    await router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        safe: undefined,
        chain: undefined,
      },
    })
  }

  useAsync(async () => {
    if (!chain) return
    const addresses = await getTokenAddresses(chain.chainId)
    setTokenAddresses(addresses)
  }, [chain])

  useEffect(() => {
    if (selectedToken && safe) {
      const callData = ERC20_INTERFACE.encodeFunctionData('transfer', [
        RECEIVER_ADDRESS,
        parseUnits(PRICE, selectedToken.decimals),
      ])
      setCallData(callData)
    }
  }, [selectedToken, safe])

  const onHandleClickPay = async (tokenInfo: GetTokenInfoDto) => {
    setSelectedToken(tokenInfo)
    if (!chain) return
    const result = await createCryptoPaymentIntent(
      planId,
      spaceId as string,
      tokenInfo.address,
      parseInt(chain.chainId),
    )
    setSubscriptionId(result.subscriptionId)
  }

  const onSelectSafe = async (selectedSafe: SafeItem) => {
    setSafe(selectedSafe)
  }

  const getSafeList = (): any => {
    if (allSafes.length === 0) {
      return <Alert severity="info">No safes found in this space. Please add a safe to proceed.</Alert>
    }

    return (
      <div>
        <h3>Select Safe</h3>
        {allSafes.map((safe) => (
          <Button
            key={safe.address}
            variant="outlined"
            // TODO: Fix the type casting here
            onClick={() => onSelectSafe(safe as SafeItem)}
            style={{ marginRight: 8, marginBottom: 8 }}
          >
            {safe.name || safe.address}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <div>
      {
        <div>
          <h2>Pay in Crypto</h2>
          {tokenAddresses.map((tokenInfo) => (
            <Button
              variant="outlined"
              key={tokenInfo.address}
              onClick={() => {
                onHandleClickPay(tokenInfo)
              }}
              style={{ fontWeight: selectedToken?.address === tokenInfo.address ? 'bold' : 'normal', marginRight: 8 }}
            >
              {tokenInfo.symbol}
            </Button>
          ))}
        </div>
      }

      {getSafeList()}

      {selectedToken && (
        <div style={{ margin: '1em 0' }}>
          Price: {PRICE} {selectedToken.symbol}
        </div>
      )}

      <Button disabled={!safe || !selectedToken} variant="contained" onClick={() => onNewTxClick()}>
        Pay
      </Button>
    </div>
  )
}
