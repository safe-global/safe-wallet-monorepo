import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Typography } from '@mui/material'
import { useHasFeature } from '@/hooks/useChains'
import { BRAND_NAME } from '@/config/constants'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { SwapFeature } from '@/features/swap'
import { useLoadFeature } from '@/features/__core__'

// Cow Swap expects native token addresses to be in the format '0xeeee...eeee'
const adjustEthAddress = (address: string) => {
  if (address && Number(address) === 0) {
    const ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    return ETH_ADDRESS
  }
  return address
}

const SwapPage: NextPage = () => {
  const router = useRouter()
  const { token, amount } = router.query
  const isFeatureEnabled = useHasFeature(FEATURES.NATIVE_SWAPS)
  const isCowEnabled = useHasFeature(FEATURES.NATIVE_SWAPS_COW)

  // Access swap widgets via feature architecture (renders null during SSR via proxy stub)
  const { SwapWidget, FallbackSwapWidget } = useLoadFeature(SwapFeature)

  let sell = undefined
  if (token && amount) {
    sell = {
      asset: adjustEthAddress(String(token ?? '')),
      amount: String(amount ?? ''),
    }
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Swap`}</title>
      </Head>

      <main style={{ height: 'calc(100vh - 52px)' }}>
        {isFeatureEnabled === true && isCowEnabled === true ? (
          <SwapWidget sell={sell} />
        ) : isFeatureEnabled === true && isCowEnabled === false ? (
          <FallbackSwapWidget fromToken={sell?.asset} />
        ) : isFeatureEnabled === false ? (
          <Typography textAlign="center" my={3}>
            Swaps are not supported on this network.
          </Typography>
        ) : null}
      </main>
    </>
  )
}

export default SwapPage
