/**
 * Typed middleware implementations using the new event catalog and provider constants.
 * These middlewares work with EventUnion types and provide compile-time safety.
 */

import type { EventUnion, EventName, EventMap } from '../events/catalog'
import type { ProviderId } from '../providers/constants'
import { EVENT } from '../events/catalog'
import { PROVIDER } from '../providers/constants'

export type TypedMiddleware<E extends Record<string, Record<string, unknown>>> = (
    event: EventUnion<E>,
    next: (event: EventUnion<E>) => void,
) => void

/**
 * Event renaming middleware using typed event constants
 */
export const createEventRenameMiddleware = <E extends Record<string, Record<string, unknown>>>(
    renameMap: Partial<Record<EventName, string>>
): TypedMiddleware<E> => {
    return (event, next) => {
        const newName = renameMap[event.name as EventName] || event.name
        next({
            ...event,
            name: newName,
        } as EventUnion<E>)
    }
}

/**
 * Provider filtering middleware using typed provider constants
 */
export const createProviderFilterMiddleware = <E extends Record<string, Record<string, unknown>>>(
    rules: Partial<Record<EventName, { includeProviders?: ProviderId[]; excludeProviders?: ProviderId[] }>>
): TypedMiddleware<E> => {
    return (event, next) => {
        const rule = rules[event.name as EventName]
        if (rule) {
            // Add routing metadata to event context
            const enrichedEvent = {
                ...event,
                context: {
                    ...event.context,
                    routing: rule,
                },
            }
            next(enrichedEvent)
        } else {
            next(event)
        }
    }
}

/**
 * Event sampling middleware with per-event rates using typed constants
 */
export const createTypedSamplingMiddleware = <E extends Record<string, Record<string, unknown>>>(options: {
    defaultRate: number
    eventRates?: Partial<Record<EventName, number>>
}): TypedMiddleware<E> => {
    const { defaultRate, eventRates = {} } = options

    return (event, next) => {
        const eventRate = eventRates[event.name as EventName] ?? defaultRate
        const shouldSample = Math.random() < eventRate

        if (!shouldSample) {
            return // Drop the event
        }

        // Add sampling metadata
        const sampledEvent = {
            ...event,
            context: {
                ...event.context,
                sampled: true,
                sampleRate: eventRate,
            },
        }

        next(sampledEvent)
    }
}

/**
 * PII scrubbing middleware with configurable field detection
 */
export const createPiiScrubberMiddleware = <E extends Record<string, Record<string, unknown>>>(options?: {
    piiFields?: string[]
    emailPattern?: RegExp
    replaceWith?: string
}): TypedMiddleware<E> => {
    const {
        piiFields = ['email', 'phone', 'address', 'ssn'],
        emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        replaceWith = '[REDACTED]',
    } = options || {}

    const scrubValue = (value: any): any => {
        if (typeof value === 'string') {
            // Scrub email patterns
            return value.replace(emailPattern, replaceWith)
        }

        if (Array.isArray(value)) {
            return value.map(scrubValue)
        }

        if (value && typeof value === 'object') {
            const scrubbed: any = {}
            for (const [key, val] of Object.entries(value)) {
                if (piiFields.includes(key.toLowerCase())) {
                    scrubbed[key] = replaceWith
                } else {
                    scrubbed[key] = scrubValue(val)
                }
            }
            return scrubbed
        }

        return value
    }

    return (event, next) => {
        const scrubbedEvent = {
            ...event,
            payload: scrubValue(event.payload),
            context: event.context ? {
                ...event.context,
                // Don't scrub userId/safeAddress as they're not PII in our context
            } : event.context,
        }

        next(scrubbedEvent)
    }
}

/**
 * Mixpanel naming convention enforcement middleware
 */
export const createMixpanelNamingMiddleware = <E extends Record<string, Record<string, unknown>>>(): TypedMiddleware<E> => {
    const toPascalCase = (str: string): string => {
        return str
            .replace(/([a-z])([A-Z])/g, '$1 $2') // Handle existing camelCase
            .toLowerCase()
            .replace(/[_-]/g, ' ') // snake_case and kebab-case to spaces
            .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize each word
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim()
    }

    const toTitleCase = (str: string): string => {
        return str
            .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to space-separated
            .replace(/_/g, ' ') // snake_case to space-separated
            .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize first letter of each word
    }

    return (event, next) => {
        // Convert event name to PascalCase
        const pascalCaseEventName = toPascalCase(event.name)

        // Convert payload properties to Title Case
        const convertedPayload: any = {}
        if (event.payload && typeof event.payload === 'object') {
            for (const [key, value] of Object.entries(event.payload)) {
                const titleCaseKey = toTitleCase(key)
                convertedPayload[titleCaseKey] = value
            }
        }

        const convertedEvent = {
            ...event,
            name: pascalCaseEventName,
            payload: convertedPayload,
        } as EventUnion<E>

        next(convertedEvent)
    }
}

/**
 * Debug logging middleware using typed constants
 */
export const createDebugLoggingMiddleware = <E extends Record<string, Record<string, unknown>>>(options?: {
    enabled?: boolean
    prefix?: string
    includePayload?: boolean
    includeContext?: boolean
    eventFilter?: EventName[]
}): TypedMiddleware<E> => {
    const {
        enabled = process.env.NODE_ENV !== 'production',
        prefix = '[Analytics Debug]',
        includePayload = true,
        includeContext = false,
        eventFilter,
    } = options || {}

    return (event, next) => {
        if (enabled) {
            // Filter events if specified
            if (eventFilter && !eventFilter.includes(event.name as EventName)) {
                next(event)
                return
            }

            const logData: any = {
                event: event.name,
                timestamp: event.timestamp,
            }

            if (includePayload) {
                logData.payload = event.payload
            }

            if (includeContext) {
                logData.context = event.context
            }

            console.log(prefix, logData)
        }

        next(event)
    }
}

/**
 * Event validation middleware using Zod schemas
 */
export const createEventValidationMiddleware = <E extends Record<string, Record<string, unknown>>>(options?: {
    strict?: boolean
    onValidationError?: (eventName: string, error: any) => void
}): TypedMiddleware<E> => {
    const { strict = false, onValidationError } = options || {}

    return (event, next) => {
        try {
            // Import validation function dynamically to avoid circular dependencies
            const { validateEvent } = require('../events/catalog')
            validateEvent(event.name as EventName, event.payload)
            next(event)
        } catch (error) {
            if (onValidationError) {
                onValidationError(event.name, error)
            }

            if (strict) {
                // Drop invalid events in strict mode
                return
            } else {
                // Continue with invalid events in non-strict mode
                next(event)
            }
        }
    }
}

// Pre-configured middleware combinations
export const createSafeAnalyticsMiddleware = <E extends Record<string, Record<string, unknown>>>(): TypedMiddleware<E>[] => {
    return [
        createEventValidationMiddleware<E>({ strict: false }),
        createPiiScrubberMiddleware<E>(),
        createTypedSamplingMiddleware<E>({
            defaultRate: 1.0,
            eventRates: {
                [EVENT.PageView]: 0.1, // Sample page views at 10%
                [EVENT.ClickedCta]: 0.5, // Sample CTA clicks at 50%
            },
        }),
        createDebugLoggingMiddleware<E>({
            enabled: process.env.NODE_ENV !== 'production',
            includePayload: true,
            includeContext: false,
        }),
    ]
}