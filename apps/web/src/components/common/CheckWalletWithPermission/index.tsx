import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { useMemo, type ReactElement } from 'react'
import useWallet from '@/hooks/wallets/useWallet'
import useConnectWallet from '../ConnectWallet/useConnectWallet'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import useSafeInfo from '@/hooks/useSafeInfo'
import { CheckWalletView, type CheckWalletReason } from '@views/components/common/CheckWallet/CheckWalletView'
import type { Permission, PermissionProps } from '@/permissions/config'
import { useHasPermission } from '@/permissions/hooks/useHasPermission'

type CheckWalletWithPermissionProps<
  P extends Permission,
  PProps = PermissionProps<P> extends undefined ? { permissionProps?: never } : { permissionProps: PermissionProps<P> },
> = {
  children: (ok: boolean) => ReactElement
  permission: P
  noTooltip?: boolean
  checkNetwork?: boolean
  allowUndeployedSafe?: boolean
} & PProps

const CheckWalletWithPermission = <P extends Permission>({
  children,
  permission,
  permissionProps,
  noTooltip,
  checkNetwork = false,
  allowUndeployedSafe = false,
}: CheckWalletWithPermissionProps<P>): ReactElement => {
  const wallet = useWallet()
  const connectWallet = useConnectWallet()
  const isWrongChain = useIsWrongChain()
  const sdk = useSafeSDK()
  const hasPermission = useHasPermission(
    permission,
    ...((permissionProps ? [permissionProps] : []) as PermissionProps<P> extends undefined
      ? []
      : [props: PermissionProps<P>]),
  )

  const { safe, safeLoaded } = useSafeInfo()

  const isUndeployedSafe = !safe.deployed

  const reason = useMemo((): CheckWalletReason | undefined => {
    if (!wallet) {
      return 'walletNotConnected'
    }

    if (!sdk && safeLoaded) {
      return 'sdkNotInitialized'
    }

    if (isUndeployedSafe && !allowUndeployedSafe) {
      return 'safeNotActivated'
    }

    if (!hasPermission) {
      return 'notSafeOwner'
    }
  }, [allowUndeployedSafe, hasPermission, isUndeployedSafe, sdk, wallet, safeLoaded])

  if (checkNetwork && isWrongChain) return children(false)
  if (!reason) return children(true)
  if (noTooltip) return children(false)

  return (
    <CheckWalletView reason={reason} onTriggerClick={wallet ? undefined : connectWallet}>
      {children(false)}
    </CheckWalletView>
  )
}

export default CheckWalletWithPermission
