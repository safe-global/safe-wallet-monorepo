import { Box, Button, Grid, InputAdornment, MenuItem, Select, SvgIcon, TextField, Typography } from '@mui/material'
import React from 'react'
import SearchIcon from '@/public/images/common/search.svg'
import History from '@/public/images/common/history.svg'
function BadgesActions() {
  return (
    <Grid container spacing={1} item>
      <Grid item>
        <Typography variant="h3" fontSize={16} fontWeight={600}>
          Badges
        </Typography>
      </Grid>
      <Grid container spacing={2} item>
        <Grid item xs={7}>
          <TextField
            placeholder="Search by name or network"
            variant="filled"
            hiddenLabel
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SvgIcon component={SearchIcon} inheritViewBox color="border" />
                </InputAdornment>
              ),
              disableUnderline: true,
            }}
            fullWidth
          />
        </Grid>
        <Grid item xs={5}>
          <Box display="flex" gap={2}>
            <Select fullWidth renderValue={() => 'Select network'}>
              <MenuItem value="eth">Ethereum</MenuItem>
            </Select>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              endIcon={<SvgIcon component={History} inheritViewBox color="primary" />}
            >
              Update badges
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default BadgesActions
