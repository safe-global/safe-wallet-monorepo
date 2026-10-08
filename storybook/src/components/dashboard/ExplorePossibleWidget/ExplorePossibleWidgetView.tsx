import type { ReactElement, Ref } from 'react'
import type { UrlObject } from 'url'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import css from './styles.module.css'

export type ExplorePossibleApp = {
  id: string
  title: string
  subtitle?: string
  badge?: string
  iconUrl: string
  link: string | UrlObject
}

export type ExplorePossibleWidgetViewProps = {
  apps: ExplorePossibleApp[]
  listRef: Ref<HTMLUListElement>
  canScrollLeft: boolean
  canScrollRight: boolean
  onScrollLeft: () => void
  onScrollRight: () => void
  onListScroll: () => void
  onAppClick: (appId: string, title: string) => void
}

export function ExplorePossibleWidgetView({
  apps,
  listRef,
  canScrollLeft,
  canScrollRight,
  onScrollLeft,
  onScrollRight,
  onListScroll,
  onAppClick,
}: ExplorePossibleWidgetViewProps): ReactElement {
  return (
    <section className="overflow-hidden rounded-xl bg-[var(--color-background-paper)] px-6 pb-3 pt-5">
      <div style={{ position: 'relative' }}>
        {/* Gradient fade on the right */}
        <div
          className={css.gradientFade}
          style={{
            background: `linear-gradient(to left, var(--color-background-paper), transparent)`,
          }}
          aria-hidden="true"
        />

        {/* Header with title and navigation */}
        <div className={css.header}>
          <h2 className={css.headerTitle}>Explore what&apos;s possible</h2>
          {(canScrollLeft || canScrollRight) && (
            <nav className={css.carouselNav} aria-label="Carousel navigation">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Scroll to previous apps"
                onClick={onScrollLeft}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Scroll to next apps"
                onClick={onScrollRight}
                disabled={!canScrollRight}
              >
                <ChevronRight className="size-5" />
              </Button>
            </nav>
          )}
        </div>

        {/* Scrollable container */}
        <ul
          ref={listRef}
          onScroll={onListScroll}
          className={css.carouselContainer}
          role="list"
          aria-label="Explore possible features"
          tabIndex={0}
        >
          {apps.map((app) => (
            <li key={app.id} className={css.carouselItem}>
              <Link
                href={app.link}
                className={css.cardLink}
                onClick={() => onAppClick(app.id, app.title)}
                aria-label={app.subtitle ? `${app.title} ${app.badge} ${app.subtitle}` : app.title}
              >
                <div className={`${css.card} ${app.id === 'earn' ? css.earnCard : ''}`}>
                  {/* Icon */}
                  <div className={css.iconContainer}>
                    <img src={app.iconUrl} alt={`${app.title} icon`} className={css.icon} />
                  </div>

                  {/* Title with optional badge and subtitle */}
                  <div className={css.titleContainer}>
                    <p className={css.title}>
                      {app.title}
                      {app.badge && <span className={css.badge}>{app.badge}</span>}
                    </p>
                    {app.subtitle && <p className={css.subtitle}>{app.subtitle}</p>}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
