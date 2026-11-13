import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImportReview, { getImportButtonLabel, type ImportReviewRow } from '../ImportReview'

const buildRow = (fields: Partial<ImportReviewRow> = {}): ImportReviewRow => ({
  id: faker.string.uuid(),
  line: faker.number.int({ min: 2, max: 100 }),
  name: faker.company.name(),
  address: faker.finance.ethereumAddress(),
  status: 'new',
  chains: [],
  tags: [],
  canInclude: true,
  includedByDefault: true,
  ...fields,
})

const buildLookAlike = (): ImportReviewRow => {
  const existing = faker.finance.ethereumAddress()
  const lookAlike = `${existing.slice(0, 10)}${existing.slice(10, 12) === 'ff' ? '00' : 'ff'}${existing.slice(12)}`
  return buildRow({
    name: 'Treasury (new)',
    address: lookAlike,
    status: 'look-alike',
    existing: { name: 'Treasury', address: existing },
    includedByDefault: false,
  })
}

const renderReview = (rows: ImportReviewRow[], onConfirm = jest.fn()) =>
  render(<ImportReview rows={rows} bookLabel="the workspace address book" onConfirm={onConfirm} onBack={jest.fn()} />)

describe('ImportReview', () => {
  it('keeps a look-alike row out until the address is verified', async () => {
    const onConfirm = jest.fn()
    renderReview([buildLookAlike()], onConfirm)
    const include = screen.getByRole('checkbox', { name: 'Include Treasury (new)' })
    const confirm = screen.getByTestId('import-review-confirm')

    expect(include).toHaveAttribute('aria-disabled', 'true')
    expect(include).not.toBeChecked()
    expect(confirm).toBeDisabled()

    await userEvent.click(screen.getByLabelText('I verified this address'))

    expect(include).not.toHaveAttribute('aria-disabled', 'true')
    expect(include).toBeChecked()
    expect(confirm).toBeEnabled()

    await userEvent.click(confirm)
    expect(onConfirm).toHaveBeenCalledWith([
      expect.objectContaining({ decision: expect.objectContaining({ included: true, verified: true }) }),
    ])
  })

  it('counts new contacts and updates separately in the footer', async () => {
    const updatedAddress = faker.finance.ethereumAddress()
    const rows = [
      buildRow({ name: 'Orbit' }),
      buildRow({ name: 'Lighthouse' }),
      buildRow({
        name: 'Atlas Audits',
        address: updatedAddress,
        status: 'adds-chains',
        existing: { name: 'Atlas Audits', address: updatedAddress },
      }),
      buildRow({ name: 'Broken', status: 'invalid', canInclude: false, includedByDefault: false }),
    ]
    renderReview(rows)
    const confirm = screen.getByTestId('import-review-confirm')

    expect(confirm).toHaveTextContent('Import 2 contacts · 1 update')

    await userEvent.click(screen.getByRole('checkbox', { name: 'Include Lighthouse' }))

    expect(confirm).toHaveTextContent('Import 1 contact · 1 update')
  })

  describe('getImportButtonLabel', () => {
    it('leaves out updates when there are none', () => {
      expect(getImportButtonLabel(3, 0)).toBe('Import 3 contacts')
    })

    it('pluralises contacts and updates', () => {
      expect(getImportButtonLabel(1, 1)).toBe('Import 1 contact · 1 update')
      expect(getImportButtonLabel(0, 2)).toBe('Import 0 contacts · 2 updates')
    })
  })
})
