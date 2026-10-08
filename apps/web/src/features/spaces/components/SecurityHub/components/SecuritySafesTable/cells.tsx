import {
  BalanceCellView,
  ScoreCellView,
} from '@views/features/spaces/components/SecurityHub/components/SecuritySafesTable/CellsView'
import { formatBalance } from './utils'

/** Numeric score (0–100) out of 100. */
export const ScoreCell = ScoreCellView

/** Compact fiat balance ($1.2K / $3.4M / dash when zero or missing). */
export const BalanceCell = ({ value, isScanning }: { value?: string; isScanning?: boolean }) => (
  <BalanceCellView value={value} formattedValue={formatBalance(value)} isScanning={isScanning} />
)
