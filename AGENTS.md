# AI contributor guidelines

- **Put as much markup as possible in `packages/views`.** New UI is a view in `packages/views/src/features/<feature>/components/` that only turns props into markup. The component in `apps/web` calls the hooks, the store and the router, and renders that view with the results. This holds even when the code around it is still in `apps/web`: that code has not been moved yet and is not an example to follow.
- **Follow Clean Code naming.**
  - Reveal intent: a reader knows what a value is and why it exists without reading where it's set or used.
  - No ambiguity: if a name could mean two things (an ID of what? a list of what?), make it specific.
  - Functions say what they do: a helper whose name doesn't say what it checks or returns is worse than the inline code.
  - One word per concept: use the term the rest of the codebase already uses for that thing.
  - No mental mapping: no single letters outside tiny scopes, no cryptic abbreviations, no names that only make sense after reading the implementation.
  - Booleans read as a question, e.g. `isLastNetwork`, `hasSeat`.
