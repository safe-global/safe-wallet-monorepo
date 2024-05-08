import { Box, Card, CardActions, CardContent, IconButton, Stack, SvgIcon, Typography } from '@mui/material'
import React from 'react'
import Concept from '@/public/images/concept/base.png'
import Image from 'next/image'
import SuperChainPoints from '@/public/images/common/superChain.svg'
import Hearth from '@/public/images/common/hearth.svg'
import css from './styles.module.css'
function Badge() {
  return (
    <Card className={css.badgeContainer}>
      <CardContent>
        <Stack padding={0} justifyContent="center" alignItems="center" spacing={1} position="relative">
          <IconButton className={css.hearth}>
            <SvgIcon component={Hearth} inheritViewBox fontSize="small" />
          </IconButton>
          <Image src={Concept} alt="base" />
          <Typography margin={0} fontWeight={600} fontSize={16} textAlign="center" variant="h4">
            Base User
          </Typography>
          <Typography margin={0} fontSize={14} fontWeight={400} textAlign="center" color="text.secondary">
            Number of transactions made on Base
          </Typography>
          <Box border={2} borderRadius={1} padding="12px" borderColor="secondary.main">
            <Typography margin={0} textAlign="center" color="secondary.main">
              Unlock Next Tier:
            </Typography>
            <Typography textAlign="center" margin={0}>
              400 transactions on Base
            </Typography>
          </Box>
        </Stack>
      </CardContent>
      <CardActions>
        <Box width="100%" display="flex" pt={3} justifyContent="center" alignItems="center">
          20 <SvgIcon component={SuperChainPoints} inheritViewBox fontSize="medium" />
        </Box>
      </CardActions>
    </Card>
  )
}

export default Badge
