import { type ReactElement } from 'react'
import { MenuItem, Select, type SelectChangeEvent } from '@mui/material'

export type ChainOption = { chainId: string; chainName: string; count: number }

function ChainSelector({
  chains,
  value,
  onChange,
}: {
  chains: Array<ChainOption>
  value: string
  onChange: (chainId: string) => void
}): ReactElement {
  return (
    <Select
      size="small"
      value={value}
      onChange={(event: SelectChangeEvent) => onChange(event.target.value)}
      data-testid="graph-chain-selector"
    >
      {chains.map((chain) => (
        <MenuItem key={chain.chainId} value={chain.chainId}>
          {`${chain.chainName} (${chain.count})`}
        </MenuItem>
      ))}
    </Select>
  )
}

export default ChainSelector
