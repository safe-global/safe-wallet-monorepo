import { shortenText } from '@/utils/formatters'
import { Box, Link, Typography } from '@mui/material'
import { ReactElement, useState } from 'react'
import css from './styles.module.css'

interface Props {
  hexData: string
  title?: string
  limit?: number
}

export const HexEncodedData = ({ hexData, title, limit = 20 }: Props): ReactElement => {
  const [showTxData, setShowTxData] = useState(false)
  const showExpandBtn = hexData.length > limit

  return (
    <Box data-testid="tx-hexData" className={css.encodedData}>
      {title && (
        <Typography variant="body1">
          <b>{title}:&nbsp;</b>
        </Typography>
      )}
      <Typography paragraph variant="body2" sx={{ whiteSpace: 'normal', margin: '0' }}>
        {showExpandBtn ? (
          <>
            {showTxData ? hexData : shortenText(hexData, 25)}{' '}
            <Link
              aria-label={`${showTxData ? 'Hide' : 'Show'} transaction details`}
              onClick={() => setShowTxData(false)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Typography
                className={css.linkText}
                sx={({ palette }) => ({
                  // @ts-expect-error type '400' can't be used to index type 'PaletteColor'
                  color: palette.primary[400],
                })}
                variant="body1"
              >
                Show {showTxData ? 'Less' : 'More'}
              </Typography>
            </Link>
          </>
        ) : (
          hexData
        )}
      </Typography>
    </Box>
  )
}
