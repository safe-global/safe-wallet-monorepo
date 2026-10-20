import { render, screen } from '@testing-library/react'
import { captureRenderError } from '@/services/observability'
import ParsingErrorBoundary from './ParsingErrorBoundary'

jest.mock('@/services/observability', () => ({ captureRenderError: jest.fn() }))

const Broken = (): never => {
  throw new Error('Cannot render decoded value')
}

describe('ParsingErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders its children when nothing throws', () => {
    render(
      <ParsingErrorBoundary>
        <div>Decoded data</div>
      </ParsingErrorBoundary>,
    )

    expect(screen.getByText('Decoded data')).toBeInTheDocument()
  })

  it('shows the parsing fallback and keeps the siblings when a child throws', () => {
    render(
      <>
        <ParsingErrorBoundary>
          <Broken />
        </ParsingErrorBoundary>
        <div>Signers</div>
      </>,
    )

    expect(screen.getByText('Error parsing data')).toBeInTheDocument()
    expect(screen.getByText('Signers')).toBeInTheDocument()
  })

  it('reports the render error', () => {
    render(
      <ParsingErrorBoundary>
        <Broken />
      </ParsingErrorBoundary>,
    )

    expect(captureRenderError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Cannot render decoded value' }),
      expect.any(String),
    )
  })
})
