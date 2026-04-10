import type { ReactElement } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { AppRoutes } from '@/config/routes'

interface AddToSpacePopupModalProps {
  onClose: () => void
}

const BENEFITS = [
  'Keep all related Safes in one shared workspace',
  'Give teams shared context around transactions and activity',
  'Streamline coordination across initiators, approvers, and executors',
]

export const AddToSpacePopupModal = ({ onClose }: AddToSpacePopupModalProps): ReactElement => {
  return (
    <div className="flex flex-col w-full rounded-3xl overflow-hidden shadow-lg bg-background">
      <div className="flex items-center justify-between px-5 py-5">
        <Typography variant="h4">Add to Space</Typography>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-6 px-6 pb-6 pt-2.5">
        <Typography variant="paragraph" color="muted">
          Bring related Safes into a shared workspace and collaborate with your team — all in one place.
        </Typography>

        <div className="relative h-[200px] w-full rounded-3xl bg-secondary overflow-hidden flex items-center justify-center shrink-0">
          <Image
            src="/images/spaces/create_space_info.png"
            alt="Add to Space illustration"
            fill
            className="object-contain"
          />
        </div>

        <div className="flex flex-col gap-8">
          {BENEFITS.map((text) => (
            <div key={text} className="flex gap-4 items-start">
              <div className="flex items-center justify-center size-6 rounded-full bg-accent shrink-0">
                <Check className="size-4 text-primary" />
              </div>
              <Typography variant="paragraph-small" color="muted" className="leading-5">
                {text}
              </Typography>
            </div>
          ))}
        </div>

        <Button className="w-full gap-2 rounded-xl" render={<Link href={AppRoutes.spaces.createSpace} />}>
          <Plus className="size-5" />
          Create a Space
        </Button>
      </div>
    </div>
  )
}
