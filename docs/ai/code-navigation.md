# Code Navigation for AI Agents

How to search this monorepo effectively: symbol-aware LSP first, `ast-grep` for structural patterns, plain `grep` only for strings.

## AST-based code search (`ast-grep`)

If `ast-grep` (aka `sg`) is installed, prefer it over text-based grep for structural code searches. It understands TypeScript/TSX syntax so it won't match inside comments or strings.

```bash
# Find all components using useAppSelector
sg -p 'useAppSelector($$$)' --lang tsx apps/web/src/

# Find all createSlice calls
sg -p 'createSlice({ name: $NAME, $$$})' --lang ts apps/web/src/

# Find all default exports of a function component
sg -p 'export default function $NAME($$$) { $$$}' --lang tsx apps/web/src/

# Find useMemo with specific dependency
sg -p 'useMemo(() => $$$, [$$$, chainId, $$$])' --lang tsx apps/web/src/
```

Install: `brew install ast-grep` or `npm install -g @ast-grep/cli`

## TypeScript LSP (symbol-aware navigation)

When available in your agent environment, the `LSP` tool exposes the TypeScript language server and indexes the entire monorepo (`apps/` + `packages/`, ~40k+ symbols). Use it for any question about **what a symbol is** or **who uses it** — it follows imports, re-exports, and module resolution, and ignores matches in comments and strings. This is strictly more accurate than `grep` for symbol-level questions, and complements `ast-grep` (which is best for structural pattern matching).

**When to reach for LSP (strongly preferred over `grep`):**

- "Who consumes this hook / component / selector / slice / endpoint / type?" → `findReferences`
- "Where is this symbol defined?" → `goToDefinition`
- "What are all implementations of this interface?" → `goToImplementation`
- "What's the exported API of this file?" → `documentSymbol`
- "Does a symbol named X exist anywhere, and where?" → `workspaceSymbol`
- "Who calls this function, and whom does it call?" → `prepareCallHierarchy` + `incomingCalls` / `outgoingCalls`
- "What type is this expression?" → `hover`

**When to reach for `ast-grep` instead:**

- Structural patterns, not symbol identity. E.g. "every `useMemo` whose deps array contains `chainId`", "every call to `createSlice` with a given shape".

**When plain `grep` is still fine:**

- Searching strings, comments, config, copy/UI text, file names, or anything that isn't a TS/TSX identifier.

**Gotcha — default exports:** For files that use `export default`, target the identifier on the `export default` line, not the local `const`/`function` binding, or you will miss all the importing consumers. Example: for `apps/web/src/hooks/useSafeInfo.ts`, aiming `findReferences` at the local `const useSafeInfo` binding returns ~2 refs; aiming at `export default useSafeInfo` returns 500+ refs across the codebase. For named exports this does not matter.

**All operations take:** `filePath`, `line` (1-based), `character` (1-based), `operation`.

```
# Examples
operation=documentSymbol  filePath=apps/web/src/hooks/useSafeInfo.ts  line=1 character=1
operation=findReferences  filePath=apps/web/src/hooks/useSafeInfo.ts  line=29 character=16  # the "default" identifier
operation=goToDefinition  filePath=apps/web/src/hooks/useSafeInfo.ts  line=4  character=10  # selectSafeInfo import
operation=workspaceSymbol filePath=<any .ts file>                     line=1  character=1   # index-wide symbol search
```

**Cost note:** `workspaceSymbol` with an empty/broad query returns tens of thousands of entries (1.7 MB+) and will be truncated to a persisted file — use it with a specific query, or prefer `findReferences` / `goToDefinition` starting from a known site.
