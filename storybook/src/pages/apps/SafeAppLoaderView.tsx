import { Spinner } from '@/components/ui/spinner'

export type SafeAppLoaderViewProps = Record<string, never>

export const SafeAppLoaderView = () => {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="size-10" />
    </div>
  )
}
