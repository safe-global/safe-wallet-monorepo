import Link from 'next/link'
import { GITHUB_URL } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-(--site-max-width) flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground lg:px-6">
        <p className="m-0">
          Built by Safe. The source is on{' '}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
            GitHub
          </a>
          .
        </p>
        <Link href="/llms.txt" prefetch={false} className="hover:text-foreground">
          llms.txt
        </Link>
      </div>
    </footer>
  )
}
