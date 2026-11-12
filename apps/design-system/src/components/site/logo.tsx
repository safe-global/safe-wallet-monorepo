import Link from 'next/link'

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight" aria-label="Safe UI home">
      <span className="brand-mark grid size-6 place-items-center rounded-md text-[11px] font-bold" aria-hidden>
        S
      </span>
      <span>Safe UI</span>
    </Link>
  )
}
