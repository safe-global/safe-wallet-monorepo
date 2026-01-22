export const textShortener = (text: string, charsStart: number, charsEnd: number, separator = '...'): string => {
  const amountOfCharsToKeep = charsEnd + charsStart

  if (amountOfCharsToKeep >= text.length || !amountOfCharsToKeep) {
    // no need to shorten
    return text
  }

  const r = new RegExp(`^(.{${charsStart}}).+(.{${charsEnd}})$`)
  const matchResult = r.exec(text)

  if (!matchResult) {
    // if for any reason the exec returns null, the text remains untouched
    return text
  }

  const [, textStart, textEnd] = matchResult

  return `${textStart}${separator}${textEnd}`
}
