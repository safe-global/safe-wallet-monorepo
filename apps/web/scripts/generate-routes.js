import * as fs from 'fs'
import path from 'path'

const isFile = (item) => item.endsWith`.tsx`

// For checking if an entire folder name is [param]
const DYNAMIC_FOLDER_REGEX = /^\[(.+)\]$/

// For finding all [param] segments in a route string
const BRACKETED_SEGMENTS_REGEX = /\[(.+?)\]/g

function makeKeyFromName(name) {
  const dynamicMatch = name.match(DYNAMIC_FOLDER_REGEX)
  if (dynamicMatch) {
    name = dynamicMatch[1]
  }

  return name.replace(/[-_]\w/g, (m) => m[1].toUpperCase())
}

const iterate = (folderName, parentRoute, root) => {
  const items = fs.readdirSync(folderName)

  items
    .sort((a, b) => (isFile(a) ? -1 : 1))
    .forEach((item) => {
      // Skip service files
      if (/_app|_document/.test(item)) return

      const fullPath = path.join(folderName, item)

      // A folder, continue iterating
      if (!isFile(item)) {
        const isDynamic = DYNAMIC_FOLDER_REGEX.test(item)

        if (isDynamic) {
          const dynamicSegment = item.slice(1, -1)
          const nextRoute = `${parentRoute}/[${dynamicSegment}]`
          // Recurse without creating a new sub-object
          iterate(fullPath, nextRoute, root)
        } else {
          const key = makeKeyFromName(item)

          if (!root[key]) {
            root[key] = {}
          }

          const nextRoute = `${parentRoute}/${item}`
          iterate(fullPath, nextRoute, root[key])
        }

        return
      }

      // A file
      const name = item.split('.')[0]
      const routePath = name === 'index' ? parentRoute : `${parentRoute}/${name}`
      const key = makeKeyFromName(name)

      const dynamicMatches = [...routePath.matchAll(BRACKETED_SEGMENTS_REGEX)]
      if (dynamicMatches.length === 0) {
        root[key] = routePath || '/'
      } else {
        const paramNames = dynamicMatches.map((m) => m[1])

        root[key] = {
          __dynamicFn: {
            paramNames,
            routeTemplate: routePath,
          },
        }
      }
    })

  return root
}

/**
 * Convert the "route tree object" into a string of valid
 * JavaScript/TypeScript code, embedding arrow functions for dynamic routes.
 */
function generateRoutesCode(obj, indent = 2) {
  if (obj && typeof obj === 'object' && '__dynamicFn' in obj) {
    const { paramNames, routeTemplate } = obj.__dynamicFn

    let fnBody = routeTemplate.replace(BRACKETED_SEGMENTS_REGEX, (_, p1) => `\${${p1}}`)

    const signature = paramNames.map((p) => `${p}: string`).join(', ')
    return `(${signature}) => \`${fnBody}\``
  }

  if (Array.isArray(obj)) {
    const items = obj.map((item) => generateRoutesCode(item, indent + 2))
    return `[${items.join(', ')}]`
  }

  if (obj && typeof obj === 'object') {
    // It's a nested object of routes
    const entries = Object.entries(obj)
    const spacing = ' '.repeat(indent)
    const innerSpacing = ' '.repeat(indent + 2)

    const props = entries.map(([key, value]) => {
      // If the key is not a valid identifier, quote it
      const safeKey = /^[a-zA-Z_]\w*$/.test(key) ? key : JSON.stringify(key)

      return `${innerSpacing}${safeKey}: ${generateRoutesCode(value, indent + 2)}`
    })

    return `{\n${props.join(',\n')}\n${spacing}}`
  }

  // Otherwise, it's presumably a string route => quote it
  return JSON.stringify(obj)
}

function main() {
  const routes = iterate('src/pages', '', {})
  const code = `export const AppRoutes = ${generateRoutesCode(routes, 2)}\n`

  console.log(code)
}

main()
