import { type ReactNode } from 'react'
import { useRouteDetection } from '@/hooks/useRouteDetection'
import AccountAppFrame from '@/components/shell/AccountAppFrame'
import Header from '@/components/common/Header'
import css from './styles.module.css'

interface ShellLayoutProps {
  children: ReactNode
}

/**
 * Main layout component for the shell app
 * Provides header, sidebar (when in iframe mode), and content area
 */
const ShellLayout = ({ children }: ShellLayoutProps) => {
  const { mode, safeAddress, chainPrefix } = useRouteDetection()

  // In iframe mode, show header and sidebar with AccountAppFrame
  // In shell mode, show header only (no sidebar) with page content
  const showSidebar = mode === 'iframe' && safeAddress && chainPrefix

  return (
    <div className={css.container}>
      <header className={css.header}>
        <Header />
      </header>

      <div className={css.mainContainer}>
        {showSidebar && (
          <aside className={css.sidebar}>
            {/* Sidebar will be added later */}
            <div style={{ padding: '1rem', background: '#e0e0e0' }}>Sidebar Placeholder</div>
          </aside>
        )}

        <main className={showSidebar ? css.mainWithSidebar : css.main}>
          {mode === 'iframe' && safeAddress && chainPrefix ? (
            <AccountAppFrame safeAddress={safeAddress} chainPrefix={chainPrefix} />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  )
}

export default ShellLayout
