import type { MasterCopy as MasterCopyType } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useChainId from '@/hooks/useChainId'
import { Errors, logError } from '@/services/exceptions'
import { useMemo } from 'react'
import { useChainsGetMasterCopiesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'

export enum MasterCopyDeployer {
  GNOSIS = 'Gnosis',
  CIRCLES = 'Circles',
}

export type MasterCopy = MasterCopyType & {
  deployer: MasterCopyDeployer
  deployerRepoUrl: string
}

const extractMasterCopyInfo = (mc: MasterCopyType): MasterCopy => {
  const isCircles = mc.version.toLowerCase().includes(MasterCopyDeployer.CIRCLES.toLowerCase())
  const dashIndex = mc.version.indexOf('-')

  const masterCopy = {
    address: mc.address,
    version: !isCircles ? mc.version : mc.version.substring(0, dashIndex),
    deployer: !isCircles ? MasterCopyDeployer.GNOSIS : MasterCopyDeployer.CIRCLES,
    deployerRepoUrl: !isCircles
      ? 'https://github.com/gnosis/safe-contracts/releases'
      : 'https://github.com/CirclesUBI/safe-contracts/releases',
  }
  return masterCopy
}

export const useMasterCopies = (): AsyncResult<MasterCopy[]> => {
  const chainId = useChainId()
  const { data, isLoading, error } = useChainsGetMasterCopiesV1Query({ chainId })

  const transformedData = useMemo(() => {
    if (!data) return undefined
    try {
      return data.map(extractMasterCopyInfo)
    } catch (err) {
      logError(Errors._619, err)
      return undefined
    }
  }, [data])

  const processedError = useMemo(() => {
    if (!error) return undefined
    return asError(error)
  }, [error])

  return [transformedData, processedError, isLoading]
}
