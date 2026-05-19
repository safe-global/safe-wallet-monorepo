import { useRouter } from 'next/router'
import { ArrowRight } from 'lucide-react'
import { AppRoutes } from '@/config/routes'

export const BANNER_HEIGHT = 36

const OldInterfaceBanner = () => {
  const router = useRouter()

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex w-full items-center justify-center gap-3 bg-[#f0fdf4] px-4 dark:bg-[#0a1f0d]"
      style={{ height: BANNER_HEIGHT }}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-[#16a34a] dark:bg-[#00C853]" />

      <p className="text-[13px] text-[#374151] dark:text-[#d1d5db]">
        <span className="font-medium text-[#111827] dark:text-white">Safe&#123;Wallet&#125; has a new interface.</span>
        {' '}This view is available until June 1.
      </p>

      <button
        type="button"
        onClick={() => router.push(AppRoutes.welcome.spaces)}
        className="ml-1 inline-flex items-center gap-1 text-[13px] font-bold text-[#111827] underline decoration-[#111827]/30 underline-offset-2 transition-opacity hover:opacity-70 dark:text-white dark:decoration-white/30"
      >
        Switch to new interface
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  )
}

export default OldInterfaceBanner
