import * as useChains from '@/hooks/useChains'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { FormProvider, useForm } from 'react-hook-form'
import NetworkMultiSelector from '../NetworkMultiSelector'
import { chainBuilder } from '@/tests/builders/chains'
import { render, waitFor } from '@/tests/test-utils'
import { act } from 'react'
import userEvent from '@testing-library/user-event'
import * as router from 'next/router'
import { FEATURES } from '@safe-global/utils/utils/chains'

const TestForm = ({ isAdvancedFlow = false }: { isAdvancedFlow?: boolean }) => {
  const formMethods = useForm<{ networks: ChainInfo[] }>({
    mode: 'all',
    defaultValues: {
      networks: [],
    },
  })

  return (
    <FormProvider {...formMethods}>
      <form>
        <NetworkMultiSelector name="networks" isAdvancedFlow={isAdvancedFlow} />
      </form>
    </FormProvider>
  )
}

describe('NetworkMultiSelector', () => {
  const mockChains = [
    chainBuilder()
      .with({ chainId: '1' })
      .with({ chainName: 'Ethereum' })
      .with({ shortName: 'eth' })
      .with({ features: [FEATURES.COUNTERFACTUAL, FEATURES.MULTI_CHAIN_SAFE_CREATION] as any })
      .with({ recommendedMasterCopyVersion: '1.4.1' })
      .build(),
    chainBuilder()
      .with({ chainId: '10' })
      .with({ chainName: 'Optimism' })
      .with({ shortName: 'oeth' })
      .with({ features: [FEATURES.COUNTERFACTUAL, FEATURES.MULTI_CHAIN_SAFE_CREATION] as any })
      .with({ recommendedMasterCopyVersion: '1.4.1' })
      .build(),
    chainBuilder()
      .with({ chainId: '100' })
      .with({ chainName: 'Gnosis Chain' })
      .with({ shortName: 'gno' })
      .with({ features: [FEATURES.COUNTERFACTUAL, FEATURES.MULTI_CHAIN_SAFE_CREATION] as any })
      .with({ recommendedMasterCopyVersion: '1.4.1' })
      .build(),
    chainBuilder()
      .with({ chainId: '324' })
      .with({ chainName: 'ZkSync Era' })
      .with({ shortName: 'zksync' })
      .with({ features: [FEATURES.COUNTERFACTUAL] as any })
      .with({ recommendedMasterCopyVersion: '1.4.1' })
      .build(),
    chainBuilder()
      .with({ chainId: '480' })
      .with({ chainName: 'Worldchain' })
      .with({ shortName: 'wc' })
      .with({ features: [FEATURES.COUNTERFACTUAL, FEATURES.MULTI_CHAIN_SAFE_CREATION] as any })
      .with({ recommendedMasterCopyVersion: '1.4.1' })
      .build(),
  ]

  it('should be possible to select and deselect networks', async () => {
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(mockChains[0])
    const { getByRole, queryByText, getByText, getByTestId, getAllByRole } = render(<TestForm />, {
      initialReduxState: {
        chains: {
          data: mockChains,
          loading: false,
        },
      },
    })
    const input = getByRole('combobox')

    act(() => {
      userEvent.click(input)
    })

    // All options are visible and enabled initially
    await waitFor(() => {
      const allOptions = getAllByRole('option')
      expect(allOptions).toHaveLength(5)
      allOptions.forEach((option) => expect(option).toHaveAttribute('aria-disabled', 'false'))
      expect(queryByText('Ethereum')).toBeVisible()
      expect(queryByText('Optimism')).toBeVisible()
      expect(queryByText('Gnosis Chain')).toBeVisible()
      expect(queryByText('ZkSync Era')).toBeVisible()
      expect(queryByText('Worldchain')).toBeVisible()
    })

    // Select Ethereum => zkSync Era should be disabled
    act(() => {
      userEvent.click(getByText('Ethereum'))
    })

    await waitFor(() => {
      const allOptions = getAllByRole('option')
      expect(allOptions).toHaveLength(5)
      expect(allOptions[0]).toHaveAttribute('aria-disabled', 'false')
      expect(allOptions[1]).toHaveAttribute('aria-disabled', 'false')
      expect(allOptions[2]).toHaveAttribute('aria-disabled', 'false')
      // ZkSync era is now disabled
      expect(allOptions[3]).toHaveAttribute('aria-disabled', 'true')
      expect(allOptions[3]).toHaveTextContent('ZkSync Era')
      expect(allOptions[4]).toHaveAttribute('aria-disabled', 'false')
    })

    // Unselect Ethereum by clicking the x icon => zkSync Era should be enabled again
    act(() => {
      userEvent.click(getByTestId('CancelIcon'))
    })

    await waitFor(() => {
      const allOptions = getAllByRole('option')
      expect(allOptions).toHaveLength(5)
      allOptions.forEach((option) => expect(option).toHaveAttribute('aria-disabled', 'false'))
    })

    // Select Multiple
    act(() => {
      const allOptions = getAllByRole('option')
      userEvent.click(allOptions[0])
      userEvent.click(allOptions[1])
      userEvent.click(allOptions[2])
    })

    await waitFor(() => {
      const allOptions = getAllByRole('option')
      expect(allOptions).toHaveLength(5)
      expect(allOptions[0]).toHaveAttribute('aria-selected', 'true')
      expect(allOptions[1]).toHaveAttribute('aria-selected', 'true')
      expect(allOptions[2]).toHaveAttribute('aria-selected', 'true')
      // ZkSync era is now disabled
      expect(allOptions[3]).toHaveAttribute('aria-selected', 'false')
      expect(allOptions[4]).toHaveAttribute('aria-selected', 'false')
    })

    // Close input
    act(() => {
      userEvent.click(input)
    })

    // Only the selected chains remain visible
    await waitFor(() => {
      expect(getByText('Ethereum')).toBeVisible()
      expect(getByText('Optimism')).toBeVisible()
      expect(getByText('Gnosis Chain')).toBeVisible()
      expect(queryByText('Worldchain')).toBeNull()
    })

    // remove all
    act(() => {
      userEvent.click(getByTestId('CloseIcon'))
    })

    // No more chains are visible
    await waitFor(() => {
      expect(queryByText('Ethereum')).toBeNull()
      expect(queryByText('Optimism')).toBeNull()
      expect(queryByText('Gnosis Chain')).toBeNull()
      expect(queryByText('Worldchain')).toBeNull()
      expect(queryByText('Select at least one network')).toBeVisible()
    })
  })

  it('should disable all other chains when zkSync gets selected first', async () => {
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(mockChains[0])
    const { getByRole, queryByText, getByText, getAllByRole } = render(<TestForm />, {
      initialReduxState: {
        chains: {
          data: mockChains,
          loading: false,
        },
      },
    })
    const input = getByRole('combobox')

    act(() => {
      userEvent.click(input)
    })

    // All options are visible and enabled initially
    await waitFor(() => {
      const allOptions = getAllByRole('option')
      expect(allOptions).toHaveLength(5)
      allOptions.forEach((option) => expect(option).toHaveAttribute('aria-disabled', 'false'))
      expect(queryByText('Ethereum')).toBeVisible()
      expect(queryByText('Optimism')).toBeVisible()
      expect(queryByText('Gnosis Chain')).toBeVisible()
      expect(queryByText('ZkSync Era')).toBeVisible()
      expect(queryByText('Worldchain')).toBeVisible()
    })

    // Select zkSync
    act(() => {
      userEvent.click(getByText('ZkSync Era'))
    })

    // All other networks get disabled
    await waitFor(() => {
      const allOptions = getAllByRole('option')
      expect(allOptions).toHaveLength(5)
      expect(allOptions[0]).toHaveAttribute('aria-disabled', 'true')
      expect(allOptions[1]).toHaveAttribute('aria-disabled', 'true')
      expect(allOptions[2]).toHaveAttribute('aria-disabled', 'true')
      expect(allOptions[3]).toHaveAttribute('aria-disabled', 'false')
      expect(allOptions[4]).toHaveAttribute('aria-disabled', 'true')
    })
  })

  it('should switch the router chain if a new network is selected', async () => {
    const mockRouterReplace = jest.fn()
    jest.spyOn(router, 'useRouter').mockReturnValue({
      replace: mockRouterReplace,
      query: { chain: 'eth' },
      pathname: '/new-safe/create',
    } as unknown as router.NextRouter)

    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(mockChains[0])
    const { getByRole, queryByText, getByText, getAllByRole } = render(<TestForm />, {
      initialReduxState: {
        chains: {
          data: mockChains,
          loading: false,
        },
      },
    })
    const input = getByRole('combobox')

    act(() => {
      userEvent.click(input)
    })

    // All options are visible and enabled initially
    await waitFor(() => {
      const allOptions = getAllByRole('option')
      expect(allOptions).toHaveLength(5)
      allOptions.forEach((option) => expect(option).toHaveAttribute('aria-disabled', 'false'))
      expect(queryByText('Ethereum')).toBeVisible()
      expect(queryByText('Optimism')).toBeVisible()
      expect(queryByText('Gnosis Chain')).toBeVisible()
      expect(queryByText('ZkSync Era')).toBeVisible()
      expect(queryByText('Worldchain')).toBeVisible()
    })

    // Select first Optimism and Gnosis Chain
    act(() => {
      userEvent.click(getByText('Optimism'))
      userEvent.click(getByText('Gnosis Chain'))
    })

    // As we were connected to Ethereum and had only one selected network different from Ethereum, we should switch the chain to Optimism
    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith({
        pathname: '/new-safe/create',
        query: {
          chain: 'oeth',
        },
      })
    })
  })

  it('should only allow single chain selection if advanced flow', async () => {
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(mockChains[0])
    const { getByRole, queryByText, getByText, getByTestId, getAllByRole } = render(<TestForm isAdvancedFlow />, {
      initialReduxState: {
        chains: {
          data: mockChains,
          loading: false,
        },
      },
    })
    const input = getByRole('combobox')

    act(() => {
      userEvent.click(input)
    })

    // All options are visible and enabled initially
    await waitFor(() => {
      const allOptions = getAllByRole('option')
      expect(allOptions).toHaveLength(5)
      allOptions.forEach((option) => expect(option).toHaveAttribute('aria-disabled', 'false'))
      expect(queryByText('Ethereum')).toBeVisible()
      expect(queryByText('Optimism')).toBeVisible()
      expect(queryByText('Gnosis Chain')).toBeVisible()
      expect(queryByText('ZkSync Era')).toBeVisible()
      expect(queryByText('Worldchain')).toBeVisible()
    })

    // Select Ethereum => all other options get disabled
    act(() => {
      userEvent.click(getByText('Ethereum'))
    })

    await waitFor(() => {
      const allOptions = getAllByRole('option')
      expect(allOptions).toHaveLength(5)
      expect(allOptions[0]).toHaveAttribute('aria-disabled', 'false')
      expect(allOptions[1]).toHaveAttribute('aria-disabled', 'true')
      expect(allOptions[2]).toHaveAttribute('aria-disabled', 'true')
      expect(allOptions[3]).toHaveAttribute('aria-disabled', 'true')
      expect(allOptions[4]).toHaveAttribute('aria-disabled', 'true')
    })

    // Unselect Ethereum by clicking the x icon => all are enabled again
    act(() => {
      userEvent.click(getByTestId('CancelIcon'))
    })

    await waitFor(() => {
      const allOptions = getAllByRole('option')
      expect(allOptions).toHaveLength(5)
      allOptions.forEach((option) => expect(option).toHaveAttribute('aria-disabled', 'false'))
    })
  })
})
