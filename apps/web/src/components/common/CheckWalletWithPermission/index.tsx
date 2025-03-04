import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { useMemo, type ReactElement } from 'react'
import useWallet from '@/hooks/wallets/useWallet'
import useConnectWallet from '../ConnectWallet/useConnectWallet'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { Tooltip } from '@mui/material'
import useSafeInfo from '@/hooks/useSafeInfo'
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

enum Message {
  WalletNotConnected = 'Please connect your wallet',
  SDKNotInitialized = 'SDK is not initialized yet',
  NotSafeOwner = 'Your connected wallet is not a signer of this Safe Account',
  SafeNotActivated = 'You need to activate the Safe before transacting',
}

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

  const message = useMemo(() => {
    if (!wallet) {
      return Message.WalletNotConnected
    }

    if (!sdk && safeLoaded) {
      return Message.SDKNotInitialized
    }

    if (isUndeployedSafe && !allowUndeployedSafe) {
      return Message.SafeNotActivated
    }

    if (!hasPermission) {
      return Message.NotSafeOwner
    }
  }, [allowUndeployedSafe, hasPermission, isUndeployedSafe, sdk, wallet, safeLoaded])

  if (checkNetwork && isWrongChain) return children(false)
  if (!message) return children(true)
  if (noTooltip) return children(false)

  return (
    <Tooltip title={message}>
      <span onClick={wallet ? undefined : connectWallet}>{children(false)}</span>
    </Tooltip>
  )
}

export default CheckWalletWithPermission
