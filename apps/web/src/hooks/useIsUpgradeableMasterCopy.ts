import { useEffect, useState } from 'react'
import { keccak256 } from 'ethers'
import useSafeInfo from './useSafeInfo'
import { useWeb3ReadOnly } from './wallets/web3'
import { isValidMasterCopy } from '@safe-global/utils/services/contracts/safeContracts'
import { isL2MasterCopyCodeHash } from '@safe-global/utils/services/contracts/deployments'
import { getSafeMigrationDeployment } from '@safe-global/safe-deployments'
import { SAFE_TO_L2_MIGRATION_VERSION } from '@safe-global/utils/config/constants'

const useIsUpgradeableMasterCopy = (): boolean | undefined => {
  const { safe, safeLoaded } = useSafeInfo()
  const provider = useWeb3ReadOnly()

  const shouldCheck = safeLoaded && !isValidMasterCopy(safe.implementationVersionState)
  const supportsL2Migration = Boolean(
    getSafeMigrationDeployment({
      version: SAFE_TO_L2_MIGRATION_VERSION,
      network: safe.chainId,
    })?.networkAddresses[safe.chainId],
  )
  const masterCopyAddress = safe.implementation.value

  const [isUpgradeable, setIsUpgradeable] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    if (!shouldCheck) {
      setIsUpgradeable(undefined)
      return
    }

    if (!provider || !masterCopyAddress) {
      setIsUpgradeable(undefined)
      return
    }

    let cancelled = false
    setIsUpgradeable(undefined)

    const fetchCodeHash = async () => {
      try {
        const code = await provider.getCode(masterCopyAddress)

        if (cancelled) {
          return
        }

        if (!code || code === '0x') {
          setIsUpgradeable(false)
          return
        }

        const codeHash = keccak256(code)
        setIsUpgradeable(isL2MasterCopyCodeHash(codeHash) && supportsL2Migration)
      } catch (error) {
        console.error('Failed to determine Safe master copy code hash', error)

        if (!cancelled) {
          setIsUpgradeable(false)
        }
      }
    }

    fetchCodeHash()

    return () => {
      cancelled = true
    }
  }, [shouldCheck, provider, masterCopyAddress, supportsL2Migration])

  return isUpgradeable
}

export default useIsUpgradeableMasterCopy
