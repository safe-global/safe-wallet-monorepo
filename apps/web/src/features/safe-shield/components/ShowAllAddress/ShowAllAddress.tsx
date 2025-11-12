import { ExpandMore } from '@mui/icons-material'
import { Collapse, Stack, Typography } from '@mui/material'
import { useReducer } from 'react'
import { Box } from '@mui/material'
import { ContractImage } from '../ContractImage'

interface ShowAllAddressProps {
  addresses: {
    address: string
    name: string
    logoUrl: string
  }[]
}

export const ShowAllAddress = ({ addresses }: ShowAllAddressProps) => {
  const [expanded, toggle] = useReducer((state: boolean) => !state, false)

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
          {addresses.map((item, index) => (
            <Box
              padding="8px"
              display="flex"
              gap={1}
              key={`${item.address}-${index}`}
              bgcolor="background.paper"
              borderRadius="6px"
            >
              <ContractImage logoUrl={item.logoUrl} />

              <Stack spacing={0.5}>
                {item.name && (
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {item.name}
                  </Typography>
                )}

                <Typography
                  variant="body2"
                  color="primary.light"
                  lineHeight="1rem"
                  sx={{
                    fontSize: 12,
                    wordBreak: 'break-all',
                  }}
                >
                  {item.address}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  )
}
