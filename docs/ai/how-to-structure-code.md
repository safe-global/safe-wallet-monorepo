# How to structure code

## Fix a bug with the smallest insertion into the existing flow

- **The diff is what gets reviewed.** A reviewer should be able to read it and see "it now also handles this case; the code around it is untouched, so it still works." Every changed line in a working flow has to be re-reviewed and re-tested.
- **Insert, don't restructure.** Prefer a parameter whose default keeps today's behaviour, a guard, or one extra branch over reshaping the flow around the fix.
- **Scope the fix to its case.** New code runs only in the case it fixes; every other path goes through the old code unchanged.

## Don't move existing code to make room for a fix

- **Moved code reads as new code.** Pulling a block into a new function, splitting a file or reordering code shows up as a large deletion plus a large addition, and nobody can check line by line that the logic is the same.
- **Refactors go in their own PR.** If restructuring is worth it, do it separately with no behaviour change; never mix it into a bug fix.

## When to extract a function

- **Reuse.** If the same thing is needed in more than one place, give it its own function.
- **Testability.** If it needs a dedicated unit test, give it its own function.
- **Don't overdo the test rule.** Needing a test doesn't always mean needing a new function; it's often fine for one test to cover several things together.
- **A function is a whole.** The unit is "some stuff that combines into something meaningful," not an arbitrary slice of steps.
- **Don't rename native code.** Wrapping a single built-in call (e.g. a `sessionStorage` call) in a function just to give it a name isn't a reason on its own — it needs one of the reasons above.
- **No mixed responsibilities.** A function tackling more than one responsibility is creating side effects; splitting it is how you remove them.
- **One line is fine if it removes a side effect.** Length is never the objection; mixed responsibility is.

## Follow Clean Code naming

- **Reveal intent.** A reader knows what a value is and why it exists without reading where it's set or used.
- **No ambiguity.** If a name could mean two things (an ID of what? a list of what?), make it specific.
- **Functions say what they do.** A helper whose name doesn't say what it checks or returns is worse than the inline code.
- **One word per concept.** Use the term the rest of the codebase already uses for that thing.
- **No mental mapping.** No single letters outside tiny scopes, no cryptic abbreviations, no names that only make sense after reading the implementation.
- **Booleans read as a question**, e.g. `isLastNetwork`, `hasSeat`.
