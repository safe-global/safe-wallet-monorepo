import { useMemo } from 'react'
import { Stack, Box, Typography } from '@mui/material'
import CopyButton from '@/components/common/CopyButton'

const containerSx = { backgroundColor: 'background.paper', borderRadius: 1, padding: 2 }
const codeSx = { wordWrap: 'break-word', whiteSpace: 'pre-wrap' }

export const JsonView = ({ data }: { data: unknown }) => {
  const json = useMemo(() => JSON.stringify(data, null, 2), [data])

  return (
    <Stack sx={containerSx}>
      <Box alignSelf="flex-end" m={-1}>
        <CopyButton text={json} />
      </Box>

      <Typography variant="caption" component="code" sx={codeSx}>
        {json}
      </Typography>
    </Stack>
  )
}
