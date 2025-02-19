import { Collapse, TableCell, TableRow } from '@mui/material'
import classNames from 'classnames'
import type { EnhancedRow } from '.'
import css from './styles.module.css'

const AssetsRow = ({ row, index }: { row: EnhancedRow; index: number }) => {
  return (
    <TableRow
      data-testid="table-row"
      tabIndex={-1}
      selected={row.selected}
      className={row.collapsed ? css.collapsedRow : undefined}
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

export default AssetsRow
