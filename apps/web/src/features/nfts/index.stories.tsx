import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Typography } from '@/components/ui/typography'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Eye, ExternalLink } from 'lucide-react'

/**
 * NFT components display and manage collectibles (NFTs) owned by a Safe account.
 * Includes a grid view, collection grouping, and preview modal functionality.
 *
 * Note: Actual NftGrid, NftCollections, NftPreviewModal require Safe context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Features/NFTs',
  parameters: {
    layout: 'padded',
  },
}

export default meta

// Mock NFT data structure
interface MockNft {
  address: string
  tokenName: string
  tokenSymbol: string
  id: string
  name: string | null
  imageUri: string | null
}

const mockNfts: MockNft[] = [
  {
    address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    tokenName: 'Bored Ape Yacht Club',
    tokenSymbol: 'BAYC',
    id: '1234',
    name: 'BAYC #1234',
    imageUri: 'https://placekitten.com/200/200',
  },
  {
    address: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
    tokenName: 'Mutant Ape Yacht Club',
    tokenSymbol: 'MAYC',
    id: '5678',
    name: 'MAYC #5678',
    imageUri: 'https://placekitten.com/201/201',
  },
  {
    address: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
    tokenName: 'CryptoPunks',
    tokenSymbol: 'PUNK',
    id: '999',
    name: null,
    imageUri: null,
  },
  {
    address: '0x23581767a106ae21c074b2276D25e5C3e136a68b',
    tokenName: 'Moonbirds',
    tokenSymbol: 'MOONBIRD',
    id: '4242',
    name: 'Moonbird #4242',
    imageUri: 'https://placekitten.com/202/202',
  },
]

// Mock NftGrid component
const MockNftGrid = ({
  nfts,
  selectedNfts,
  onSelect,
  onPreview,
  isLoading = false,
}: {
  nfts: MockNft[]
  selectedNfts: MockNft[]
  onSelect: (nft: MockNft) => void
  onPreview: (nft: MockNft) => void
  isLoading?: boolean
}) => {
  if (isLoading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox disabled />
              </TableHead>
              <TableHead>NFT</TableHead>
              <TableHead>Collection</TableHead>
              <TableHead>Token ID</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="size-5" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Skeleton className="size-12" />
                    <Skeleton className="h-4 w-[120px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[60px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (nfts.length === 0) {
    return (
      <div className="rounded-lg bg-card p-8 text-center">
        <Typography variant="paragraph" color="muted">
          No NFTs found
        </Typography>
        <Typography variant="paragraph-small" color="muted" className="mt-2 block">
          This Safe does not own any collectibles yet.
        </Typography>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                indeterminate={selectedNfts.length > 0 && selectedNfts.length < nfts.length}
                checked={selectedNfts.length === nfts.length}
              />
            </TableHead>
            <TableHead>NFT</TableHead>
            <TableHead>Collection</TableHead>
            <TableHead>Token ID</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nfts.map((nft) => (
            <TableRow key={`${nft.address}-${nft.id}`}>
              <TableCell>
                <Checkbox
                  checked={selectedNfts.some((s) => s.address === nft.address && s.id === nft.id)}
                  onCheckedChange={() => onSelect(nft)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-4">
                  <div
                    className="flex size-12 items-center justify-center rounded-lg bg-muted bg-cover"
                    style={nft.imageUri ? { backgroundImage: `url(${nft.imageUri})` } : undefined}
                  >
                    {!nft.imageUri && (
                      <Typography variant="paragraph-mini" color="muted">
                        ?
                      </Typography>
                    )}
                  </div>
                  <Typography variant="paragraph-small">{nft.name || `${nft.tokenSymbol} #${nft.id}`}</Typography>
                </div>
              </TableCell>
              <TableCell>
                <Typography variant="paragraph-small">{nft.tokenName}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="code">#{nft.id}</Typography>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon-sm" onClick={() => onPreview(nft)} title="Preview">
                  <Eye />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Open in explorer">
                  <ExternalLink />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Mock Preview Modal
const MockPreviewModal = ({ nft, onClose }: { nft: MockNft; onClose: () => void }) => (
  <Dialog
    open
    onOpenChange={(open) => {
      if (!open) onClose()
    }}
  >
    <DialogContent className="max-w-[600px] p-0">
      <div
        className="flex h-[300px] items-center justify-center bg-muted bg-contain bg-center bg-no-repeat"
        style={nft.imageUri ? { backgroundImage: `url(${nft.imageUri})` } : undefined}
      >
        {!nft.imageUri && (
          <Typography variant="h4" color="muted">
            No preview
          </Typography>
        )}
      </div>
      <div className="p-6">
        <Typography variant="h4">{nft.name || `${nft.tokenSymbol} #${nft.id}`}</Typography>
        <Typography variant="paragraph-small" color="muted">
          {nft.tokenName}
        </Typography>
        <Typography variant="paragraph-mini" color="muted" className="mt-1 block">
          Contract: {nft.address.slice(0, 10)}...{nft.address.slice(-8)}
        </Typography>
      </div>
    </DialogContent>
  </Dialog>
)

// Interactive NftGrid wrapper
const NftGridInteractive = ({ nfts = mockNfts, isLoading = false }: { nfts?: MockNft[]; isLoading?: boolean }) => {
  const [selectedNfts, setSelectedNfts] = useState<MockNft[]>([])
  const [previewNft, setPreviewNft] = useState<MockNft | null>(null)

  const handleSelect = (nft: MockNft) => {
    setSelectedNfts((prev) => {
      const exists = prev.some((s) => s.address === nft.address && s.id === nft.id)
      if (exists) {
        return prev.filter((s) => !(s.address === nft.address && s.id === nft.id))
      }
      return [...prev, nft]
    })
  }

  return (
    <div>
      <Typography variant="paragraph-small" color="muted" className="mb-4 block">
        Selected: {selectedNfts.length} NFT{selectedNfts.length !== 1 ? 's' : ''}
      </Typography>
      <MockNftGrid
        nfts={nfts}
        selectedNfts={selectedNfts}
        onSelect={handleSelect}
        onPreview={setPreviewNft}
        isLoading={isLoading}
      />
      {previewNft && <MockPreviewModal nft={previewNft} onClose={() => setPreviewNft(null)} />}
    </div>
  )
}

// Full NFT page simulation - FULL PAGE FIRST
export const FullNftPage: StoryObj = {
  render: () => (
    <div className="max-w-[1000px]">
      <Typography variant="h4" className="mb-2">
        NFTs
      </Typography>
      <Typography variant="paragraph-small" color="muted" className="mb-6 block">
        View and manage your collectibles. Select NFTs to transfer them.
      </Typography>
      <NftGridInteractive />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Full NFT page layout with header and interactive grid.',
      },
    },
  },
}

export const Grid: StoryObj = {
  render: () => <NftGridInteractive />,
  parameters: {
    docs: {
      description: {
        story: 'NftGrid displays NFTs in a selectable table format with filtering, preview, and external links.',
      },
    },
  },
}

export const GridLoading: StoryObj = {
  render: () => <NftGridInteractive nfts={[]} isLoading={true} />,
  parameters: {
    docs: {
      description: {
        story: 'NftGrid in loading state shows skeleton placeholders.',
      },
    },
  },
}

export const GridEmpty: StoryObj = {
  render: () => <NftGridInteractive nfts={[]} />,
  parameters: {
    docs: {
      description: {
        story: 'NftGrid when no NFTs are available.',
      },
    },
  },
}

export const GridWithSelection: StoryObj = {
  render: () => {
    const [selectedNfts, setSelectedNfts] = useState<MockNft[]>([mockNfts[0], mockNfts[1]])
    const [previewNft, setPreviewNft] = useState<MockNft | null>(null)

    const handleSelect = (nft: MockNft) => {
      setSelectedNfts((prev) => {
        const exists = prev.some((s) => s.address === nft.address && s.id === nft.id)
        if (exists) {
          return prev.filter((s) => !(s.address === nft.address && s.id === nft.id))
        }
        return [...prev, nft]
      })
    }

    return (
      <div>
        <div className="mb-4 rounded-lg border border-border bg-muted p-4">
          <Typography variant="paragraph-small">
            <strong>Selected NFTs:</strong>{' '}
            {selectedNfts.map((nft) => nft.name || `${nft.tokenSymbol} #${nft.id}`).join(', ') || 'None'}
          </Typography>
        </div>
        <MockNftGrid nfts={mockNfts} selectedNfts={selectedNfts} onSelect={handleSelect} onPreview={setPreviewNft} />
        {previewNft && <MockPreviewModal nft={previewNft} onClose={() => setPreviewNft(null)} />}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'NftGrid with pre-selected NFTs showing the selection state.',
      },
    },
  },
}

// Preview Modal standalone
export const PreviewModal: StoryObj = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div>
        {open ? (
          <MockPreviewModal nft={mockNfts[0]} onClose={() => setOpen(false)} />
        ) : (
          <Typography variant="paragraph-small" color="muted">
            Modal closed. Refresh to see it again.
          </Typography>
        )}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'NftPreviewModal displays a larger view of an NFT with metadata.',
      },
    },
  },
}

// Collections view mockup
export const Collections: StoryObj = {
  render: () => {
    const collections = [
      { name: 'Bored Ape Yacht Club', count: 2, floorPrice: '25 ETH' },
      { name: 'CryptoPunks', count: 1, floorPrice: '45 ETH' },
      { name: 'Moonbirds', count: 1, floorPrice: '3.5 ETH' },
    ]

    return (
      <div className="max-w-[600px] rounded-lg bg-card p-4">
        <Typography variant="h4" className="mb-4">
          Collections
        </Typography>
        <div className="flex flex-col gap-4">
          {collections.map((collection) => (
            <div
              key={collection.name}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-4 hover:bg-muted"
            >
              <div>
                <Typography variant="paragraph-bold">{collection.name}</Typography>
                <Typography variant="paragraph-mini" color="muted">
                  {collection.count} item{collection.count !== 1 ? 's' : ''}
                </Typography>
              </div>
              <Typography variant="paragraph-small" color="muted">
                Floor: {collection.floorPrice}
              </Typography>
            </div>
          ))}
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'NftCollections groups NFTs by collection for easier browsing.',
      },
    },
  },
}
