import { type ReactNode } from 'react'
import EmptyBatchIcon from '@/public/images/common/empty-batch.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import AssetsIcon from '@/public/images/sidebar/assets.svg'
import AppsIcon from '@/public/images/apps/apps-icon.svg'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import { Typography } from '@/components/ui/typography'

const EmptyBatch = ({ children }: { children: ReactNode }) => (
  <div className="flex w-full max-w-full flex-col items-center px-2 py-6 text-center sm:px-4">
    {/* fill-current restores what MUI's SvgIcon used to supply. Three of this illustration's six
        paths carry no fill of their own, and the file's root is `fill="none"` — under SvgIcon they
        inherited its `fill: currentColor`, but rendered bare they came out invisible, so the parcel,
        ring and sparkle around the arrow simply vanished. A class beats the attribute, and the three
        paths that do set `illustration-*-fill` keep their own colours. */}
    <EmptyBatchIcon className="size-[110px] fill-current text-[var(--color-border-main)]" />

    <Typography variant="h4" className="mt-4 font-bold">
      Add an initial transaction to the batch
    </Typography>

    <Typography variant="paragraph-small" className="block mt-4 mb-8 max-w-md px-2 [text-wrap:balance] sm:px-4">
      Save gas and signatures by adding multiple Safe transactions to a single batch transaction. You can reorder and
      delete individual transactions in a batch.
    </Typography>

    {children}

    <Typography variant="paragraph-small" className="block mt-12 w-full text-[var(--color-border-main)]">
      <span className="mb-2 block">
        <InfoIcon className="mx-auto size-6" />
      </span>

      <b>What type of transactions can you add to the batch?</b>

      <span className="mt-6 flex flex-wrap justify-center gap-6 sm:gap-12">
        <span className="min-w-[120px]">
          <AssetsIcon className="mx-auto size-6" />
          <span className="mt-1 block">Token and NFT transfers</span>
        </span>

        <span className="min-w-[120px]">
          <AppsIcon className="mx-auto size-6" />
          <span className="mt-1 block">Safe App transactions</span>
        </span>

        <span className="min-w-[120px]">
          <SettingsIcon className="mx-auto size-6" />
          <span className="mt-1 block">Safe account settings</span>
        </span>
      </span>
    </Typography>
  </div>
)

export default EmptyBatch
