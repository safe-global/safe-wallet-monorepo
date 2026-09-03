import Image from 'next/image'

const ALT = 'A Workspace from Safe Pro, with its accounts, members and transactions'

const SafeProHero = () => (
  <div className="relative aspect-[1056/369] w-full overflow-hidden rounded-t-[calc(var(--radius-xl)-4px)]">
    <Image src="/images/safe-pro/pro-announcement-hero.jpg" alt={ALT} fill className="object-cover dark:hidden" />
    <Image
      src="/images/safe-pro/pro-announcement-hero-dark.svg"
      alt={ALT}
      fill
      unoptimized
      className="hidden object-cover dark:block"
    />
  </div>
)

export default SafeProHero
