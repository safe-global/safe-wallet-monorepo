import { render, screen } from '@testing-library/react'
import { Table, TableBody, TableCell, TableRow } from '@safe-global/views/components/ui/table'
import ConflictBracket, { getConflictBracketSegment } from '../ConflictBracket'
import ConflictHeaderRow from '../ConflictHeaderRow'

const renderOption = (option: number, size: number) =>
  render(
    <Table>
      <TableBody>
        <TableRow>
          <TableCell className="relative">
            <ConflictBracket option={option} size={size} nonce={42} />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  ).container

const segments = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-segment]')).map((element) => element.dataset.segment)

describe('ConflictBracket', () => {
  it.each([
    [1, 2, 'first'],
    [2, 2, 'last'],
    [1, 3, 'first'],
    [2, 3, 'middle'],
    [3, 3, 'last'],
  ] as const)('places option %i of %i as the %s piece', (option, size, segment) => {
    expect(getConflictBracketSegment({ option, size })).toBe(segment)
  })

  it.each([
    [1, 3],
    [2, 3],
  ])('draws option %i of %i full height with a tick', (option, size) => {
    const container = renderOption(option, size)

    expect(segments(container)).toEqual([getConflictBracketSegment({ option, size }), 'tick'])
    const line = container.querySelector('[data-segment="first"], [data-segment="middle"]')
    expect(line).toHaveClass('top-[-6px]', 'bottom-[-8px]')
  })

  it('ends the last option in a curve at the tick', () => {
    const container = renderOption(3, 3)

    expect(segments(container)).toEqual(['last'])
    expect(container.querySelector('[data-segment="last"]')).toHaveClass(
      'top-[-6px]',
      'rounded-bl-md',
      'border-b-[1.5px]',
      'w-3',
    )
  })

  it('draws every piece in the warning colour', () => {
    const container = renderOption(1, 2)

    container.querySelectorAll('[data-segment]').forEach((element) => {
      expect(element).toHaveClass('border-warning-accent')
    })
  })

  it('names the option it marks', () => {
    renderOption(2, 3)

    expect(screen.getByRole('img', { name: 'Option 2 of 3 at nonce 42' })).toBeInTheDocument()
  })
})

describe('ConflictHeaderRow', () => {
  it('starts the bracket below the nonce, down to the row edge', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <ConflictHeaderRow nonce={42} size={2} />
        </TableBody>
      </Table>,
    )

    const start = container.querySelector('[data-segment="header"]')
    expect(start).toHaveClass('top-[calc(50%+20px)]', 'bottom-[-8px]', 'border-warning-accent')
    expect(start?.parentElement).toHaveClass('relative')
    expect(start?.parentElement).toHaveTextContent('42')
  })
})
