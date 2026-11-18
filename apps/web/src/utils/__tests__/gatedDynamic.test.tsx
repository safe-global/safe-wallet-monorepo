import { render, screen } from '@testing-library/react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { gatedDynamic } from '../gatedDynamic'

jest.mock('@/hooks/useChains')

const mockUseHasFeature = jest.mocked(useHasFeature)

const Greeting = ({ name }: { name: string }) => <p>Hello {name}</p>

describe('gatedDynamic', () => {
  beforeEach(() => {
    mockUseHasFeature.mockReset()
  })

  it('should, when the flag is off, render nothing and not load the component', () => {
    mockUseHasFeature.mockReturnValue(false)
    const loader = jest.fn(() => Promise.resolve({ default: Greeting }))
    const GatedGreeting = gatedDynamic(FEATURES.RECOVERY, loader)

    const { container } = render(<GatedGreeting name="Safe" />)

    expect(container).toBeEmptyDOMElement()
    expect(loader).not.toHaveBeenCalled()
  })

  it('should, while the chain config is loading, render nothing and not load the component', () => {
    mockUseHasFeature.mockReturnValue(undefined)
    const loader = jest.fn(() => Promise.resolve({ default: Greeting }))
    const GatedGreeting = gatedDynamic(FEATURES.RECOVERY, loader)

    const { container } = render(<GatedGreeting name="Safe" />)

    expect(container).toBeEmptyDOMElement()
    expect(loader).not.toHaveBeenCalled()
  })

  it('should, when the flag is on, render the loaded component with its props', async () => {
    mockUseHasFeature.mockReturnValue(true)
    const GatedGreeting = gatedDynamic(FEATURES.RECOVERY, () => Promise.resolve({ default: Greeting }))

    render(<GatedGreeting name="Safe" />)

    expect(await screen.findByText('Hello Safe')).toBeInTheDocument()
    expect(mockUseHasFeature).toHaveBeenCalledWith(FEATURES.RECOVERY)
  })

  it('should, when the flag turns off after the component loaded, remove the component', async () => {
    mockUseHasFeature.mockReturnValue(true)
    const GatedGreeting = gatedDynamic(FEATURES.RECOVERY, () => Promise.resolve({ default: Greeting }))
    const { rerender } = render(<GatedGreeting name="Safe" />)
    expect(await screen.findByText('Hello Safe')).toBeInTheDocument()

    mockUseHasFeature.mockReturnValue(false)
    rerender(<GatedGreeting name="Safe" />)

    expect(screen.queryByText('Hello Safe')).not.toBeInTheDocument()
  })
})
