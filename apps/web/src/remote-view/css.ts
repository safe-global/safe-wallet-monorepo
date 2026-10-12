// Class-name maps of CSS modules used by sandboxed views. The page loads the stylesheets; the worker gets the names.
const maps: Record<string, Record<string, string>> = {}

export const registerCss = (id: string, classes: Record<string, string>) => {
  maps[id] = { ...classes }
}

export const cssMaps = () => maps
