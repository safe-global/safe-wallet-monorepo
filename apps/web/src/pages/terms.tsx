import { TERMS_LINK } from '@/config/constants'
import { Typography } from '@mui/material'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

const SafeTerms = () => {
  const [content, setContent] = useState<string>('')

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(TERMS_LINK)
        const text = await response.text()
        setContent(text)
      } catch (error) {
        console.error('Error fetching terms:', error)
      }
    }

    fetchContent()
  }, [])

  return <main>{content ? <ReactMarkdown>{content}</ReactMarkdown> : <Typography>Loading terms...</Typography>}</main>
}

const Terms: NextPage = () => {
  return (
    <>
      <Head>
        <title>Terms and Conditions</title>
      </Head>

      <main>
        <SafeTerms />
      </main>
    </>
  )
}

export default Terms
