import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import AuthState from '@/features/spaces/components/AuthState'
import { useState } from 'react'
import { Paper, Button, CircularProgress } from '@mui/material'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { canAccessPro } from '@/services/pro/api'

export default function ProPage() {
  const router = useRouter()
  const { spaceId } = router.query
  const [canAccessProFeature, setCanAccessProFeature] = useState(false)
  const [loading, setLoading] = useState(false)
  const feature = 'test'

  if (!router.isReady || !spaceId || typeof spaceId !== 'string') return null

  useAsync(async () => {
    try {
      setLoading(true)
      const result = await canAccessPro(spaceId as string, feature)
      setCanAccessProFeature(result)
    } catch (error) {
      console.error('Error checking Pro access:', error)
      setCanAccessProFeature(false)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Safe Pro`}</title>
      </Head>

      <main>
        <AuthState spaceId={spaceId}>
          <Paper style={{ padding: '2rem', textAlign: 'center' }}>
            {loading ? (
              <CircularProgress />
            ) : (
              <>
                {canAccessProFeature ? (
                  <div>
                    <h1>Welcome to the Pro Feature!</h1>
                    <p>You have access to exclusive content and features.</p>
                  </div>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => {
                      router.push({ pathname: '/spaces/settings', query: router.query })
                    }}
                  >
                    Subscribe
                  </Button>
                )}
              </>
            )}
          </Paper>
        </AuthState>
      </main>
    </>
  )
}
