import React from 'react'
import { createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { optimism, sepolia } from '@reown/appkit/networks'

const projectId = 'YOUR_PROJECT_ID'

const metadata = {
  name: 'Super Accounts',
  description: 'My Website description',
  url: 'https://account.superchain.eco',
  icons: ['https://avatars.mywebsite.com/'],
}
createAppKit({
  adapters: [new EthersAdapter()],
  networks: [optimism],
  metadata,
  projectId,
  features: {
    analytics: true,
  },
})
// function ReownContext() {
//   return <YourApp />
// }

// export default ReownContext
