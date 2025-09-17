import { COOKIE_LINK } from '@/config/constants'
import { Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

const CookiePolicy = () => {
  const [content, setContent] = useState<string>('')

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(COOKIE_LINK)
        let text = await response.text()
        text = text.replace(/\${origin}/g, window.location.origin)
        setContent(text)
      } catch (error) {
        console.error('Error fetching cookie policy:', error)
      }
    }

    fetchContent()
  }, [])

  return (
    <main>
      {content ? <ReactMarkdown>{content}</ReactMarkdown> : <Typography>Loading cookie policy...</Typography>}
    </main>
  )
}

export default CookiePolicy
