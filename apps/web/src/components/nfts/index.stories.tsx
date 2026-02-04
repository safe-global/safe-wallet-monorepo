import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  Skeleton,
  Dialog,
  DialogContent,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import CloseIcon from '@mui/icons-material/Close'

/**
 * NFT components display and manage collectibles (NFTs) owned by a Safe account.
 * Includes a grid view, collection grouping, and preview modal functionality.
 *
 * Note: Actual NftGrid, NftCollections, NftPreviewModal require Safe context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Components/NFTs',
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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox disabled />
              </TableCell>
              <TableCell>NFT</TableCell>
              <TableCell>Collection</TableCell>
              <TableCell>Token ID</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell padding="checkbox">
                  <Skeleton variant="rectangular" width={20} height={20} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton variant="rectangular" width={48} height={48} />
                    <Skeleton width={120} />
                  </Box>
                </TableCell>
                <TableCell>
                  <Skeleton width={100} />
                </TableCell>
                <TableCell>
                  <Skeleton width={60} />
                </TableCell>
                <TableCell>
                  <Skeleton width={80} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  if (nfts.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No NFTs found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This Safe does not own any collectibles yet.
        </Typography>
      </Paper>
    )
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={selectedNfts.length > 0 && selectedNfts.length < nfts.length}
                checked={selectedNfts.length === nfts.length}
              />
            </TableCell>
            <TableCell>NFT</TableCell>
            <TableCell>Collection</TableCell>
            <TableCell>Token ID</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {nfts.map((nft) => (
            <TableRow key={`${nft.address}-${nft.id}`} hover>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedNfts.some((s) => s.address === nft.address && s.id === nft.id)}
                  onChange={() => onSelect(nft)}
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1,
                      bgcolor: nft.imageUri ? 'transparent' : 'grey.200',
                      backgroundImage: nft.imageUri ? `url(${nft.imageUri})` : 'none',
                      backgroundSize: 'cover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {!nft.imageUri && (
                      <Typography variant="caption" color="text.secondary">
                        ?
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2">{nft.name || `${nft.tokenSymbol} #${nft.id}`}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{nft.tokenName}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontFamily="monospace">
                  #{nft.id}
                </Typography>
              </TableCell>
              <TableCell>
                <IconButton size="small" onClick={() => onPreview(nft)} title="Preview">
                  <VisibilityIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" title="Open in explorer">
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// Mock Preview Modal
const MockPreviewModal = ({ nft, onClose }: { nft: MockNft; onClose: () => void }) => (
  <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
    <DialogContent sx={{ position: 'relative', p: 0 }}>
      <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper' }}>
        <CloseIcon />
      </IconButton>
      <Box
        sx={{
          height: 300,
          bgcolor: nft.imageUri ? 'transparent' : 'grey.200',
          backgroundImage: nft.imageUri ? `url(${nft.imageUri})` : 'none',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!nft.imageUri && (
          <Typography variant="h6" color="text.secondary">
            No Preview
          </Typography>
        )}
      </Box>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">{nft.name || `${nft.tokenSymbol} #${nft.id}`}</Typography>
        <Typography variant="body2" color="text.secondary">
          {nft.tokenName}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Contract: {nft.address.slice(0, 10)}...{nft.address.slice(-8)}
        </Typography>
      </Box>
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
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
    </Box>
  )
}

// Full NFT page simulation - FULL PAGE FIRST
export const FullNftPage: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 1000 }}>
      <Typography variant="h4" gutterBottom>
        NFTs
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        View and manage your collectibles. Select NFTs to transfer them.
      </Typography>
      <NftGridInteractive />
    </Box>
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
      <Box>
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.light' }}>
          <Typography variant="body2">
            <strong>Selected NFTs:</strong>{' '}
            {selectedNfts.map((nft) => nft.name || `${nft.tokenSymbol} #${nft.id}`).join(', ') || 'None'}
          </Typography>
        </Paper>
        <MockNftGrid nfts={mockNfts} selectedNfts={selectedNfts} onSelect={handleSelect} onPreview={setPreviewNft} />
        {previewNft && <MockPreviewModal nft={previewNft} onClose={() => setPreviewNft(null)} />}
      </Box>
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
      <Box>
        {open ? (
          <MockPreviewModal nft={mockNfts[0]} onClose={() => setOpen(false)} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Modal closed. Refresh to see it again.
          </Typography>
        )}
      </Box>
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
      <Paper sx={{ p: 2, maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          Collections
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {collections.map((collection) => (
            <Box
              key={collection.name}
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {collection.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {collection.count} item{collection.count !== 1 ? 's' : ''}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Floor: {collection.floorPrice}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
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
