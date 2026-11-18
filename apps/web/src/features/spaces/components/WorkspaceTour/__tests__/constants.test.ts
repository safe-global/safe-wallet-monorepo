import { TOUR_STEPS } from '../constants'

const OPEN_SAFE_STEP = TOUR_STEPS.find(({ id }) => id === 'open-safe')!

describe('Open a Safe stop', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('points at the first Safe row, not the address poisoning warning above it', () => {
    document.body.innerHTML = `
      <div data-testid="space-safe-accounts-list">
        <table>
          <tbody>
            <tr data-band-header=""><td>Address poisoning warning</td></tr>
            <tr data-testid="account-table-row"><td>Treasury</td></tr>
          </tbody>
        </table>
      </div>`

    const anchor = document.querySelector(OPEN_SAFE_STEP.anchor!)

    expect(anchor).toHaveTextContent('Treasury')
  })

  it('points at the empty state when the workspace has no Safes', () => {
    document.body.innerHTML = '<div data-testid="safe-accounts-empty">No Safes yet</div>'

    const anchor = document.querySelector(OPEN_SAFE_STEP.anchor!)

    expect(anchor).toHaveTextContent('No Safes yet')
  })
})
