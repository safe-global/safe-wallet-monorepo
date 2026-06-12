import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { List, ListItem } from '@/components/ui/list'
import { Typography } from '@/components/ui/typography'
import CheckIcon from '@/public/images/common/check.svg'
import CreateSpaceInfo from '@/public/images/spaces/create_space_info.png'
import Image from 'next/image'
import ExternalLink from '@/components/common/ExternalLink'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'

const ListIcon = () => (
  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center self-start rounded-full bg-[var(--color-success-light)] [&_path:last-child]:fill-[var(--color-success-main)]">
    <CheckIcon className="size-3 text-[var(--color-success-main)]" />
  </span>
)

const SPACE_HELP_ARTICLE_LINK =
  'https://help.safe.global/articles/8240597068-Spaces:-Team-Collaboration-for-Safe-Accounts'

const SpaceInfoModal = ({ showButtons = true, onClose }: { showButtons?: boolean; onClose: () => void }) => {
  const isDarkMode = useDarkMode()

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className={cn('shadcn-scope w-[870px] max-w-[98%] rounded-2xl p-0', isDarkMode && 'dark')}>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col p-10">
            <Typography variant="h1" className="relative mb-2">
              Introducing workspaces
              <Badge variant="secondary" className="absolute top-0 right-0 font-normal">
                Beta
              </Badge>
            </Typography>

            <Typography className="mt-4 mb-6">
              Collaborate seamlessly with your team and keep your treasury organized.
            </Typography>

            <List className="flex flex-col gap-4">
              <ListItem className="items-start gap-4 py-0">
                <ListIcon />
                Bring all your Safe Accounts into one shared workspace.
              </ListItem>

              <ListItem className="items-start gap-4 py-0">
                <ListIcon />
                Invite team members with shared access—whether they’re signers or just viewers.
              </ListItem>

              <ListItem className="items-start gap-4 py-0">
                <ListIcon />
                Everyone sees the same account names, team members, and data.
              </ListItem>

              <ListItem className="items-start gap-4 py-0">
                <ListIcon />
                Aggregated balances and actions across multiple accounts are coming soon!
              </ListItem>
            </List>

            <Typography className="mt-10">
              Read the <ExternalLink href={SPACE_HELP_ARTICLE_LINK}>workspaces help article</ExternalLink>
            </Typography>

            {showButtons && (
              <div className="mt-6 flex flex-col gap-4 md:mt-auto">
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
              </div>
            )}
          </div>

          <div className="hidden flex-1 justify-center bg-[#121312] md:flex">
            <Image src={CreateSpaceInfo} style={{ width: '100%' }} alt="An illustration of multiple safe accounts" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SpaceInfoModal
