const SpaceAvatar = ({ initial }: { initial: string }) => (
  <div className="shrink-0 flex size-9 items-center justify-center rounded-full bg-[var(--color-static-text-brand)] text-white text-sm font-semibold overflow-hidden">
    {initial}
  </div>
)

export default SpaceAvatar
