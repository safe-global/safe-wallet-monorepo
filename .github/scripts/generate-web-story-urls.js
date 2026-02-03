/**
 * Generate Storybook URLs from changed web story files
 *
 * This script takes changed story files and converts them to Storybook preview URLs
 * for the deployed web Storybook
 */

const fs = require('fs')
const path = require('path')

const changedFiles = process.env.CHANGED_FILES || ''
const baseUrl = process.env.STORYBOOK_BASE_URL || 'http://localhost:6006'

if (!changedFiles) {
  console.log('No changed files provided')
  process.exit(0)
}

const files = changedFiles.split('\n').filter(Boolean)

console.log('Processing web story files:', files)

/**
 * Extract the title from the story file's meta export
 */
function extractTitleFromFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    if (!fs.existsSync(fullPath)) {
      return null
    }

    const content = fs.readFileSync(fullPath, 'utf-8')
    // Match title with proper quote handling (separate patterns for single/double quotes)
    // Use word boundary \b to ensure we match 'title:' and not 'Subtitle:' or other fields
    const titleMatch = content.match(/\btitle:\s*(?:"([^"]+)"|'([^']+)')/)
    if (titleMatch) {
      return titleMatch[1] || titleMatch[2]
    }
    return null
  } catch (error) {
    console.error(`Error extracting title from ${filePath}:`, error.message)
    return null
  }
}

/**
 * Convert title to Storybook story ID
 */
function titleToStoryId(title) {
  return title.replace(/\//g, '-').replace(/\s+/g, '-').toLowerCase()
}

/**
 * Fallback: Convert file path to story ID
 * Storybook auto-generates titles from file paths like:
 * apps/web/src/components/common/Chip/Chip.stories.tsx -> Components/Common/Chip
 * Which becomes story ID: components-common-chip
 */
function filePathToStoryId(filePath) {
  let normalized = filePath.replace(/^apps\/web\//, '')
  normalized = normalized.replace(/^src\//, '')
  normalized = normalized.replace(/\.(stories|story)\.(tsx?|jsx?)$/, '')
  normalized = normalized.replace(/\/index$/, '')

  // Remove duplicate filename if it matches parent directory (e.g., Chip/Chip -> Chip)
  const parts = normalized.split('/')
  if (parts.length >= 2 && parts[parts.length - 1].toLowerCase() === parts[parts.length - 2].toLowerCase()) {
    parts.pop()
  }

  // Convert path to story ID format (path/to/Component -> path-to-component)
  return parts.join('-').toLowerCase()
}

/**
 * Parse story file to extract story names
 */
function extractStoryNames(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    if (!fs.existsSync(fullPath)) {
      return []
    }

    const content = fs.readFileSync(fullPath, 'utf-8')
    const stories = []

    const namedExportRegex = /export\s+const\s+(\w+)\s*[:=]/g
    let match
    while ((match = namedExportRegex.exec(content)) !== null) {
      const name = match[1]
      if (name !== 'default' && name !== 'meta' && name !== 'Meta') {
        stories.push(name)
      }
    }

    if (stories.length === 0) {
      stories.push('Default')
    }

    return stories
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message)
    return ['Default']
  }
}

const storyUrls = []

for (const file of files) {
  const title = extractTitleFromFile(file)
  const storyId = title ? titleToStoryId(title) : filePathToStoryId(file)
  const storyNames = extractStoryNames(file)

  console.log(`File: ${file}`)
  console.log(`Title: ${title || '(not found, using file path)'}`)
  console.log(`Story ID: ${storyId}`)
  console.log(`Stories: ${storyNames.join(', ')}`)

  for (const storyName of storyNames) {
    const storySlug = storyName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

    const url = `${baseUrl}/iframe.html?id=${storyId}--${storySlug}&viewMode=story`
    storyUrls.push({
      url,
      file,
      componentName: title || storyId,
      storyName,
    })
  }
}

console.log('\nGenerated URLs:')
console.log(JSON.stringify(storyUrls, null, 2))

fs.mkdirSync('web-storybook-screenshots', { recursive: true })
fs.writeFileSync('web-storybook-screenshots/story-urls.json', JSON.stringify(storyUrls, null, 2))

const outputFile = process.env.GITHUB_OUTPUT
if (outputFile) {
  fs.appendFileSync(outputFile, `urls=${JSON.stringify(storyUrls)}\n`)
  fs.appendFileSync(outputFile, `has_urls=${storyUrls.length > 0 ? 'true' : 'false'}\n`)
}

console.log(`\nGenerated ${storyUrls.length} web story URLs`)
