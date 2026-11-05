import * as fs from 'fs'

const isFile = (item) => item.endsWith`.tsx`

const iterate = (folderName, parentRoute, root) => {
  const items = fs.readdirSync(folderName)

  items
    .sort((a, b) => (isFile(a) ? -1 : 1))
    .forEach((item) => {
      // Skip service files
      if (/_app|_document/.test(item)) return

      // A folder, continue iterating
      if (!isFile(item)) {
        const key = item.replace(/-\w/g, (match) => match.replace(/-/g, '').toUpperCase()) // spending-limit -> spendingLimit
        root[key] = {}
        iterate(`${folderName}/${item}`, `${parentRoute}/${item}`, root[key])
        return
      }

      // A file
      const name = item.split('.')[0]
      const path = name === 'index' ? parentRoute : `${parentRoute}/${name}`
      const key = name
        .replace(/-\w/g, (match) => match.replace(/-/g, '').toUpperCase()) // spending-limit -> spendingLimit
        .replace(/\W/g, '') // [txId] -> txId
      root[key] = path || '/'
    })

  return root
}

const routes = iterate('src/pages', '', {})

console.log(`export const AppRoutes = ${JSON.stringify(routes, null, 2)}`)
