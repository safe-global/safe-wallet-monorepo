import { useEffect, useRef, useState, type ReactElement } from 'react'
import { cn } from '@/utils/cn'
import type { SafenetCheckPhase } from '../types'
import css from './SafenetShieldPill.module.css'

type Tone = 'ok' | 'bad' | 'warn'

const TONE: Partial<Record<SafenetCheckPhase, Tone>> = { 'no-issues': 'ok', risk: 'bad', unavailable: 'warn' }

const TONE_COLOR: Record<Tone, string> = {
  ok: 'text-[var(--color-success-main)]',
  bad: 'text-[var(--color-error-main)]',
  warn: 'text-[var(--color-warning-main)]',
}

const SHIELD = 'M8 1.7l5.2 2v4.1c0 3.2-2.1 5.8-5.2 6.8-3.1-1-5.2-3.6-5.2-6.8V3.7z'

const Glyph = ({ tone }: { tone: Tone }): ReactElement => {
  if (tone === 'ok') {
    return (
      <path
        className={css.glyph}
        d="M5.4 8.15l1.85 1.85 3.45-3.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }
  if (tone === 'bad') {
    return (
      <>
        <path className={css.glyph} d="M8 4.9v3.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="8" cy="11.2" r=".95" fill="currentColor" />
      </>
    )
  }
  return (
    <path
      className={css.glyph}
      d="M8 5.3v3l1.9 1.2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

/** The Safe Shield mark under the panel. The shield fills and its glyph draws in when Safenet reports. */
export const SafenetShieldPill = ({ phase }: { phase?: SafenetCheckPhase }): ReactElement => {
  const tone = phase ? TONE[phase] : undefined
  const previousTone = useRef<Tone | undefined>(undefined)
  const [animation, setAnimation] = useState<'fire' | 'settle'>()

  useEffect(() => {
    if (tone && tone !== previousTone.current) setAnimation(tone === 'ok' ? 'fire' : 'settle')
    if (!tone) setAnimation(undefined)
    previousTone.current = tone
  }, [tone])

  return (
    <span
      data-testid="safenet-shield-pill"
      data-tone={tone}
      className={cn(
        'inline-flex items-center gap-1.5 text-[10.5px] leading-none text-muted-foreground',
        animation && css[animation],
      )}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 16 16"
        aria-hidden="true"
        key={animation ? `${tone}-${animation}` : 'idle'}
        className={cn(css.icon, 'shrink-0', tone ? TONE_COLOR[tone] : 'text-muted-foreground')}
      >
        {tone && <path d={SHIELD} fill="currentColor" opacity=".17" />}
        <path d={SHIELD} fill="none" stroke="currentColor" strokeWidth="1.3" />
        {tone && <Glyph tone={tone} />}
      </svg>
      <span>
        <b className="font-bold text-foreground/70">Safe</b> Shield
      </span>
    </span>
  )
}

export default SafenetShieldPill
