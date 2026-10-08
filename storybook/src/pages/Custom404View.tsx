import SafeLogo from '@/components/common/SafeLogo'

export type Custom404ViewProps = {
  isRedirecting: boolean
}

export const Custom404View = ({ isRedirecting }: Custom404ViewProps) => {
  return (
    <main className="px-6 pt-[calc(var(--header-height)+1rem)]">
      <div className="fixed top-0 left-0 z-[1300] flex items-center px-6" style={{ height: 'var(--header-height)' }}>
        <SafeLogo />
      </div>
      {!isRedirecting && <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>404 – Page not found</h1>}
    </main>
  )
}
