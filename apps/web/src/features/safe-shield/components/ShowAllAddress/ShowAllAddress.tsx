import { ExpandMore } from '@mui/icons-material'
import { AddressImage } from '../AddressImage'
import { Collapse, Typography, Stack, Tooltip } from '@mui/material'
import { useReducer, useState } from 'react'
import { Box } from '@mui/material'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import ExplorerButton from '@/components/common/ExplorerButton'
import useAddressBook from '@/hooks/useAddressBook'
import useChainId from '@/hooks/useChainId'

interface ShowAllAddressProps {
  addresses: {
    address: string
    name?: string
    logoUrl?: string
  }[]
}

export const ShowAllAddress = ({ addresses }: ShowAllAddressProps) => {
  const [expanded, toggle] = useReducer((state: boolean) => !state, false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const currentChain = useCurrentChain()
  const chainId = useChainId()
  const addressBook = useAddressBook(chainId)

  const handleCopyToClipboard = async (address: string, index: number) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  return (
    <Box mt={-1.5}>
      <Box
        onClick={toggle}
        display="inline-flex"
        alignItems="center"
        position="relative"
        width="fit-content"
        overflow="hidden"
        color="text.secondary"
        mb={expanded ? 0.5 : 0}
        sx={{
          cursor: 'pointer',
          '&:hover div': { width: '100%', transform: 'translateX(100%)', transition: 'all 0.5s' },
        }}
      >
        <Typography fontSize={12} component="span" letterSpacing="1px" variant="body2" color="text.secondary">
          {expanded ? 'Hide all' : 'Show all'}
        </Typography>
        <Box
          position="absolute"
          left={0}
          bottom={0}
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            width: 0,
            transform: 'translateX(-1rem)',
            height: '1px',
          }}
        />
        <ExpandMore
          sx={{ transform: expanded ? 'rotate(-180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          fontSize="small"
        />
      </Box>

      <Collapse in={expanded}>
        <Box display="flex" flexDirection="column" gap={1}>
          {addresses.map((item, index) => {
            const explorerLink = currentChain ? getBlockExplorerLink(currentChain, item.address) : undefined
            const name = addressBook[item.address]

            return (
              <Box key={`${item}-${index}`} padding="8px" gap={1} bgcolor="background.paper" borderRadius="4px">
                <AddressImage logoUrl={item.logoUrl} />
                <Stack spacing={0.5}>
                  {name && (
                    <Typography variant="body2" color="text.primary" fontSize={12} mb={0.5}>
                      {name}
                    </Typography>
                  )}
                  <Typography
                    variant="body2"
                    lineHeight="20px"
                    onClick={() => handleCopyToClipboard(item.address, index)}
                  >
                    <Tooltip
                      title={copiedIndex === index ? 'Copied to clipboard' : 'Copy address'}
                      placement="top"
                      arrow
                    >
                      <Typography
                        component="span"
                        variant="body2"
                        lineHeight="20px"
                        fontSize={12}
                        color="primary.light"
                        sx={{
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          overflowWrap: 'break-word',
                          wordBreak: 'break-all',
                          flex: 1,
                          '&:hover': {
                            color: 'text.primary',
                          },
                        }}
                      >
                        {item.address}
                      </Typography>
                    </Tooltip>
                    <Box component="span" color="text.secondary">
                      {explorerLink && <ExplorerButton href={explorerLink.href} />}
                    </Box>
                  </Typography>
                </Stack>
              </Box>
            )
          })}
        </Box>
      </Collapse>
    </Box>
  )
}
