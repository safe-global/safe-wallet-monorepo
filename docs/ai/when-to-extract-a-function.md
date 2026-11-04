# When to extract a function

- **Reuse.** If the same thing is needed in more than one place, give it its own function.
- **Testability.** If it needs a dedicated unit test, give it its own function.
- **Don't overdo the test rule.** Needing a test doesn't always mean needing a new function; it's often fine for one test to cover several things together.
- **A function is a whole.** The unit is "some stuff that combines into something meaningful," not an arbitrary slice of steps.
- **Don't rename native code.** Wrapping a single built-in call (e.g. a `sessionStorage` call) in a function just to give it a name isn't a reason on its own — it needs one of the reasons above.
- **No mixed responsibilities.** A function tackling more than one responsibility is creating side effects; splitting it is how you remove them.
- **One line is fine if it removes a side effect.** Length is never the objection; mixed responsibility is.
