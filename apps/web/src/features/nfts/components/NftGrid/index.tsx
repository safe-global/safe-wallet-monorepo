import type { Dispatch, ReactNode, SetStateAction, SyntheticEvent } from 'react'
import { useMemo, useState } from 'react'
import { useCallback } from 'react'
import { type ReactElement } from 'react'
import { Funnel } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import NftIcon from '@/public/images/common/nft.svg'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import ExternalLink from '@/components/common/ExternalLink'
import useChainId from '@/hooks/useChainId'
import { nftPlatforms } from '../../config'
import EthHashInfo from '@/components/common/EthHashInfo'
import { cn } from '@/utils/cn'

interface NftsTableProps {
  nfts: Collectible[]
  selectedNfts: Collectible[]
  setSelectedNfts: Dispatch<SetStateAction<Collectible[]>>
  isLoading: boolean
  children?: ReactNode
  onPreview: (item: Collectible) => void
}

const PAGE_SIZE = 10
const INITIAL_SKELETON_SIZE = 3

const headCells = [
  {
    id: 'collection',
    label: 'Collection',
    width: '35%',
  },
  {
    id: 'id',
    label: 'Token ID',
    width: '35%',
  },
  {
    id: 'links',
    label: 'Links',
    width: '23%',
    xsHidden: true,
  },
  {
    id: 'checkbox',
    label: '',
    width: '7%',
    textAlign: 'right' as const,
  },
]

const stopPropagation = (e: SyntheticEvent) => e.stopPropagation()

const NftIndicator = ({ color, className }: { color: string; className: string }) => (
  <NftIcon data-testid={`nft-icon-${color}`} className={cn('ml-0.5 size-5', className)} />
)

const activeNftIcon = <NftIndicator color="primary" className="text-[var(--color-primary-main)]" />

const inactiveNftIcon = (
  <Tooltip>
    <TooltipTrigger
      render={
        <span>
          <NftIndicator color="border" className="text-[var(--color-border-main)]" />
        </span>
      }
    />
    <TooltipContent>There&apos;s no preview for this NFT</TooltipContent>
  </Tooltip>
)

const getNftKey = (nft: Collectible) => `${nft.address}-${nft.id}`

