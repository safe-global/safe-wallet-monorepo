import { sameAddress } from '@safe-global/utils/utils/addresses'

export const isInDeployments = (address: string, deployments: string | string[] | undefined): boolean => {
  if (Array.isArray(deployments)) {
    return deployments.some((deployment) => sameAddress(deployment, address))
  }
  return sameAddress(address, deployments)
}