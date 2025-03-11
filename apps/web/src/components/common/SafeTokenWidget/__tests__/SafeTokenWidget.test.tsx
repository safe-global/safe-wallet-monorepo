import * as nextNav from 'next/navigation'
import useChainId from '@/hooks/useChainId'
import { render, waitFor } from '@/tests/test-utils'
import SafeTokenWidget from '..'
import { toBeHex } from 'ethers'
import useSafeTokenAllocation, { useSafeVotingPower } from '@/hooks/useSafeTokenAllocation'
import * as safePass from '@/store/api/safePass'
import type { CampaignLeaderboardEntry } from '@/store/api/safePass'

jest.mock('@/hooks/useChainId')

jest.mock('@/hooks/useSafeTokenAllocation')

describe('SafeTokenWidget', () => {
  const fakeSafeAddress = toBeHex('0x1', 20)
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.spyOn(nextNav, 'useSearchParams').mockImplementation(
      () =>
        ({
          get: () => fakeSafeAddress,
        }) as any,
    )

    jest.spyOn(safePass, 'useGetOwnGlobalCampaignRankQuery').mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: jest.fn(),
    })
    ;(useChainId as jest.Mock).mockImplementation(jest.fn(() => '1'))
  })

  it('Should render nothing for unsupported chains', () => {
    ;(useChainId as jest.Mock).mockImplementation(jest.fn(() => '100'))
    ;(useSafeTokenAllocation as jest.Mock).mockImplementation(() => [[], , false])
    ;(useSafeVotingPower as jest.Mock).mockImplementation(() => [BigInt(0), , false])

    const result = render(<SafeTokenWidget />)
    expect(result.baseElement).toContainHTML('<body><div /></body>')
  })

  it('Should display 0 if Safe has no SAFE token', async () => {
    ;(useSafeTokenAllocation as jest.Mock).mockImplementation(() => [[], , false])
    ;(useSafeVotingPower as jest.Mock).mockImplementation(() => [BigInt(0), , false])

    const result = render(<SafeTokenWidget />)
    await waitFor(() => expect(result.baseElement).toHaveTextContent('0'))
  })

  it('Should display the value formatted correctly', async () => {
    ;(useSafeTokenAllocation as jest.Mock).mockImplementation(() => [[], , false])
    ;(useSafeVotingPower as jest.Mock).mockImplementation(() => [BigInt('472238796133701648384'), , false])

    const result = render(<SafeTokenWidget />)
    await waitFor(() => {
      expect(result.baseElement).toHaveTextContent('472')
      expect(result.baseElement).not.toHaveTextContent('472.2')
    })
  })

  it('Should render a link to the governance app', async () => {
    ;(useSafeTokenAllocation as jest.Mock).mockImplementation(() => [[], , false])
    ;(useSafeVotingPower as jest.Mock).mockImplementation(() => [BigInt(420000), , false])

    const result = render(<SafeTokenWidget />)
    await waitFor(() => {
      expect(result.baseElement).toContainHTML(
        `href="/apps/open?safe=${fakeSafeAddress}&appUrl=${encodeURIComponent(
          'https://safe-dao-governance.dev.5afe.dev',
        )}`,
      )
    })
  })

  it('Should render the Safe{Pass} points', async () => {
    ;(useSafeTokenAllocation as jest.Mock).mockImplementation(() => [[], , false])
    ;(useSafeVotingPower as jest.Mock).mockImplementation(() => [BigInt(420 * 10 ** 18), , false])
    const mockCampaignRank: CampaignLeaderboardEntry = {
      boost: '2.0',
      holder: fakeSafeAddress,
      position: 421,
      totalBoostedPoints: 138,
      totalPoints: 69,
    }
    jest.spyOn(safePass, 'useGetOwnGlobalCampaignRankQuery').mockReturnValue({
      data: mockCampaignRank,
      isLoading: false,
      refetch: jest.fn(),
    })
    const result = render(<SafeTokenWidget />)
    await waitFor(() => {
      expect(result.queryByText('420')).toBeInTheDocument() // Safe Voting power
      expect(result.queryByText('138')).toBeInTheDocument() // Safe Pass points
    })
  })
})
