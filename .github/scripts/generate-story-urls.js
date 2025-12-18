/**
 * Generate Storybook URLs from changed story files
 *
 * This script takes changed story files and converts them to Storybook preview URLs
 */

const fs = require('fs')
const path = require('path')

const changedFiles = process.env.CHANGED_FILES || ''
const branchName = process.env.BRANCH_NAME || ''

if (!changedFiles || !branchName) {
  console.log('No changed files or branch name provided')
  process.exit(0)
}

const baseUrl = `https://${branchName}--walletweb.review.5afe.dev/storybook`
const files = changedFiles.split('\n').filter(Boolean)

console.log('Processing files:', files)

/**
 * Extract the title from the story file's meta export
 * Parses: title: 'Components/Common/Button' or title: "Components/Common/Button"
 */
function extractTitleFromFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    if (!fs.existsSync(fullPath)) {
      return null
    }

    const content = fs.readFileSync(fullPath, 'utf-8')

    // Match title with proper quote handling (separate patterns for single/double quotes)
    const titleMatch = content.match(/title:\s*(?:"([^"]+)"|'([^']+)')/)
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
 * Example: 'Features/Portfolio/PortfolioRefreshHint' -> 'features-portfolio-portfoliorefreshhint'
 */
function titleToStoryId(title) {
  return title.replace(/\//g, '-').replace(/\s+/g, '-').toLowerCase()
}

/**
 * Convert file path to Storybook story ID (fallback when title can't be extracted)
 * Example: src/components/common/CopyButton/index.stories.tsx
 * -> components-common-copybutton
 *
 * Note: Storybook derives story IDs from the directory path, not the filename.
 * When no explicit title is set, Storybook uses the directory structure.
 */
function filePathToStoryId(filePath) {
  // Remove apps/web/ prefix if present
  let normalized = filePath.replace(/^apps\/web\//, '')

  // Remove src/ prefix
  normalized = normalized.replace(/^src\//, '')

  // Get directory path only (remove filename)
  // This matches how Storybook derives story IDs when no title is specified
  const parts = normalized.split('/')
  const filename = parts.pop() // Remove the filename
  normalized = parts.join('/')

  // Convert path separators to hyphens and lowercase
  normalized = normalized.replace(/\//g, '-').toLowerCase()

  return normalized
}

/**
 * Parse story file to extract story names
 */
function extractStoryNames(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${fullPath}`)
      return []
    }

    const content = fs.readFileSync(fullPath, 'utf-8')
    const stories = []

    // Match: export const StoryName = ...
    const namedExportRegex = /export\s+const\s+(\w+)\s*[:=]/g
    let match
    while ((match = namedExportRegex.exec(content)) !== null) {
      const name = match[1]
      // Skip meta exports
      if (name !== 'default' && name !== 'meta' && name !== 'Meta') {
        stories.push(name)
      }
    }

    // If no stories found, add a 'default' story
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
  // Skip mobile app stories - they use Tamagui/React Native and won't render in web Storybook
  if (file.includes('apps/mobile/')) {
    console.log(`Skipping mobile story: ${file}`)
    continue
  }

  // Try to extract title from meta export, fall back to file path
  const title = extractTitleFromFile(file)
  const storyId = title ? titleToStoryId(title) : filePathToStoryId(file)
  const storyNames = extractStoryNames(file)

  console.log(`File: ${file}`)
  console.log(`Title: ${title || '(not found, using file path)'}`)
  console.log(`Story ID: ${storyId}`)
  console.log(`Stories: ${storyNames.join(', ')}`)

  for (const storyName of storyNames) {
    // Convert story name to kebab-case for URL
    const storySlug = storyName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

    const url = `${baseUrl}/iframe.html?id=${storyId}--${storySlug}&viewMode=story`
    storyUrls.push({
      url,
      file,
      componentName:
        title ||
        storyId
          .split('-')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(''),
      storyName,
    })
  }
}

console.log('\nGenerated URLs:')
console.log(JSON.stringify(storyUrls, null, 2))

// Write to file for next step
fs.mkdirSync('screenshots', { recursive: true })
fs.writeFileSync('screenshots/story-urls.json', JSON.stringify(storyUrls, null, 2))

// Output for GitHub Actions
const outputFile = process.env.GITHUB_OUTPUT
if (outputFile) {
  fs.appendFileSync(outputFile, `urls=${JSON.stringify(storyUrls)}\n`)
}

console.log(`\nGenerated ${storyUrls.length} story URLs`)
