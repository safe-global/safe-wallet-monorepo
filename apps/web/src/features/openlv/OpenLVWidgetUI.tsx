import { openlv } from '@openlv/connector'
import { connectSession, type Session } from '@openlv/session'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import type { Address, EIP1193Provider } from 'viem'
import { createConfig, http, useAccount, useClient, useConnections, useDisconnect, WagmiProvider } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import styles from './styles.module.css'

const queryClient = new QueryClient()

const config = createConfig({
  chains: [mainnet],
  connectors: [openlv()],
  transports: {
    [mainnet.id]: http(),
  },
})

const trimAddress = (address: Address | undefined | null) => {
  if (!(typeof address === 'string')) return address

  return `${address.slice(0, 5)}...${address.slice(-4)}`
}

let session: Session | undefined = undefined

const ConnectComponent = () => {
  const walletClient = useClient()
  const connections = useConnections()
  const [url, setUrl] = useState<string | undefined>(undefined)

  if (!walletClient) return <div>No walletclient found</div>

  return (
    <>
      <div>You can connect to a dApp by entering its connection URL and hitting connect.</div>
      <div className={styles.connectionUI}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="openlv://..."
          className={styles.connectionInput}
        />

        <button
          className={`${styles.button} ${styles.connect}`}
          type="button"
          onClick={async () => {
            if (!url) return

            console.log('connecting to ', url)
            const client = (await connections[0]?.connector?.getProvider()) as EIP1193Provider

            session = await connectSession(url, async (message) => {
              console.log('received message', message)
              const { method } = message as { method: string }

              console.log('wc', walletClient)

              console.log('method', method)

              if (method === 'eth_accounts') {
                const result = await client.request({
                  method: 'eth_accounts',
                  params: [] as never,
                })

                console.log('result from calling wallet', result)

                if (result) return result
              }

              if (['personal_sign'].includes(method)) {
                const result = await client.request(message as never)

                console.log('result from calling wallet', result)

                return result
              }

              return { result: 'success' }
            })
            console.log('session', session)

            await session.connect()
            console.log('session connected', session)
          }}
        >
          Connect
        </button>
      </div>
    </>
  )
}

const Connected = () => {
  const { disconnect } = useDisconnect()
  const { address, connector } = useAccount()

  return (
    <div className={styles.connected}>
      <div className={styles.wallet}>
        {connector?.icon && <img height={24} width={24} src={connector.icon} alt={`${connector.name} icon`} />}
        <div>Connected to {trimAddress(address)}</div>
      </div>
      <button
        type="button"
        onClick={() => {
          disconnect()
        }}
        className={styles.button}
      >
        Disconnect
      </button>

      {connector?.type !== 'openLv' && <ConnectComponent />}
    </div>
  )
}

export const Outter = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <Connected />
      </WagmiProvider>
    </QueryClientProvider>
  )
}

export const TryItOut = () => {
  const inBrowser = typeof window !== 'undefined'

  return <div suppressHydrationWarning>{inBrowser && <Outter />}</div>
}
