import type { NextPage } from 'next'
import Grid from '@mui/material/Grid'
import { useSafeApps } from '@/hooks/useSafeApps'
import { AppCard } from '@/components/safe-apps/AppCard'

const Apps: NextPage = () => {
  const [apps, error, loading] = useSafeApps()

  if (error) {
    return <p>Error: {error.message}</p>
  }

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <main>
      <Grid container rowSpacing={2} columnSpacing={2}>
        {apps?.map((a) => (
          <Grid key={a.url} item xs={12} sm={6} md={3} xl={1.5}>
            <AppCard safeApp={a} />
          </Grid>
        ))}
      </Grid>
    </main>
  )
}

export default Apps
