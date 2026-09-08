import type { MasterCopy as MasterCopyType } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useChainId from '@/hooks/useChainId'
import { Errors } from '@/services/exceptions'
import useLogError from '@/hooks/useLogError'
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

  const { transformedData, transformError } = useMemo<{
    transformedData?: MasterCopy[]
    transformError?: unknown
  }>(() => {
    if (!data) return {}
    try {
      return { transformedData: data.map(extractMasterCopyInfo) }
    } catch (err) {
      return { transformError: err }
    }
  }, [data])

  // Reported outside the memo: a memo is a cache hint, not a guarantee of a
  // single evaluation, and re-running it must not re-report the same bad payload.
  useLogError(Errors._619, transformError)

  const processedError = useMemo(() => {
    if (!error) return undefined
    return asError(error)
  }, [error])

  return [transformedData, processedError, isLoading]
}
