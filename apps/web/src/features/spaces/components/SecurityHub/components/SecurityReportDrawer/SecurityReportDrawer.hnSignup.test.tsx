import { useState } from 'react'
import { fireEvent } from '@testing-library/react'
import { render, screen } from '@/tests/test-utils'
import SecurityReportDrawer from './SecurityReportDrawer'
import type { SelectedSafe } from '../../types'

jest.mock('./SecurityDrawerContent', () => ({
  __esModule: true,
  default: ({ onHnSignupClick }: { onHnSignupClick?: () => void }) => (
    <button onClick={onHnSignupClick}>Get Hypernative</button>
  ),
}))

jest.mock('@/features/hypernative', () => ({
  __esModule: true,
  HnSignupFlow: ({ open }: { open: boolean }) => (open ? <div>Hypernative signup</div> : null),
}))

const SAFE: SelectedSafe = { address: '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6', chainId: '1' }

const Harness = () => {
  const [selectedSafe, setSelectedSafe] = useState<SelectedSafe | null>(SAFE)

  return (
    <SecurityReportDrawer
      selectedSafe={selectedSafe}
      selectedEntry={undefined}
      scanContext={null}
      onClose={() => setSelectedSafe(null)}
      onScanComplete={jest.fn()}
    />
  )
}

describe('SecurityReportDrawer Hypernative signup', () => {
  it('closes the drawer as it opens the signup flow, so the dialog is not dimmed behind the sheet', () => {
    render(<Harness />)

    expect(screen.getByLabelText('Security report')).toHaveAttribute('data-open')
    expect(screen.queryByText('Hypernative signup')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Get Hypernative' }))

    expect(screen.getByText('Hypernative signup')).toBeInTheDocument()
    expect(screen.queryByLabelText('Security report')).not.toBeInTheDocument()
  })
})
