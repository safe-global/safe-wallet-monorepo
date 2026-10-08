import type { ReactElement, ReactNode } from 'react'
import { Drawer } from '@views/components/common/Drawer/Drawer'
import { DrawerHeader } from '@views/components/common/Drawer/components/DrawerHeader'
import { DrawerTitle } from '@views/components/common/Drawer/components/DrawerTitle'
import { DrawerSubtitle } from '@views/components/common/Drawer/components/DrawerSubtitle'
import { DrawerBody } from '@views/components/common/Drawer/components/DrawerBody'
import CopyButton from '@/components/common/CopyButton'
import { Typography } from '@/components/ui/typography'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { SelectedSafe, SpaceSafeEntry } from '@views/features/spaces/components/SecurityHub/types'

export type SecurityReportDrawerViewProps = {
  selectedSafe: SelectedSafe | null
  selectedEntry: SpaceSafeEntry | undefined
  onClose: () => void
  identicon: ReactNode
  content: ReactNode
}

export const SecurityReportDrawerView = ({
  selectedSafe,
  selectedEntry,
  onClose,
  identicon,
  content,
}: SecurityReportDrawerViewProps): ReactElement => (
  <Drawer
    // Keep the Drawer mounted while closed so the sheet can play its slide-out animation
    open={!!selectedSafe}
    onClose={onClose}
    ariaLabel="Security report"
  >
    {selectedSafe && (
      <>
        <DrawerHeader>
          {identicon}
          <div className="min-w-0">
            <DrawerTitle>
              <span title={selectedEntry?.name || selectedSafe.address}>
                {selectedEntry?.name || shortenAddress(selectedSafe.address)}
              </span>
            </DrawerTitle>
            <DrawerSubtitle>
              <Typography variant="paragraph-mini" className="text-[10px] text-muted-foreground">
                {shortenAddress(selectedSafe.address)}
              </Typography>
              <CopyButton text={selectedSafe.address} className="!p-0.5 text-muted-foreground [&_svg]:!size-3" />
            </DrawerSubtitle>
          </div>
        </DrawerHeader>

        <DrawerBody>{content}</DrawerBody>
      </>
    )}
  </Drawer>
)
