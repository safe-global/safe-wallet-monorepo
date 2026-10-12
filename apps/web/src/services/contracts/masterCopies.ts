import type { MasterCopy as MasterCopyType } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { Errors, logError } from '@/services/exceptions'

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

  return {
    address: mc.address,
    version: !isCircles ? mc.version : mc.version.substring(0, dashIndex),
    deployer: !isCircles ? MasterCopyDeployer.GNOSIS : MasterCopyDeployer.CIRCLES,
    deployerRepoUrl: !isCircles
      ? 'https://github.com/gnosis/safe-contracts/releases'
      : 'https://github.com/CirclesUBI/safe-contracts/releases',
  }
}

/** `undefined` when CGW returned a payload we cannot interpret. */
export const transformMasterCopies = (masterCopies: MasterCopyType[]): MasterCopy[] | undefined => {
  try {
    return masterCopies.map(extractMasterCopyInfo)
  } catch (e) {
    logError(Errors._619, e)
    return undefined
  }
}
