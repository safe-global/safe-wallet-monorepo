import { useMemo } from 'react'
import { IPFS_HOSTS, IS_OFFICIAL_HOST, OFFICIAL_HOSTS } from '@/config/constants'
import packageJson from '../../package.json'
import useAsync from './useAsync'

const GITHUB_API_URL = 'https://api.github.com/repos/5afe/safe-wallet-ipfs/releases/tags'

async function getGithubRelease(version: string) {
  const resp = await fetch(`${GITHUB_API_URL}/v${version}`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
  })
  if (!resp.ok) return false
  return await resp.json()
}

async function isOfficialIpfs(): Promise<boolean> {
  const data = await getGithubRelease(packageJson.version)
  return data.body.includes(window.location.host)
}

function isIpfs() {
  return IPFS_HOSTS.test(window.location.host)
}

export const useIsOfficialHost = (): boolean => {
  const isOfficialHost = useMemo(
    () => IS_OFFICIAL_HOST && (typeof window === 'undefined' || OFFICIAL_HOSTS.test(window.location.host)),
    [],
  )

  const [isTrustedIpfs = false] = useAsync<boolean>(() => {
    if (isOfficialHost || !isIpfs()) return
    return isOfficialIpfs()
  }, [isOfficialHost])

  return isOfficialHost || isTrustedIpfs
}
