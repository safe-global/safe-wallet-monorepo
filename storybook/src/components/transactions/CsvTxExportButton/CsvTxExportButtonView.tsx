import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import ExportIcon from '@/public/images/common/export.svg'
import { Chip } from '@/components/common/Chip'
import type { OnboardingTooltipPlacement } from '@/components/common/OnboardingTooltip/OnboardingTooltipView'

export type CsvTxExportButtonViewProps = {
  isDarkMode: boolean
  isExporting: boolean
  onClick: () => void
  renderOnboardingTooltip: (props: {
    iconShown: boolean
    placement: OnboardingTooltipPlacement
    titleProps: CSSProperties
    text: ReactElement
    children: ReactElement
  }) => ReactNode
  renderOnlyOwnerOrProposer: (props: { placement: 'top'; children: (isOk: boolean) => ReactElement }) => ReactNode
  exportModal?: ReactNode
}

export const CsvTxExportButtonView = ({
  isDarkMode,
  isExporting,
  onClick,
  renderOnboardingTooltip,
  renderOnlyOwnerOrProposer,
  exportModal,
}: CsvTxExportButtonViewProps): ReactElement => {
  const chipStyles = isDarkMode
    ? { backgroundColor: 'static.main', color: 'secondary.main' }
    : { backgroundColor: 'secondary.main', color: 'static.main' }

  return (
    <>
      {renderOnboardingTooltip({
        iconShown: false,
        placement: 'bottom-end',
        titleProps: { flexDirection: 'column', alignItems: 'flex-end', maxWidth: 263 },
        text: (
          <div className="mt-2">
            <Chip sx={{ borderRadius: 1, ...chipStyles }} fontWeight="normal" />
            <Typography className="block mt-2" variant="paragraph-small">
              Export your transaction history for financial reporting.
            </Typography>
          </div>
        ),
        children: (
          <div>
            {renderOnlyOwnerOrProposer({
              placement: 'top',
              children: (isOk) => (
                <Button variant="outline" size="action" onClick={onClick} disabled={!isOk || isExporting}>
                  {isExporting ? <Spinner className="size-5" /> : <ExportIcon className="size-5" />}
                  {isExporting ? 'Exporting' : 'Export'}
                </Button>
              ),
            })}
          </div>
        ),
      })}

      {exportModal}
    </>
  )
}
