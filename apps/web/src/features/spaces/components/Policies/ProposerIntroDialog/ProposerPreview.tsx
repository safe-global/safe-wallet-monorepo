import { ArrowDownLeft, ArrowUpRight, Repeat, UserRound, type LucideIcon } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import Identicon from '@/components/common/Identicon'
import { Typography } from '@/components/ui/typography'

const PREVIEW_SIGNERS = ['0x8674ff2cC41CE1A26D0A1B4b8f6c8B58F7bca19b', '0x2F4b9a1Cd3e5F70a8b6c4D2E1a9F8c7B6E5d4c3b']

const PREVIEW_PROPOSERS = [
  '0x1C8b9E4a7F2d5c3b6a8e9D0f4c2B7A5E3d1c8b9E',
  '0x9a3e7C5B1D8f2A6C4E0B9d7F3a1C5E8B2d6f4A0c',
  '0x4D7b2E9C6A1F8b3d5C0E7a9B2D4F6c8A1E3b5d7F',
]

const TRANSACTION_ICONS: LucideIcon[] = [Repeat, ArrowUpRight, ArrowDownLeft]

const TRANSACTION_ICON_SIZE = 12.6

const TRANSACTION_ICON_STROKE = 1.5

const FRAME_WIDTH = 390
const FRAME_HEIGHT = 200

/** One card design at two sizes: the front card is drawn 1.37x larger than the two behind it. */
const CARD_SCALE_FRONT = 1.366

const cardShadow = (scale: number) =>
  `0 ${2 * scale}px ${14 * scale}px rgba(0,0,0,0.13), 0 ${6 * scale}px ${36 * scale}px rgba(0,0,0,0.05)`

const ROW_SHADOW = '0 1px 4px rgba(0,0,0,0.04), 0 2px 10px rgba(0,0,0,0.05)'

const PreviewCard = ({
  left,
  top,
  width,
  height,
  scale,
  children,
}: {
  left: number
  top: number
  width: number
  height: number
  scale: number
  children: ReactNode
}): ReactElement => (
  <div
    className="absolute flex flex-col bg-card"
    style={{
      left,
      top,
      width,
      height,
      paddingTop: 12,
      paddingBottom: 4.5 * scale,
      paddingInline: 4.5 * scale,
      gap: 8.3 * scale,
      borderRadius: 16 * scale,
      boxShadow: cardShadow(scale),
    }}
  >
    {children}
  </div>
)

const PreviewRow = ({ scale, children }: { scale: number; children: ReactNode }): ReactElement => (
  <div
    className="flex shrink-0 items-center bg-card"
    style={{
      height: 31.2 * scale,
      gap: 7 * scale,
      paddingInline: 10.4 * scale,
      borderRadius: 12 * scale,
      boxShadow: ROW_SHADOW,
    }}
  >
    {children}
  </div>
)

const PreviewBar = ({ scale }: { scale: number }): ReactElement => (
  <div className="shrink-0 bg-muted" style={{ width: 37.4 * scale, height: 12.3 * scale, borderRadius: 6.2 * scale }} />
)

const HEADING_FONT_SIZE = 10.5

const HEADING_INSET = 6

const CardHeading = ({
  children,
  fontSize = HEADING_FONT_SIZE,
}: {
  children: ReactNode
  fontSize?: number
}): ReactElement => (
  <Typography
    variant="paragraph-small-bold"
    className="shrink-0"
    style={{ fontSize, lineHeight: `${fontSize * 1.35}px`, paddingLeft: HEADING_INSET }}
  >
    {children}
  </Typography>
)

const ProposerPreview = (): ReactElement => (
  <div
    aria-hidden
    data-testid="proposer-preview"
    className="relative w-full overflow-hidden rounded-xl bg-muted"
    style={{ aspectRatio: `${FRAME_WIDTH} / ${FRAME_HEIGHT}`, containerType: 'inline-size' }}
  >
    <div
      className="absolute left-0 top-0 origin-top-left"
      style={{
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
        scale: `calc(100cqw / ${FRAME_WIDTH})`,
      }}
    >
      <PreviewCard left={27.3} top={21.3} width={200} height={207} scale={CARD_SCALE_FRONT}>
        <CardHeading fontSize={HEADING_FONT_SIZE + 2}>Transactions</CardHeading>

        {TRANSACTION_ICONS.map((Icon, index) => (
          <PreviewRow key={index} scale={CARD_SCALE_FRONT}>
            <Icon
              className="shrink-0 text-muted-foreground"
              strokeWidth={TRANSACTION_ICON_STROKE}
              style={{
                width: TRANSACTION_ICON_SIZE * CARD_SCALE_FRONT,
                height: TRANSACTION_ICON_SIZE * CARD_SCALE_FRONT,
              }}
            />

            <PreviewBar scale={CARD_SCALE_FRONT} />
          </PreviewRow>
        ))}
      </PreviewCard>

      <PreviewCard left={129.5} top={82.5} width={146} height={151} scale={1}>
        <div className="flex shrink-0 items-center" style={{ gap: 6 }}>
          <CardHeading>Signers</CardHeading>

          <div className="flex items-center rounded-full bg-black/5" style={{ gap: 2, paddingInline: 4, height: 10.5 }}>
            <UserRound className="text-muted-foreground" style={{ width: 6.3, height: 6.3 }} />

            <Typography variant="paragraph-mini-medium" color="muted" style={{ fontSize: 6.3, lineHeight: '8px' }}>
              3/5
            </Typography>
          </div>
        </div>

        {PREVIEW_SIGNERS.map((address) => (
          <PreviewRow key={address} scale={1}>
            <div className="shrink-0">
              <Identicon address={address} size={17.3} />
            </div>

            <PreviewBar scale={1} />
          </PreviewRow>
        ))}
      </PreviewCard>

      <PreviewCard left={225.6} top={21.6} width={147} height={152} scale={1}>
        <CardHeading>Proposers</CardHeading>

        {PREVIEW_PROPOSERS.map((address) => (
          <PreviewRow key={address} scale={1}>
            <div className="shrink-0">
              <Identicon address={address} size={17.3} />
            </div>

            <PreviewBar scale={1} />
          </PreviewRow>
        ))}
      </PreviewCard>
    </div>
  </div>
)

export default ProposerPreview
