import Resolution from '@unstoppabledomains/resolution'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'

export interface UdResolveOptions {
    token?: string
    network?: string
}

// Lazy-initialize Resolution instance
let resolutionInstance: Resolution | null = null

const getResolution = (): Resolution | null => {
    if (resolutionInstance) return resolutionInstance

    const apiKey = process.env.NEXT_PUBLIC_UNSTOPPABLE_API_KEY
    if (!apiKey) {
        logError(ErrorCodes._101, 'NEXT_PUBLIC_UNSTOPPABLE_API_KEY not configured for UD resolution')
        return null
    }

    try {
        resolutionInstance = new Resolution({
            apiKey,
        })
        return resolutionInstance
    } catch (e) {
        const err = e as Error
        logError(ErrorCodes._101, `Failed to initialize UD Resolution: ${err.message}`)
        return null
    }
}

/**
 * Resolve an Unstoppable Domain to an address (forward resolution)
 */
export const resolveUnstoppableAddress = async (
    domain: string,
    options?: UdResolveOptions,
): Promise<string | undefined> => {
    const resolution = getResolution()
    if (!resolution) return undefined

    try {
        // Use the token/network if provided, otherwise default to empty string
        const token = options?.token?.toUpperCase() || ''
        const network = options?.network?.toUpperCase() || ''

        const address = await resolution.getAddress(domain, network, token)
        return address || undefined
    } catch (e) {
        const err = e as Error
        // Resolution SDK throws for unregistered domains or unsupported TLDs, which is expected
        if (
            err.message?.includes('UnregisteredDomain') ||
            err.message?.includes('RecordNotFound') ||
            err.message?.includes('UnspecifiedResolver') ||
            err.message?.includes('UnsupportedDomain')
        ) {
            return undefined
        }
        logError(ErrorCodes._101, `UD resolution error: ${err.message}`)
        return undefined
    }
}

/**
 * Reverse resolve an address to an Unstoppable Domain name
 */
export const reverseResolveUnstoppable = async (address: string): Promise<string | undefined> => {
    const resolution = getResolution()
    if (!resolution) return undefined

    try {
        const domain = await resolution.reverse(address)
        return domain || undefined
    } catch (e) {
        const err = e as Error
        // Resolution SDK throws for addresses without reverse records, which is expected
        if (
            err.message?.includes('UnregisteredDomain') ||
            err.message?.includes('RecordNotFound') ||
            err.message?.includes('UnspecifiedResolver') ||
            err.message?.includes('ReverseResolutionNotSpecified')
        ) {
            return undefined
        }
        logError(ErrorCodes._101, `UD reverse resolution error: ${err.message}`)
        return undefined
    }
}



