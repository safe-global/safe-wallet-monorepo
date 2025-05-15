// this is copy-paste from https://github.com/edy/redux-persist-transform-filter/tree/master
// I've changed to typescript and modified the tests to work with jest

import { createTransform, Transform } from 'redux-persist'
import { set, get, unset, isEmpty, cloneDeep } from 'lodash'

type TransformType = 'whitelist' | 'blacklist'
type State = Record<string, unknown>

export type Path = string | string[] | { path: string; filterFunction: (value: unknown) => boolean }

export interface FilterObj {
  path: string
  filterFunction: (value: unknown) => boolean
}

/**
 * Filter object based on provided paths
 */
export const persistFilter = (
  state: State,
  paths: Path[] | Path,
  transformType: TransformType = 'whitelist',
): State => {
  // Convert single path to array for consistent handling
  const pathsArray: Path[] = Array.isArray(paths) ? paths : [paths]

  // For whitelist, start with empty object and add whitelisted properties
  if (transformType === 'whitelist') {
    const subset: State = {}

    pathsArray.forEach((path) => {
      if (typeof path === 'object' && 'path' in path) {
        // Handle filter function paths
        const { path: pathStr, filterFunction } = path
        const value = get(state, pathStr)

        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            // Handle arrays
            const filtered = value.filter(filterFunction)
            if (filtered.length > 0) {
              set(subset, pathStr, filtered)
            }
          } else {
            // Handle objects
            const filtered: Record<string, unknown> = {}

            Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
              if (filterFunction(val)) {
                filtered[key] = val
              }
            })

            if (!isEmpty(filtered)) {
              set(subset, pathStr, filtered)
            }
          }
        }
      } else {
        // Handle string or array paths
        const pathStr = Array.isArray(path) ? path.join('.') : path
        const value = get(state, pathStr)

        if (typeof value !== 'undefined') {
          set(subset, pathStr, value)
        }
      }
    })

    return subset
  } else {
    // For blacklist, start with deep copy of state and remove blacklisted properties
    const subset = cloneDeep(state)

    pathsArray.forEach((path) => {
      if (typeof path === 'object' && 'path' in path) {
        // Handle filter function paths
        const { path: pathStr, filterFunction } = path
        const value = get(state, pathStr)

        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            // For arrays, just empty the array if using filter functions
            set(subset, pathStr, [])
          } else {
            // For objects, remove keys where filter function is true
            const currentValue = get(subset, pathStr)

            if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
              Object.entries(currentValue as Record<string, unknown>).forEach(([key, val]) => {
                if (filterFunction(val)) {
                  unset(subset, `${pathStr}.${key}`)
                }
              })
            }
          }
        }
      } else {
        // Handle string or array paths
        const pathStr = Array.isArray(path) ? path.join('.') : path
        unset(subset, pathStr)
      }
    })

    return subset
  }
}

/**
 * Create a filter for redux-persist
 */
export function createFilter(
  reducerName: string,
  inboundPaths?: Path[] | Path,
  outboundPaths?: Path[] | Path,
  transformType: TransformType = 'whitelist',
): Transform<State, State> {
  return createTransform(
    // inbound
    (inboundState: State): State => {
      return inboundPaths ? persistFilter(inboundState, inboundPaths, transformType) : inboundState
    },
    // outbound
    (outboundState: State): State => {
      return outboundPaths ? persistFilter(outboundState, outboundPaths, transformType) : outboundState
    },
    { whitelist: [reducerName] },
  )
}

/**
 * Create a whitelist filter for redux-persist
 */
export function createWhitelistFilter(
  reducerName: string,
  inboundPaths?: Path[] | Path,
  outboundPaths?: Path[] | Path,
): Transform<State, State> {
  return createFilter(reducerName, inboundPaths, outboundPaths, 'whitelist')
}

/**
 * Create a blacklist filter for redux-persist
 */
export function createBlacklistFilter(
  reducerName: string,
  inboundPaths?: Path[] | Path,
  outboundPaths?: Path[] | Path,
): Transform<State, State> {
  return createFilter(reducerName, inboundPaths, outboundPaths, 'blacklist')
}

export default createFilter
