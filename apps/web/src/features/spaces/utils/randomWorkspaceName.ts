import { getRandomAdjective } from '@/hooks/useMnemonicName'

/** Placeholder for a Workspace created before its owner names it, in the "Brave Ethereum Safe" tradition. */
export const randomWorkspaceName = (): string => `${getRandomAdjective()} Workspace`
