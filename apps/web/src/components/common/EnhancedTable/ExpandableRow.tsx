import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Collapse, Stack, TableCell, TableRow } from '@mui/material'
import classNames from 'classnames'
import { useState } from 'react'
import type { EnhancedRow } from '.'
import css from './styles.module.css'

const ExpandableRow = ({
  row,
  index,
  numRows,
  rowClassName,
}: {
  row: EnhancedRow
  index: number
  numRows: number
  rowClassName?: string
}) => {
  const [open, setOpen] = useState(false)

  const isLastToken = index > 0 && index === numRows - 1

  const cells = Object.entries(row.cells)

  return (
    <>
      <TableRow
        data-testid="expandable-table-row"
        tabIndex={-1}
        selected={row.selected}
        className={classNames({ [css.collapsedRow]: row.collapsed, rowClassName })}
        onClick={() => setOpen(!open)}
        sx={{
          cursor: 'pointer',
          borderBottom:
            !isLastToken || (isLastToken && open) ? '1px solid var(--color-border-light)' : 'none !important',
        }}
      >
        {cells.map(([key, cell], index) => (
          <TableCell
            key={key}
            className={classNames({
              sticky: cell.sticky,
              [css.collapsedCell]: row.collapsed,
            })}
          >
            <Collapse key={index} in={!row.collapsed} enter={false}>
              {cells.length - 1 === index ? (
                <Stack flexDirection="row" alignItems="center">
                  {cell.content}
                  {open ? <ExpandLessIcon color="border" /> : <ExpandMoreIcon color="border" />}
                </Stack>
              ) : (
                cell.content
              )}
            </Collapse>
          </TableCell>
        ))}
      </TableRow>
      <TableRow style={{ borderBottom: open && !isLastToken ? '1px solid var(--color-border-light)' : 'none' }}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
          <Collapse in={open}>{row.expandableRow}</Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

export default ExpandableRow
