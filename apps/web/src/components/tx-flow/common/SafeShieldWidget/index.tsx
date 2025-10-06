import { type ReactElement } from 'react'
import { Box, Typography, Card, SvgIcon, Stack } from '@mui/material'
import SafeShieldLogo from '@/public/images/safe-shield/safe-shield-logo-no-text.svg'
import SafeShieldLogoDark from '@/public/images/safe-shield/safe-shield-logo-no-text-dark.svg'
import SafeShieldLogoFull from '@/public/images/safe-shield/safe-shield-logo.svg'
import SafeShieldLogoFullDark from '@/public/images/safe-shield/safe-shield-logo-dark.svg'
import { useDarkMode } from '@/hooks/useDarkMode'

const SafeShieldWidget = (): ReactElement => {
  const isDarkMode = useDarkMode()
  return (
    <Stack gap={1}>
      <Card>
        {/* Header Frame */}
        <Box padding="2px 2px 0px">
          <Stack
            direction="row"
            gap={1}
            sx={{ backgroundColor: 'background.main' }}
            borderRadius="6px 6px 0px 0px"
            px={2}
            py={1}
          >
            <Stack direction="row" gap={1}>
              <Stack direction="row" alignItems="center">
                <SvgIcon
                  component={isDarkMode ? SafeShieldLogoDark : SafeShieldLogo}
                  inheritViewBox
                  sx={{ width: 14, height: 14 }}
                />
              </Stack>
            </Stack>
          </Stack>
        </Box>

        {/* Content Frame */}
        <Box padding={3}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Transaction details will be automatically scanned for potential risks and will appear here.
          </Typography>
        </Box>
      </Card>

      {/* Secured by Safe section */}
      <Stack direction="row" alignItems="center" alignSelf="flex-end">
        <Typography variant="body2" color="text.secondary" fontSize={13} lineHeight={1.38} whiteSpace="nowrap">
          Secured by
        </Typography>

        <SvgIcon
          component={isDarkMode ? SafeShieldLogoFullDark : SafeShieldLogoFull}
          inheritViewBox
          sx={{ width: 100.83, height: 14.87 }}
        />
      </Stack>
    </Stack>
  )
}

export default SafeShieldWidget
