# AI contributor guidelines

- **Put as much markup as possible in `packages/views`.** New UI is a view in `packages/views/src/features/<feature>/components/` that only turns props into markup. The component in `apps/web` calls the hooks, the store and the router, and renders that view with the results. This holds even when the code around it is still in `apps/web`: that code has not been moved yet and is not an example to follow.
