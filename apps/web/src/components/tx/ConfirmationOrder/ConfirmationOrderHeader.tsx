import { ArrowRight } from 'lucide-react'
import TokenIcon from '@/components/common/TokenIcon'
import TokenAmount from '@/components/common/TokenAmount'
import { Typography } from '@/components/ui/typography'

export type InfoBlock = {
  value: string
  label: string
  tokenInfo?: {
    decimals?: number | null
    symbol: string
    logoUri?: string | null
  }
  chainId?: string
}

const ConfirmationOrderHeader = ({ blocks, showArrow }: { blocks: [InfoBlock, InfoBlock]; showArrow?: boolean }) => {
  return (
    <div className="flex flex-row gap-2">
      {blocks.map((block, index) => (
        <div
          key={index}
          className="relative flex w-1/2 flex-row flex-wrap items-center rounded-md bg-[var(--color-border-background)] px-6 py-4"
        >
          {block.tokenInfo && (
            <div className="mr-4 w-10">
              <TokenIcon
                size={40}
                logoUri={block.tokenInfo.logoUri || ''}
                tokenSymbol={block.tokenInfo.symbol}
                chainId={block.chainId}
              />
            </div>
          )}

          <div data-testid="block-label" className="flex-1">
            <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
              {block.label}
            </Typography>

            <Typography variant="h4">
              {block.tokenInfo ? (
                <TokenAmount
                  tokenSymbol={block.tokenInfo.symbol}
                  decimals={block.tokenInfo.decimals}
                  value={block.value}
                />
              ) : (
                block.value
              )}
            </Typography>
          </div>

          {showArrow && index === 0 && (
            <div className="absolute top-1/2 right-[-20px] z-[2] flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-background-paper)] p-2">
              <ArrowRight className="size-4" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ConfirmationOrderHeader
