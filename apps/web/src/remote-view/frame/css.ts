const maps: Record<string, Record<string, string>> = {}

export const setCssMaps = (next: Record<string, Record<string, string>>) => Object.assign(maps, next)

// The worker build loads every `*.module.css` import as cssModule('<path>').
export const cssModule = (id: string) =>
  new Proxy({} as Record<string, string>, {
    get: (_, name) => (typeof name === 'string' ? maps[id]?.[name] : undefined),
  })
