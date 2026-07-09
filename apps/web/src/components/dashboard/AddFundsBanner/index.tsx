import useSafeInfo from '@/hooks/useSafeInfo'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import { useCurrentChain } from '@/hooks/useChains'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import FiatIcon from '@/public/images/common/fiat2.svg'
import CopyTooltip from '@/components/common/CopyTooltip'
import CopyIcon from '@/public/images/common/copy.svg'

const AddFundsToGetStarted = () => {
  const { safe } = useSafeInfo()
  const safeAddress = useSafeAddress()
  const settings = useAppSelector(selectSettings)
  const chain = useCurrentChain()

  const addressCopyText = settings.shortName.copy && chain ? `${chain.shortName}:${safeAddress}` : safeAddress

  if (!safe.deployed) return null

  return (
    <div className="flex flex-col items-start gap-4 rounded-3xl bg-[var(--color-info-light)] p-4 md:flex-row md:items-center">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--color-background-paper)]">
        <FiatIcon className="size-5" />
      </div>
      <div>
        <Typography variant="paragraph-bold" className="text-[var(--color-static-main)]">
          Add funds to get started
        </Typography>
        <Typography variant="paragraph-small" className="block text-[var(--color-primary-light)]">
          Onramp crypto or send tokens directly to your address from a different wallet.{' '}
        </Typography>
      </div>
      <div className="md:ml-auto">
        <CopyTooltip text={addressCopyText}>
          <Button
            size="sm"
            // eslint-disable-next-line no-restricted-syntax -- on-banner CTA needs a paper background; pending an on-color button variant
            className="bg-[var(--color-background-paper)] text-foreground hover:bg-[var(--color-background-paper)]/80"
          >
            <CopyIcon className="size-5" />
            Copy address
          </Button>
        </CopyTooltip>
      </div>
    </div>
  )
}

export default AddFundsToGetStarted
