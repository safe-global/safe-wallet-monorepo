import * as nextNav from 'next/navigation'
import useChainId from '@/hooks/useChainId'
import { render, waitFor } from '@/tests/test-utils'
import SafeTokenWidget from '..'
import { toBeHex } from 'ethers'
import { AppRoutes } from '@/config/routes'
import useSafeTokenAllocation, { useSafeVotingPower } from '@/hooks/useSafeTokenAllocation'
import * as safePass from '@/store/api/safePass'

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
        `href="${AppRoutes.apps.open}?safe=${fakeSafeAddress}&appUrl=${encodeURIComponent(
          'https://safe-dao-governance.dev.5afe.dev',
        )}`,
      )
    })
  })
})
