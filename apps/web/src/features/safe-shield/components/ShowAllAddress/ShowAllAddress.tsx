import { AddressImage } from '../AddressImage'
import { Typography, Stack, Tooltip, Box } from '@mui/material'
import { useState } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import ExplorerButton from '@/components/common/ExplorerButton'
import useAddressBook from '@/hooks/useAddressBook'
import useChainId from '@/hooks/useChainId'
import { AnalysisDetailsDropdown } from '../AnalysisDetailsDropdown'

interface ShowAllAddressProps {
  showImage?: boolean
  addresses: {
    address: string
    name?: string
    logoUrl?: string
  }[]
}

export const ShowAllAddress = ({ addresses, showImage }: ShowAllAddressProps) => {
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
    <AnalysisDetailsDropdown>
      <Box display="flex" flexDirection="column" gap={1}>
        {addresses.map((item, index) => {
          const explorerLink = currentChain ? getBlockExplorerLink(currentChain, item.address) : undefined
          const name = addressBook[item.address] || item.name

          return (
            <Box
              key={`${item}-${index}`}
              padding="8px"
              gap={1}
              display="flex"
              flexDirection="row"
              bgcolor="background.paper"
              borderRadius="4px"
            >
              {showImage && <AddressImage logoUrl={item.logoUrl} />}
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
                  <Tooltip title={copiedIndex === index ? 'Copied to clipboard' : 'Copy address'} placement="top" arrow>
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
    </AnalysisDetailsDropdown>
  )
}
