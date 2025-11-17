import { connectSession, type Session } from '@openlv/session'
import { useState } from 'react'
import type { Address } from 'viem'
import styles from './styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'

import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import useSafeWalletProvider from '@/services/safe-wallet-provider/useSafeWalletProvider'

const trimAddress = (address: Address | undefined | null) => {
  if (!(typeof address === 'string')) return address

  return `${address.slice(0, 5)}...${address.slice(-4)}`
}

let session: Session | undefined = undefined

const ConnectComponent = () => {
  const [url, setUrl] = useState<string | undefined>(undefined)

  const provider = useSafeWalletProvider()

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

            session = await connectSession(url, async (message) => {
              console.log('received message', message)
              const { method } = message as { method: keyof typeof provider }

              console.log('method', method)

              return await provider[method as any]()
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
  const { safeLoading, safeLoaded, safeAddress, safe } = useSafeInfo()

  if (safeLoading) return <div>Connecting to Safe</div>

  if (!safeLoaded) return <div>Connect to a wallet to start</div>

  return (
    <div className={styles.connected}>
      <div className={styles.wallet}>
        <div>Connected to {trimAddress(safeAddress as Address)}</div>
      </div>

      <ConnectComponent />
    </div>
  )
}

export const Outter = () => {
  return <Connected />
}

export const TryItOut = () => {
  const inBrowser = typeof window !== 'undefined'

  return <div suppressHydrationWarning>{inBrowser && <Outter />}</div>
}
