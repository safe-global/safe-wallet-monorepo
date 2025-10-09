import type { Dispatch, ReactNode, SetStateAction, SyntheticEvent } from 'react'
import { useMemo, useState } from 'react'
import { useCallback } from 'react'
import { type ReactElement } from 'react'
import {
  Box,
  Checkbox,
  InputAdornment,
  Paper,
  Skeleton,
  SvgIcon,
  type SvgIconProps,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import NftIcon from '@/public/images/common/nft.svg'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import ExternalLink from '@/components/common/ExternalLink'
import useChainId from '@/hooks/useChainId'
import { nftPlatforms } from '../config'
import EthHashInfo from '@/components/common/EthHashInfo'

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
    textAlign: 'right',
  },
]

const stopPropagation = (e: SyntheticEvent) => e.stopPropagation()

const NftIndicator = ({ color }: { color: SvgIconProps['color'] }) => (
  <SvgIcon
    data-testid={`nft-icon-${color}`}
    component={NftIcon}
    inheritViewBox
    width={20}
    height={20}
    color={color}
    sx={{ ml: 0.25 }}
  />
)

const activeNftIcon = <NftIndicator color="primary" />

const inactiveNftIcon = (
  <Tooltip title="There's no preview for this NFT" placement="top" arrow>
    <span>
      <NftIndicator color="border" />
    </span>
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
    (e: React.ChangeEvent<HTMLInputElement>, item: Collectible) => {
      e.stopPropagation()
      const { checked } = e.target
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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedNfts(e.target.checked ? filteredNfts : [])
    },
    [filteredNfts, setSelectedNfts],
  )

  const minRows = Math.min(nfts.length, PAGE_SIZE)

  return (
    <>
      <TableContainer component={Paper}>
        <Table aria-labelledby="tableTitle">
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align="left"
                  padding="normal"
                  sx={{
                    display: headCell.xsHidden ? { xs: 'none', sm: 'table-cell' } : undefined,
                    width: headCell.width,
                    'text-align': headCell.textAlign,
                  }}
                >
                  {headCell.id === 'collection' ? (
                    <Box display="flex" alignItems="center" alignContent="center" gap={1}>
                      <TextField
                        placeholder="Collection"
                        hiddenLabel
                        variant="standard"
                        size="small"
                        margin="none"
                        onChange={onFilterChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SvgIcon
                                component={FilterAltIcon}
                                inheritViewBox
                                color="border"
                                sx={{ marginTop: -0.5 }}
                              />
                            </InputAdornment>
                          ),
                          disableUnderline: true,
                        }}
                      />
                    </Box>
                  ) : headCell.id === 'links' ? (
                    linkTemplates ? (
                      <>Links</>
                    ) : null
                  ) : headCell.id === 'checkbox' ? (
                    <Checkbox
                      checked={filteredNfts.length > 0 && filteredNfts.length === selectedNfts.length}
                      onChange={onSelectAll}
                      title="Select all"
                    />
                  ) : (
                    headCell.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredNfts.map((item, index) => {
              const onClick = () => onPreview(item)
              const sx = item.imageUri ? { cursor: 'pointer' } : undefined

              return (
                <TableRow data-testid={`nfts-table-row-${index + 1}`} tabIndex={-1} key={`${item.address}-${item.id}`}>
                  {/* Collection name */}
                  <TableCell onClick={onClick} sx={sx}>
                    <Box display="flex" alignItems="center" gap={2}>
                      {item.imageUri ? activeNftIcon : inactiveNftIcon}

                      <div>
                        <Typography>{item.tokenName || item.tokenSymbol}</Typography>

                        <Typography fontSize="small" color="text.secondary" component="div">
                          <EthHashInfo
                            address={item.address}
                            showAvatar={false}
                            showName={false}
                            showCopyButton
                            hasExplorer
                          />
                        </Typography>
                      </div>
                    </Box>
                  </TableCell>

                  {/* Token ID */}
                  <TableCell onClick={onClick} sx={sx}>
                    <Typography sx={item.name ? undefined : { wordBreak: 'break-all' }}>
                      {item.name || `${item.tokenSymbol} #${item.id.slice(0, 20)}`}
                    </Typography>
                  </TableCell>

                  {/* Links */}
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Box display="flex" alignItems="center" alignContent="center" gap={2.5}>
                      {linkTemplates?.map(({ title, logo, getUrl }) => (
                        <ExternalLink href={getUrl(item)} key={title} onClick={stopPropagation} noIcon>
                          <img src={logo} width={24} height={24} alt={title} />
                        </ExternalLink>
                      ))}
                    </Box>
                  </TableCell>

                  {/* Checkbox */}
                  <TableCell align="right">
                    <Checkbox
                      data-testid={`nft-checkbox-${index + 1}`}
                      checked={selectedKeys.has(getNftKey(item))}
                      onChange={(e) => onCheckboxClick(e, item)}
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
                <TableRow tabIndex={-1} key={index} sx={{ pointerEvents: 'none' }}>
                  {headCells.map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      sx={headCell.xsHidden ? { display: { xs: 'none', sm: 'table-cell' } } : undefined}
                    >
                      <Box height="42px" width="42px" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {/* Show placeholders when loading */}
            {isLoading &&
              Array.from({ length: nfts.length ? PAGE_SIZE : INITIAL_SKELETON_SIZE }).map((_, index) => (
                <TableRow tabIndex={-1} key={index} sx={{ pointerEvents: 'none' }}>
                  {headCells.map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      sx={headCell.xsHidden ? { display: { xs: 'none', sm: 'table-cell' } } : undefined}
                    >
                      <Skeleton variant="rounded" height="30px" sx={{ my: '6px' }} width="100%" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

export default NftGrid
