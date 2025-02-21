import { Collapse, TableCell, TableRow } from '@mui/material'
import classNames from 'classnames'
import type { EnhancedRow } from '.'
import css from './styles.module.css'

const Row = ({ row, index, rowClassName }: { row: EnhancedRow; index: number; rowClassName?: string }) => {
  return (
    <TableRow
      data-testid="table-row"
      tabIndex={-1}
      key={row.key ?? index}
      selected={row.selected}
      className={classNames({ [css.collapsedRow]: row.collapsed, rowClassName })}
    >
      {Object.entries(row.cells).map(([key, cell]) => (
        <TableCell
          key={key}
          className={classNames({
            sticky: cell.sticky,
            [css.collapsedCell]: row.collapsed,
          })}
        >
          <Collapse key={index} in={!row.collapsed} enter={false}>
            {cell.content}
          </Collapse>
        </TableCell>
      ))}
    </TableRow>
  )
}

export default Row
