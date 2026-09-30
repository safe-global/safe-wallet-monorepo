import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { type ReactNode } from 'react'
import { chainBuilder } from '@/tests/builders/chains'
import NetworkInput from './index'

jest.mock('@/components/common/ChainIndicator', () => ({
  __esModule: true,
  default: ({ chainId }: { chainId: string }) => <span>Chain {chainId}</span>,
}))

const chainConfigs = [
  { ...chainBuilder().with({ chainId: '1', isTestnet: false }).build(), available: true },
  { ...chainBuilder().with({ chainId: '11155111', isTestnet: true }).build(), available: true },
]

const Wrapper = ({ children, defaultValue = '' }: { children: ReactNode; defaultValue?: string }) => {
  const methods = useForm({ mode: 'onChange', defaultValues: { network: defaultValue } })
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => null)}>
        {children}
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  )
}

describe('NetworkInput', () => {
  it('shows an "Optional" placeholder when not required and no network is selected', () => {
    render(
      <Wrapper>
        <NetworkInput name="network" chainConfigs={chainConfigs} />
      </Wrapper>,
    )

    expect(screen.getByText('Optional')).toBeInTheDocument()
  })

  it('does not show an "Optional" placeholder when required', () => {
    render(
      <Wrapper>
        <NetworkInput name="network" required chainConfigs={chainConfigs} />
      </Wrapper>,
    )

    expect(screen.queryByText('Optional')).not.toBeInTheDocument()
  })

  it('renders the chain indicator for the selected network', () => {
    render(
      <Wrapper defaultValue="1">
        <NetworkInput name="network" chainConfigs={chainConfigs} />
      </Wrapper>,
    )

    expect(screen.getByLabelText('Network')).toHaveTextContent('Chain 1')
    expect(screen.queryByText('Optional')).not.toBeInTheDocument()
  })

  it('marks the field as invalid when required and submitted empty', async () => {
    render(
      <Wrapper>
        <NetworkInput name="network" required chainConfigs={chainConfigs} />
      </Wrapper>,
    )

    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(screen.getByLabelText('Network')).toHaveAttribute('aria-invalid', 'true')
    })
    expect(screen.getByText('Network')).toHaveClass('text-destructive')
  })

  it('is not marked invalid when optional and submitted empty', async () => {
    render(
      <Wrapper>
        <NetworkInput name="network" chainConfigs={chainConfigs} />
      </Wrapper>,
    )

    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(screen.getByText('Network')).not.toHaveClass('text-destructive')
    })
    expect(screen.getByLabelText('Network')).not.toHaveAttribute('aria-invalid')
  })
})
