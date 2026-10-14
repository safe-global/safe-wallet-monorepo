import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImportSignersDialog, { IMPORTED_SIGNER_TAG } from '../ImportSignersDialog'
import type { MissingSigner } from '../../types'

const buildSigner = (placeholder: string): MissingSigner => ({
  address: faker.finance.ethereumAddress(),
  chains: [{ chainId: '1', name: 'Ethereum' }],
  safes: ['Treasury'],
  placeholder,
})

describe('ImportSignersDialog', () => {
  it('saves the placeholder for a name left empty and the typed name otherwise', async () => {
    const first = buildSigner('Treasury signer 1')
    const second = buildSigner('Treasury signer 2')
    const onImport = jest.fn()
    render(<ImportSignersDialog signers={[first, second]} onImport={onImport} onClose={jest.fn()} />)

    await userEvent.type(screen.getByLabelText(`Name for ${second.address}`), '  Maya  ')
    await userEvent.click(screen.getByTestId('import-signers-btn'))

    expect(onImport).toHaveBeenCalledWith([
      { address: first.address, name: 'Treasury signer 1', chainIds: ['1'], tags: [IMPORTED_SIGNER_TAG] },
      { address: second.address, name: 'Maya', chainIds: ['1'], tags: [IMPORTED_SIGNER_TAG] },
    ])
  })

  it('selects every signer by default and toggles them all at once', async () => {
    const signers = [buildSigner('Signer 1'), buildSigner('Signer 2'), buildSigner('Signer 3')]
    render(<ImportSignersDialog signers={signers} onImport={jest.fn()} onClose={jest.fn()} />)
    const selectAll = screen.getByRole('checkbox', { name: 'Select all signers' })

    expect(screen.getByText('3 of 3 selected')).toBeInTheDocument()

    await userEvent.click(selectAll)
    expect(screen.getByText('0 of 3 selected')).toBeInTheDocument()
    expect(screen.getByTestId('import-signers-btn')).toBeDisabled()

    await userEvent.click(selectAll)
    expect(screen.getByText('3 of 3 selected')).toBeInTheDocument()
  })

  it('counts the selected signers in the button label', async () => {
    const signers = [buildSigner('Signer 1'), buildSigner('Signer 2')]
    const onImport = jest.fn()
    render(<ImportSignersDialog signers={signers} onImport={onImport} onClose={jest.fn()} />)
    const button = screen.getByTestId('import-signers-btn')

    expect(button).toHaveTextContent('Import 2 signers')

    await userEvent.click(screen.getByRole('checkbox', { name: `Import ${signers[1].address}` }))

    expect(button).toHaveTextContent('Import 1 signer')
    expect(screen.getByText('1 of 2 selected')).toBeInTheDocument()

    await userEvent.click(button)
    expect(onImport).toHaveBeenCalledWith([expect.objectContaining({ address: signers[0].address })])
  })
})
