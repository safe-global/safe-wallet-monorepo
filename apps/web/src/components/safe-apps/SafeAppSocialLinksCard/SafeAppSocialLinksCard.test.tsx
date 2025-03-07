import { SafeAppFeatures } from '@safe-global/safe-gateway-typescript-sdk'
import { SafeAppSocialPlatforms, SafeAppAccessPolicyTypes } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'

import SafeAppSocialLinksCard from '@/components/safe-apps/SafeAppSocialLinksCard'
import { render, screen, waitFor } from '@/tests/test-utils'

const transactionBuilderSafeAppMock: SafeAppData = {
  id: 24,
  url: 'https://cloudflare-ipfs.com/ipfs/QmdVaZxDov4bVARScTLErQSRQoxgqtBad8anWuw3YPQHCs',
  name: 'Transaction Builder',
  iconUrl: 'https://cloudflare-ipfs.com/ipfs/QmdVaZxDov4bVARScTLErQSRQoxgqtBad8anWuw3YPQHCs/tx-builder.png',
  description: 'A Safe app to compose custom transactions',
  chainIds: ['1', '4', '56', '100', '137', '246', '73799'],
  provider: undefined,
  accessControl: {
    type: SafeAppAccessPolicyTypes.DomainAllowlist,
    value: ['https://gnosis-safe.io'],
  },
  tags: ['transaction-builder'],
  features: [SafeAppFeatures.BATCHED_TRANSACTIONS],
  socialProfiles: [],
  developerWebsite: '',
}

const developerWebsiteMock = 'http://transaction-builder-website'

const discordSocialProfileMock = {
  platform: SafeAppSocialPlatforms.DISCORD,
  url: 'http://tx-builder-discord',
}

const twitterSocialProfileMock = {
  platform: SafeAppSocialPlatforms.TWITTER,
  url: 'http://tx-builder-twitter',
}

const githubSocialProfileMock = {
  platform: SafeAppSocialPlatforms.GITHUB,
  url: 'http://tx-builder-github',
}

const telegramSocialProfileMock = {
  platform: SafeAppSocialPlatforms.TELEGRAM,
  url: 'http://tx-builder-telegram',
}

const socialProfilesMock = [
  discordSocialProfileMock,
  twitterSocialProfileMock,
  githubSocialProfileMock,
  telegramSocialProfileMock,
]

describe('SafeAppSocialLinksCard', () => {
  it('renders nothing if no social link is present in the safe app data', async () => {
    render(<SafeAppSocialLinksCard safeApp={transactionBuilderSafeAppMock} />)

    await waitFor(() => {
      expect(screen.queryByText('Something wrong with the Safe App?')).not.toBeInTheDocument()
    })
  })

  it('renders the SafeAppSocialLinksCard component if a social link is present in the safe app data', async () => {
    const safeAppData = {
      ...transactionBuilderSafeAppMock,
      developerWebsite: developerWebsiteMock,
    }
    render(<SafeAppSocialLinksCard safeApp={safeAppData} />)

    await waitFor(() => {
      expect(screen.queryByText('Something wrong with the Safe App?')).toBeInTheDocument()
      expect(screen.queryByText(developerWebsiteMock)).toBeInTheDocument()
    })
  })

  it('shows social links if they are present in the safe app data', async () => {
    const safeAppData = {
      ...transactionBuilderSafeAppMock,
      socialProfiles: socialProfilesMock,
    }
    render(<SafeAppSocialLinksCard safeApp={safeAppData} />)

    await waitFor(() => {
      expect(screen.queryByText('Something wrong with the Safe App?')).toBeInTheDocument()
      expect(screen.getByLabelText('Discord link')).toBeInTheDocument()
      expect(screen.getByLabelText('Twitter link')).toBeInTheDocument()
      expect(screen.getByLabelText('Github link')).toBeInTheDocument()
      expect(screen.getByLabelText('Telegram link')).toBeInTheDocument()
    })
  })

  it('shows both social links & developer website if they are present in the safe app data', async () => {
    const safeAppData = {
      ...transactionBuilderSafeAppMock,
      socialProfiles: socialProfilesMock,
      developerWebsite: developerWebsiteMock,
    }
    render(<SafeAppSocialLinksCard safeApp={safeAppData} />)

    await waitFor(() => {
      expect(screen.queryByText('Something wrong with the Safe App?')).toBeInTheDocument()
      expect(screen.queryByText(developerWebsiteMock)).toBeInTheDocument()
      expect(screen.getByLabelText('Discord link')).toBeInTheDocument()
      expect(screen.getByLabelText('Twitter link')).toBeInTheDocument()
      expect(screen.getByLabelText('Github link')).toBeInTheDocument()
      expect(screen.getByLabelText('Telegram link')).toBeInTheDocument()
    })
  })

  it('only renders the defined social links', async () => {
    const safeAppData = {
      ...transactionBuilderSafeAppMock,
      // only discord social link is present
      socialProfiles: [discordSocialProfileMock],
    }
    render(<SafeAppSocialLinksCard safeApp={safeAppData} />)

    await waitFor(() => {
      expect(screen.queryByText('Something wrong with the Safe App?')).toBeInTheDocument()
      expect(screen.queryByLabelText('Discord link')).toBeInTheDocument()
      expect(screen.queryByLabelText('Twitter link')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Github link')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Telegram link')).not.toBeInTheDocument()
    })
  })
})
