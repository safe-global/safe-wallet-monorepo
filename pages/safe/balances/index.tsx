import type { NextPage } from 'next'
import { Grid } from '@mui/material'

import AssetsTable from '@/components/balances/AssetsTable'
import CurrencySelect from '@/components/balances/CurrencySelect'
import useBalances from '@/services/useBalances'

const Balances: NextPage = () => {
  const { balances } = useBalances()

  return (
    <main>
      <Grid container spacing={2}>
        <Grid item>
          <h2 style={{ margin: 0 }}>Balances</h2>
        </Grid>

        <Grid item xs />

        <Grid item xs>
          <CurrencySelect />
        </Grid>
      </Grid>

      <AssetsTable items={balances?.items} />
    </main>
  )
}

export default Balances
