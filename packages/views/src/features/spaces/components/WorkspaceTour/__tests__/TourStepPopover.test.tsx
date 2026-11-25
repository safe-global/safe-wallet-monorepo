import { act, fireEvent, render, screen, within } from '@/tests/test-utils'
import TourStepPopover from '@safe-global/views/features/spaces/components/WorkspaceTour/TourStepPopover'

const anchor = {
  getBoundingClientRect: () => ({ x: 40, y: 40, top: 40, left: 40, width: 200, height: 40, right: 240, bottom: 80 }),
}

const renderStep = (
  content = { title: 'Workspace contacts', body: 'Shared with everyone.', tip: 'Edit any time.' },
) => {
  const onClose = jest.fn()
  render(
    <>
      <TourStepPopover
        anchor={anchor}
        placement={{ side: 'bottom', align: 'start' }}
        content={content}
        progress={{ current: 5, total: 7 }}
        onBack={jest.fn()}
        onNext={jest.fn()}
        onClose={onClose}
      />
    </>,
  )
  return { onClose }
}

describe('TourStepPopover', () => {
  it('stays open when something outside the card is clicked', async () => {
    const { onClose } = renderStep()

    await act(async () => {
      fireEvent.pointerDown(document.body)
      fireEvent.click(document.body)
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes the tour when the member presses Escape', async () => {
    const { onClose } = renderStep()

    await act(async () => fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes the tour from its close button', () => {
    const { onClose } = renderStep()

    fireEvent.click(screen.getByRole('button', { name: 'Close tour' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('scrolls only the step text, keeping the title and navigation in view on a short window', () => {
    renderStep()

    const body = screen.getByTestId('workspace-tour-step-body')

    expect(within(body).getByText('Shared with everyone.')).toBeInTheDocument()
    expect(within(body).getByText('Edit any time.')).toBeInTheDocument()
    expect(within(body).queryByText('Workspace contacts')).not.toBeInTheDocument()
    expect(within(body).queryByRole('button')).not.toBeInTheDocument()
  })
})
