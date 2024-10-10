import type { NextPage } from 'next'
import Head from 'next/head'

import AssetsTable from '@/components/balances/AssetsTable'
import useBalances from '@/hooks/useBalances'
import { useState } from 'react'

import PagePlaceholder from '@/components/common/PagePlaceholder'
import NoAssetsIcon from '@/public/images/balances/no-assets.svg'
import { Typography } from '@mui/material'
import css from './styles.module.css'
// import HiddenTokenButton from '@/components/balances/HiddenTokenButton'
// import CurrencySelect from '@/components/balances/CurrencySelect'
// import TokenListSelect from '@/components/balances/TokenListSelect'

const Balances: NextPage = () => {
  const { error } = useBalances()
  const [showHiddenAssets, setShowHiddenAssets] = useState(false)
  const toggleShowHiddenAssets = () => setShowHiddenAssets((prev) => !prev)

  return (
    <>
      <Head>
        <title>Superchain Account – Assets</title>
      </Head>

      {/* <AssetsHeader>
        <HiddenTokenButton showHiddenAssets={showHiddenAssets} toggleShowHiddenAssets={toggleShowHiddenAssets} />
        <TokenListSelect />
        <CurrencySelect />
      </AssetsHeader> */}

      <div className={css.container}>
        <Typography component="h2" fontWeight={600} fontSize={16} marginBottom={1}>
          Assets
        </Typography>

        {error ? (
          <PagePlaceholder img={<NoAssetsIcon />} text="There was an error loading your assets" />
        ) : (
          <AssetsTable setShowHiddenAssets={setShowHiddenAssets} showHiddenAssets={showHiddenAssets} />
        )}
      </div>
    </>
  )
}

export default Balances
