import { useEffect, useState } from 'react'
import { keccak256 } from 'ethers'
import useSafeInfo from './useSafeInfo'
import { useWeb3ReadOnly } from './wallets/web3'
import { isValidMasterCopy } from '@safe-global/utils/services/contracts/safeContracts'
import { getL2MasterCopyVersionByCodeHash } from '@safe-global/utils/services/contracts/deployments'
import { getSafeMigrationDeployment } from '@safe-global/safe-deployments'
import { SAFE_TO_L2_MIGRATION_VERSION } from '@safe-global/utils/config/constants'
import semverLt from 'semver/functions/lt'

export type UpgradeableMasterCopyInfo = {
  isUpgradeable: boolean | undefined
  version?: string
}

const useIsUpgradeableMasterCopy = (): UpgradeableMasterCopyInfo => {
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
  const [upgradeableVersion, setUpgradeableVersion] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!shouldCheck) {
      setIsUpgradeable(undefined)
      setUpgradeableVersion(undefined)
      return
    }

    if (!provider || !masterCopyAddress) {
      setIsUpgradeable(undefined)
      setUpgradeableVersion(undefined)
      return
    }

    let cancelled = false
    setIsUpgradeable(undefined)
    setUpgradeableVersion(undefined)

    const fetchCodeHash = async () => {
      try {
        const code = await provider.getCode(masterCopyAddress)

        if (cancelled) {
          return
        }

        if (!code || code === '0x') {
          setIsUpgradeable(false)
          setUpgradeableVersion(undefined)
          return
        }

        const codeHash = keccak256(code)
        const l2Version = getL2MasterCopyVersionByCodeHash(codeHash)
        const normalizedVersion = l2Version?.split('+')[0]
        const canMigrate =
          !!l2Version &&
          supportsL2Migration &&
          !!normalizedVersion &&
          semverLt(normalizedVersion, SAFE_TO_L2_MIGRATION_VERSION)

        setUpgradeableVersion(l2Version)
        setIsUpgradeable(canMigrate)
      } catch (error) {
        console.error('Failed to determine Safe master copy code hash', error)

        if (!cancelled) {
          setIsUpgradeable(false)
          setUpgradeableVersion(undefined)
        }
      }
    }

    fetchCodeHash()

    return () => {
      cancelled = true
    }
  }, [shouldCheck, provider, masterCopyAddress, supportsL2Migration])

  return { isUpgradeable, version: upgradeableVersion }
}

export default useIsUpgradeableMasterCopy