const NftGrid = ({
  nfts,
  selectedNfts,
  setSelectedNfts,
  isLoading,
  children,
  onPreview,
}: NftsTableProps): ReactElement => {
  const chainId = useChainId()
  const linkTemplates = nftPlatforms[chainId] || []
  // Filter string
  const [filter, setFilter] = useState<string>('')

  const selectedKeySignature = useMemo(() => {
    if (!selectedNfts.length) {
      return ''
    }

    return selectedNfts.map(getNftKey).sort().join('|')
  }, [selectedNfts])

  const selectedKeys = useMemo(() => {
    if (!selectedKeySignature) {
      return new Set<string>()
    }

    return new Set(selectedKeySignature.split('|'))
  }, [selectedKeySignature])

  const onFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilter(e.target.value.toLowerCase())
    },
    [setFilter],
  )

  const onCheckboxClick = useCallback(
    (checked: boolean, item: Collectible) => {
      const key = getNftKey(item)
      setSelectedNfts((prev) => {
        if (checked) {
          if (selectedKeys.has(key)) {
            return prev
          }

          return prev.concat(item)
        }

        return prev.filter((el) => getNftKey(el) !== key)
      })
    },
    [selectedKeys, setSelectedNfts],
  )

  // Filter by collection name or token address
  const filteredNfts = useMemo(() => {
    return filter
      ? nfts.filter((nft) => nft.tokenName.toLowerCase().includes(filter) || nft.address.toLowerCase().includes(filter))
      : nfts
  }, [nfts, filter])

  const onSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedNfts(checked ? filteredNfts : [])
    },
    [filteredNfts, setSelectedNfts],
  )

  const minRows = Math.min(nfts.length, PAGE_SIZE)

  return (
    <>
      <div className="overflow-hidden rounded-xl bg-background-paper">
        <Table aria-labelledby="tableTitle">
          <TableHeader>
            <TableRow>
              {headCells.map((headCell) => (
                <TableHead
                  key={headCell.id}
                  className={cn(
                    headCell.xsHidden && 'hidden sm:table-cell',
                    headCell.textAlign === 'right' && 'text-right',
                  )}
                  style={{ width: headCell.width }}
                >
                  {headCell.id === 'collection' ? (
                    <div className="relative flex items-center">
                      <Funnel className="pointer-events-none absolute left-0 size-4 text-[var(--color-border-main)]" />
                      <Input
                        placeholder="Collection"
                        onChange={onFilterChange}
                        // eslint-disable-next-line no-restricted-syntax -- inline borderless table-header filter: no border/bg/height so it sits flush in the column head; bespoke, no variant
                        className="h-auto border-none bg-transparent py-0 pl-6 pr-0 shadow-none focus-visible:border-none"
                      />
                    </div>
                  ) : headCell.id === 'links' ? (
                    linkTemplates ? (
                      <>Links</>
                    ) : null
                  ) : headCell.id === 'checkbox' ? (
                    <Checkbox
                      checked={filteredNfts.length > 0 && filteredNfts.length === selectedNfts.length}
                      onCheckedChange={onSelectAll}
                      title="Select all"
                    />
                  ) : (
                    headCell.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredNfts.map((item, index) => {
              const onClick = () => onPreview(item)
              const clickable = !!item.imageUri

              return (
                <TableRow data-testid={`nfts-table-row-${index + 1}`} tabIndex={-1} key={`${item.address}-${item.id}`}>
                  {/* Collection name */}
                  <TableCell onClick={onClick} className={cn(clickable && 'cursor-pointer')}>
                    <div className="flex items-center gap-4">
                      {item.imageUri ? activeNftIcon : inactiveNftIcon}

                      <div>
                        <Typography>{item.tokenName || item.tokenSymbol}</Typography>

                        <Typography variant="paragraph-small" color="muted" className="block">
                          <EthHashInfo
                            address={item.address}
                            showAvatar={false}
                            showName={false}
                            showCopyButton
                            hasExplorer
                          />
                        </Typography>
                      </div>
                    </div>
                  </TableCell>

                  {/* Token ID */}
                  <TableCell onClick={onClick} className={cn(clickable && 'cursor-pointer')}>
                    <Typography className={cn(!item.name && 'break-all')}>
                      {item.name || `${item.tokenSymbol} #${item.id.slice(0, 20)}`}
                    </Typography>
                  </TableCell>

                  {/* Links */}
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-5">
                      {linkTemplates?.map(({ title, logo, getUrl }) => (
                        <ExternalLink href={getUrl(item)} key={title} onClick={stopPropagation} noIcon>
                          <img src={logo} width={24} height={24} alt={title} />
                        </ExternalLink>
                      ))}
                    </div>
                  </TableCell>

                  {/* Checkbox */}
                  <TableCell className="text-right">
                    <Checkbox
                      data-testid={`nft-checkbox-${index + 1}`}
                      checked={selectedKeys.has(getNftKey(item))}
                      onCheckedChange={(checked, details) => {
                        details.event.stopPropagation()
                        onCheckboxClick(checked, item)
                      }}
                    />

                    {/* Insert the children at the end of the table */}
                    {index === filteredNfts.length - 1 && children}
                  </TableCell>
                </TableRow>
              )
            })}

            {/* Fill up the table up to min rows when filtering */}
            {filter &&
              Array.from({ length: minRows - filteredNfts.length }).map((_, index) => (
                <TableRow tabIndex={-1} key={index} className="pointer-events-none">
                  {headCells.map((headCell) => (
                    <TableCell key={headCell.id} className={cn(headCell.xsHidden && 'hidden sm:table-cell')}>
                      <div className="h-[42px] w-[42px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {/* Show placeholders when loading */}
            {isLoading &&
              Array.from({ length: nfts.length ? PAGE_SIZE : INITIAL_SKELETON_SIZE }).map((_, index) => (
                <TableRow tabIndex={-1} key={index} className="pointer-events-none">
                  {headCells.map((headCell) => (
                    <TableCell key={headCell.id} className={cn(headCell.xsHidden && 'hidden sm:table-cell')}>
                      <Skeleton className="my-1.5 h-[30px] w-full rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

export default NftGrid
