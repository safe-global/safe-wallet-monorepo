import { type ReactElement } from 'react'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { ConnectionCenterView } from '@views/components/common/ConnectWallet/ConnectionCenterView'

const ConnectionCenter = (): ReactElement => {
  const connectWallet = useConnectWallet()

  const handleConnect = () => {
    connectWallet()
  }

  return <ConnectionCenterView onConnect={handleConnect} />
}

export default ConnectionCenter
