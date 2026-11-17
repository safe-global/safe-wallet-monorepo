import type { ReactElement } from 'react'

const SIZE = 16
const CENTER = SIZE / 2
const OUTER = 7
const INNER = 4.5

const wedge = (ratio: number) => {
  const angle = 2 * Math.PI * ratio
  const x = CENTER + INNER * Math.sin(angle)
  const y = CENTER - INNER * Math.cos(angle)
  return `M ${CENTER} ${CENTER} L ${CENTER} ${CENTER - INNER} A ${INNER} ${INNER} 0 ${ratio > 0.5 ? 1 : 0} 1 ${x} ${y} Z`
}

// A pie, not a segmented arc: arcs read as a loading spinner.
const SignatureGauge = ({ count, threshold }: { count: number; threshold: number }): ReactElement => {
  const ratio = threshold > 0 ? Math.min(count / threshold, 1) : 1
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={`shrink-0 ${ratio === 1 ? 'text-success-strong' : 'text-foreground'}`}
      aria-hidden="true"
    >
      <circle cx={CENTER} cy={CENTER} r={OUTER} fill="none" strokeWidth={1.5} className="stroke-current" />
      {ratio === 1 ? (
        <circle cx={CENTER} cy={CENTER} r={INNER} className="fill-current" />
      ) : (
        ratio > 0 && <path d={wedge(ratio)} className="fill-current" />
      )}
    </svg>
  )
}

export default SignatureGauge
