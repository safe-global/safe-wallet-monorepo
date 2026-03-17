/* eslint-disable */
/**
 * This script generates the possible names for the SafeFontIcon component
 */

const fs = require('fs')
const path = require('path')

const configFilePath = path.join(__dirname, '../assets/fonts/safe-icons/safe-icons.icomoon.json')

// Read the IcoMoon config file
const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'))

// Get the icon names (support both old and new IcoMoon formats)
let iconNames

if ('icons' in config) {
  // Old format (selection.json)
  iconNames = config.icons.map((icon) => icon.icon.tags[0]).filter(Boolean)
} else if ('glyphs' in config) {
  // New format (icomoon.json)
  iconNames = config.glyphs.map((glyph) => glyph.extras.name).filter(Boolean)
} else {
  throw new Error('Invalid IcoMoon config: expected "icons" or "glyphs"')
}

// Create TypeScript union type
const typeDef = `export type IconName =\n  ${iconNames.map((name) => `| '${name}'`).join('\n  ')}\n`

// Create an array of icon names
const arrayDef = `export const iconNames: IconName[] = [\n  ${iconNames.map((name) => `'${name}'`).join(',\n  ')},\n]`

// Write the type definition to a file
fs.writeFileSync(path.join(__dirname, '../src/types/iconTypes.ts'), `${typeDef}\n${arrayDef}\n`)

console.log('Icon type and Icon names generated')
