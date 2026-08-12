import type { ReactElement } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { X, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { DialogClose, DialogTitle } from '@/components/ui/dialog'
import { AppRoutes } from '@/config/routes'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'

const BENEFITS = [
  'Keep all related Safes in one shared workspace',
  'Give teams shared context around transactions and activity',
  'Streamline coordination across initiators, approvers, and executors',
]

export const AddToSpacePopupModal = (): ReactElement => {
  const router = useRouter()
  const safe = useSafeQueryParam()
  const createSpaceHref = { pathname: AppRoutes.spaces.createSpace, query: { safe } }

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between px-5 py-5">
        <DialogTitle>
          <Typography variant="h4">Add to workspace</Typography>
        </DialogTitle>
        <DialogClose aria-label="Close" className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="size-4" />
        </DialogClose>
      </div>

      <div className="flex flex-col gap-4 sm:gap-6 px-6 pb-6 pt-2.5">
        <Typography variant="paragraph" color="muted">
          Bring related Safes into a shared workspace and collaborate with your team — all in one place.
        </Typography>

        <div className="relative h-[140px] sm:h-[200px] w-full rounded-3xl bg-secondary overflow-hidden flex items-center justify-center shrink-0">
          <Image
            src="/images/spaces/empty_dashboard.png"
            alt="Add to workspace illustration"
            fill
            className="object-contain"
          />
        </div>

        <div className="flex flex-col gap-5 sm:gap-8">
          {BENEFITS.map((text) => (
            <div key={text} className="flex gap-4 items-start">
              <div className="flex items-center justify-center size-6 rounded-full bg-sidebar-accent shrink-0">
                <Check className="size-4 primary" />
              </div>
              <Typography variant="paragraph-small" color="muted" className="leading-5">
                {text}
              </Typography>
            </div>
          ))}
        </div>

        <DialogClose render={<Button className="w-full gap-2" />} onClick={() => void router.push(createSpaceHref)}>
          <Plus className="size-5" />
          Create a workspace
        </DialogClose>
      </div>
    </div>
  )
}
