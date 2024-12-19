import type { NextPage } from 'next'
import Head from 'next/head'
import { Input, Button, Box } from '@mui/material'
import { useEffect, useState } from 'react'
import useWallet from '@/hooks/wallets/useWallet'
import { useWeb3 } from '@/hooks/wallets/web3'
import { claimSigner, ClaimSignerError } from 'src/services/tx/hsgsuper'
import { useRouter } from 'next/router'

const Claim: NextPage = () => {
  const router = useRouter()
  const { safe: safeAdd } = router.query
  const [inputValue, setInputValue] = useState<string>((safeAdd as string) ?? '')
  const [errMessage, setErrMessage] = useState('')
  const web3Provider = useWeb3()

  useEffect(() => {
    if (typeof safeAdd === 'string') {
      const parsed = safeAdd.split(':', 2)[1]
      setInputValue(parsed)
    }
  }, [safeAdd])

  const handleClaim = () => {
    claimSigner(web3Provider, inputValue).catch((err: ClaimSignerError) => {
      if (err !== ClaimSignerError.NoSigner) {
        setErrMessage('Cannot claim. Make sure your hat has authority.')
      }
    })
  }

  return (
    <>
      <Head>
        <title>Claim</title>
      </Head>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        style={{ padding: '20px', gap: '10px' }}
      >
        <Input
          name="safe-add"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setErrMessage('')
          }}
          placeholder="Enter safe address"
          style={{ width: '300px', marginBottom: '10px' }}
        />
        {errMessage && (
          <div style={{ color: 'red', fontSize: '14px', marginTop: '-5px', marginBottom: '10px' }}>{errMessage}</div>
        )}
        <Button variant="contained" color="primary" onClick={handleClaim}>
          Claim
        </Button>
      </Box>
    </>
  )
}

export default Claim
