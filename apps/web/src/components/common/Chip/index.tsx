import { Typography, Chip as MuiChip, type ChipProps } from '@mui/material'

type Props = {
  label?: string
  sx?: ChipProps['sx']
  fontWeight?: string
}

export function Chip({ sx, label = 'New', fontWeight = 'bold' }: Props) {
  return (
    <MuiChip
      size="small"
      component="span"
      sx={{
        ...sx,
        mt: '-2px',
      }}
      label={
        <Typography
          variant="caption"
          fontWeight={fontWeight}
          display="flex"
          alignItems="center"
          gap={1}
          letterSpacing="1px"
          component="span"
        >
          {label}
        </Typography>
      }
    />
  )
}
