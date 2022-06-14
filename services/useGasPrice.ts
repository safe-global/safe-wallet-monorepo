import { BigNumber, FixedNumber } from 'ethers'
import { FeeData } from '@ethersproject/providers'
import { GasPrice, GasPriceOracle, GAS_PRICE_TYPE } from '@gnosis.pm/safe-react-gateway-sdk'
import useAsync from '@/services/useAsync'
import { useCurrentChain } from './useChains'
import useIntervalCounter from './useIntervalCounter'
import { useRef } from 'react'
import { useWeb3ReadOnly } from './wallets/web3'

const REFRESH_DELAY = 20e3 // 20 seconds

const fetchGasOracle = async (gasPriceOracle: GasPriceOracle): Promise<BigNumber> => {
  const { uri, gasParameter, gweiFactor } = gasPriceOracle
  const json = await fetch(uri).then((resp) => resp.json())
  const data = json.data || json.result || json
  return BigNumber.from(gweiFactor).mul(FixedNumber.from(data[gasParameter]).toHexString())
}

const getGasPrice = async (gasPriceConfigs: GasPrice): Promise<BigNumber | undefined> => {
  for (const config of gasPriceConfigs) {
    if (config.type == GAS_PRICE_TYPE.ORACLE) {
      try {
        return await fetchGasOracle(config)
      } catch (error) {
        console.error('Error fetching gas price from oracle', error)
        continue
      }
    } else if (config.type == GAS_PRICE_TYPE.FIXED) {
      return BigNumber.from(config.weiValue)
    } else {
      continue
    }
  }
  return undefined
}

const useGasPrice = (): {
  maxFeePerGas?: BigNumber
  maxPriorityFeePerGas?: BigNumber
  gasPriceError?: Error
  gasPriceLoading: boolean
} => {
  const chain = useCurrentChain()
  const gasPriceConfigs = chain?.gasPrice
  const [counter] = useIntervalCounter(REFRESH_DELAY)
  const provider = useWeb3ReadOnly()

  const [gasPrice, gasPriceError, gasPriceLoading] = useAsync<BigNumber | undefined>(async () => {
    if (!gasPriceConfigs) return
    return getGasPrice(gasPriceConfigs)
  }, [gasPriceConfigs, counter])

  const [feeData, feeDataError, feeDataLoading] = useAsync<FeeData | undefined>(async () => {
    if (!provider) return
    return provider.getFeeData()
  }, [provider, counter])

  // Save the previous gas price so that we don't return undefined each time it's polled
  const lastPrice = useRef<BigNumber>()
  lastPrice.current = gasPrice || feeData?.maxFeePerGas || lastPrice.current

  const lastPrioFee = useRef<BigNumber>()
  lastPrioFee.current = feeData?.maxPriorityFeePerGas || lastPrioFee.current

  return {
    maxFeePerGas: lastPrice.current,
    maxPriorityFeePerGas: lastPrioFee.current,
    gasPriceError: gasPriceError || feeDataError,
    gasPriceLoading: gasPriceLoading || feeDataLoading,
  }
}

export default useGasPrice
