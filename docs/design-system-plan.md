# The Safe design system: where it is and where it goes next

**Written:** August 2026
**Status:** proposal, needs decisions (see the last section)
**Related:** the Linear project [Design System Package](https://linear.app/safe-global/project/design-system-package-fc813e5d5d0c) and its [plan document](https://linear.app/safe-global/document/design-system-extraction-and-consolidation-plan-a3cae605bd9f). This document does not replace those. It reports what has since been built, corrects some facts that have gone out of date, and proposes the next stages — including one thing the Linear plan rules out.

---

## What this is about, in one paragraph

Safe has one design system for the web: about fifty small building blocks (buttons, inputs, dialogs, tables) plus the colours, type sizes and spacing they use. Until last week it lived inside the wallet app, which meant nobody else could use it. It now lives in its own folder, `packages/design-system`. This document is about three things: making it genuinely reusable by other Safe apps (including apps in other repositories), keeping it consistent instead of slowly drifting apart, and letting designers change it themselves using Claude rather than filing a ticket.

The guiding rule throughout: **reuse what exists.** If someone needs a button, they should not be able to build a fifth one without first being shown the four we have. Most of this plan is about making that the easy path rather than a rule people are asked to remember.

---

## Some words this document uses

Only the ones that are unavoidable.

| Word            | What it means here                                                                                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Token**       | A named value, like "the page background colour" or "the medium corner radius". Components refer to the name, never the actual colour. Change the name's value in one place and everything follows.            |
| **Variant**     | A named option on a component — `size="small"`, `variant="destructive"`. The alternative is each screen inventing its own styling, which is how things drift apart.                                            |
| **Primitive**   | One of the ~50 small building blocks. A button, an input, a dialog.                                                                                                                                            |
| **Preset**      | A fixed combination of primitives for a job that keeps recurring — for example the Cancel/Confirm pair at the bottom of every dialog.                                                                          |
| **Storybook**   | A website, generated from the code, that shows every component in every state. Runs on your machine or as a link on a pull request. This is the thing designers work in.                                       |
| **npm package** | A versioned bundle other projects install. When you publish version 2.1, everyone who installs 2.1 gets exactly the same thing.                                                                                |
| **Registry**    | The way shadcn (the library our components are based on) distributes things: instead of installing a package, you run a command and the component's source code is copied into your project, where you own it. |

---

## Part 1: What just happened

The design system was pulled out of the wallet app into `packages/design-system`. Concretely:

- **51 primitives and 7 presets** moved, with their tests.
- **The colour and spacing layer** moved, as two files: one generated from Safe's brand palette, one holding the semantic names components actually use.
- **62 Storybook stories** moved, and the package got its own Storybook — deliberately much lighter than the app's, because nothing in the design system talks to a server or reads app state. It starts in a couple of seconds. There are three new "Foundations" pages that read every colour, type size and radius **live out of the stylesheet**, so what a designer sees is what the code actually does.
- **The rules became code.** 38 checks now fail the build if someone re-styles a component instead of using its variants. They were already there, but only the wallet app ran them — the newer `web-tanstack` app renders the same components and had none of them. Both run them now.
- **The written contract** lives in `packages/design-system/AGENTS.md`, and four Claude skills point at it.
- **1,732 imports across 798 files** were rewritten by a codemod that is kept in the repo, so it can be re-run on any branch that still has old imports.

Everything passes: the package's own checks, the wallet app's 7,076 tests, both Storybooks build.

### Two design decisions in there worth knowing about

**The dialog footer taught us the general pattern.** `DialogActions` is the Cancel/Confirm pair used by 24 dialogs. It needed to know whether the user's wallet can perform the action — which is Safe business logic that has no place in a design system. Rather than leave it behind, we inverted it: the design system owns the layout and the buttons and takes a `confirmGate` function; the wallet app passes in its own wallet check. Twenty-four call sites didn't change. **This is the pattern for anything that is 90% generic: don't split it, invert it.**

**The presets are the strongest guardrail we have,** and it was mostly luck. Their prop types deliberately exclude styling, so `<SubmitButton className="h-9">` is not a lint warning — it doesn't compile. That is worth more than any number of documented conventions, and the plan below leans on it.

---

## Part 2: Correcting the record

The Linear plan was written in June. Several of its facts have moved, and a few were wrong at the time. This matters because people are going to execute against that document.

| The Linear plan says                                                    | Actually                                                                                                                                                                                                                                                                                                                                      | Why it matters                                                                                                                                                 |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Chromatic live" (`web-chromatic.yml`)                                  | **Chromatic is not used at all.** No dependency, no workflow, no account. Safe uses **Argos**. There are 6 leftover `tags: ['!chromatic']` in story files that now do nothing, and instructions referencing Chromatic in `.cursor/rules/cypress-e2e.mdc` and `specs/001-shadcn-storybook-migration/` that will mislead anyone following them. | The whole "visual review gates design changes" idea rests on a tool we don't have configured. And the tool we do have — Argos for Storybook — is switched off. |
| "92% Storybook coverage, 49 stories"                                    | **100% of primitives and presets have a story.** 62 stories, not 49.                                                                                                                                                                                                                                                                          | Better than believed. The gap isn't coverage.                                                                                                                  |
| "564 inline styles, 803 arbitrary Tailwind values, 65 hex"              | **187 inline styles, 45 hard-coded colours.** Arbitrary Tailwind is 1,324, but roughly 368 of those are references to brand colour names, not magic numbers.                                                                                                                                                                                  | The clean-up is much smaller than feared — the hard-coded colours are a day, not a quarter. But see the next row for why those brand-name references exist.    |
| "217 CSS modules"                                                       | **206**, totalling ~10,000 lines. Two thirds already read brand colour names.                                                                                                                                                                                                                                                                 | Still the biggest single chunk of work, and still worth doing last.                                                                                            |
| Two token layers disagree; fix it first                                 | **Three, not two.** There is a hidden third set of colour overrides inside the generator that is supposed to be the single source (`packages/theme/src/generators/css-vars.ts`, lines 62–121, where web gets different warning colours than mobile).                                                                                          | You cannot unify two things when there are three.                                                                                                              |
| Implicitly: the brand palette is right and the component layer is wrong | **Not always.** See below.                                                                                                                                                                                                                                                                                                                    | This changes what "fix the tokens" means.                                                                                                                      |

### The token problem is real, but not the problem people think

We measured the actual differences rather than eyeballing them. Three findings:

**Most of the divergence is invisible.** The headline example in the Linear plan is that the components use `#171717` as the primary colour while the brand says `#121312`. Those two colours are 1.04:1 apart in contrast terms. Nobody can see the difference. Same for the border colour. So this is a _hygiene_ problem — two sources of truth that will drift further — not a _visual_ problem users are noticing today.

**In two places the component layer is right and the brand palette is wrong.** This is the important one:

- The muted text colour in the components is `#737373`, which measures **4.74:1** on white — it passes the accessibility standard for body text (4.5:1). The brand palette's equivalent, `#a1a3a7`, measures **2.53:1** — it **fails**. If we "fixed the tokens" by making the brand palette win, we would make Safe's secondary text illegible.
- The warning colours currently pinned to Figma's yellow measure 4.76:1. The brand palette's warning pair measures 8.89:1 — the brand is considerably better here.

So the answer isn't "brand wins". It's a three-part rule, and it needs a human to agree to it:

> **The brand palette decides the colour. Figma decides which brand colour plays which role. Accessibility outranks both — and when it does, we fix the brand palette rather than pinning a one-off value in the component layer.**

That last clause is what stops the drift returning. It also means the accessibility fix reaches the mobile app, which shares the same palette.

**Dark mode runs on two independent switches at once.** The brand colours switch on an attribute on the page (`data-theme="dark"`); the component colours switch on a CSS class on a wrapper element. In the wallet app they happen to agree because both read the same setting — but that's a convention, not a mechanism. Eight tokens straddle the two. **This is the single biggest hazard for reuse:** another Safe app that imports our stylesheet and sets the class but not the attribute gets dark components with four light-coloured patches in them, silently.

### Two small bugs found on the way

- `tabs.tsx` line 70 contains `bg-[#fafafa]` — a hard-coded colour inside the design system, which our own contract forbids. Exactly one, and nothing catches it.
- `--destructive-foreground` is defined only in dark mode and referenced nowhere. A dead token.

---

## Part 3: The five real problems

Stated plainly, in the order they need solving.

### Problem 1: None of it is checked

**No CI job runs the design system's own tests.** Not one of the 31 workflows mentions it. The `yarn verify:ds` command exists and nothing calls it.

That means the three tests specifically built to make designer-authored changes safe — every colour exists in both light and dark, text clears the contrast standard, all 38 rules still fire — **have never run automatically.** Today a designer changing a colour would get _less_ checking than an engineer renaming a variable.

There is also no `CODEOWNERS` file, so nothing routes a colour change to a designer for review, and nothing stops someone from editing the tests that protect them.

This is the cheapest problem on the list and it blocks everything else. Nothing below is real until it's fixed.

### Problem 2: Three sources of colour truth

Covered above. Until this is one source, "consistent" is a hope.

### Problem 3: The design system is still tangled up with the wallet app

Four specific knots, each of which has to be untied before any other app can use this — and each of which is worth untying anyway:

1. **The text input imports Ethereum address parsing**, which imports the whole `ethers` library. A generic text input should not know what a blockchain address is. (It only needs to strip a `eth:` prefix when you paste — about ten lines, no library.)
2. **The stylesheet imports a command-line tool.** One line of CSS pulls in the `shadcn` CLI — a scaffolding tool with 35 dependencies of its own — as a runtime dependency of every app that uses the design system.
3. **The stylesheet hard-codes paths to sibling folders**, including `../../../../../apps/web/src`. This is load-bearing: it's how the styling tool knows where to look for class names. In another repository, four of those five paths point at nothing, and the failure mode is _silently unstyled components with no error message_.
4. **A dependency on `next-themes`** — a Next.js library — for a single line, in a package that is supposed to be framework-agnostic.

### Problem 4: Reuse isn't the easy path yet

The 38 rules all say the same kind of thing: _don't override a component's styling_. **Not one of them says: don't hand-roll your own.** There are 52 raw `<button>` elements, 49 raw `<p>`, 3 raw `<table>` and 6 raw headings in the wallet app's production code, each one a small fork of a component we already have.

There is also no single place — for a person or for Claude — that answers "what do we already have?". A designer or an agent has to scroll 52 sidebar entries or read 52 files. Reuse loses to reinvention because reinvention is _cheaper to start_.

Related: only 18 of 51 primitives have variants at all. Table, avatar, skeleton, spinner, separator, textarea, progress, list, kbd and pagination have none, which is exactly why screens hand-roll their sizing. The 79 documented "I had to override this" escapes in the wallet app are the receipt — several of them literally say "pending a variant".

### Problem 5: Designers can't actually get in yet

The repo has a devcontainer (a pre-built development environment), but it's built for engineers on Docker Desktop — it mounts paths that only exist on a Mac laptop, and it only exposes the wallet app's port, not the design system Storybook's. There's no one-click way in, and the accessibility panel that would let a designer see contrast problems as they work (`@storybook/addon-a11y`) **isn't installed in either Storybook.**

Three of the five existing Figma-related Claude skills are also broken or now point the wrong way: the prototyping skill targets a folder that doesn't exist and a file we deleted, and the Figma tool names in three skills don't match the tools that are actually available — meaning those skills cannot call anything.

---

## Part 4: The recommended approach

We explored three architectures in parallel and argued each one properly. The short version of what came out:

- **"Publish everything to npm as a built library"** is the conventional answer. It gives real version guarantees. But it makes local development slower, forces every consumer onto the exact same version of the underlying UI library, and — the killer — when another team needs one extra button variant, they will not wait a day for a release. They will override the styling locally, in a repo we don't lint. **An npm library makes a fork invisible.**
- **"Distribute component source through a registry"** is how shadcn itself works: you run a command, the component lands in your project, you own it. Styling works with no configuration because the file is in your own source tree. The catch is the opposite one: a copied file can drift and nobody notices.
- **"Focus on the designer workflow"** turned out not to be an alternative at all — it's a requirement that both distribution models have to satisfy, and it surfaced Problem 1, which outranks everything.

The two distribution agents independently reached the same conclusion from opposite directions, which is the strongest signal we got:

> **Split it by how fast things change.**
>
> Things that must be **byte-for-byte identical everywhere** and change slowly — the colours, spacing, radii, and the 38 rules — go to **npm as versioned packages**. A version number is exactly the right guarantee for these.
>
> Things that teams legitimately need to **adapt** — the component source — go through a **registry**. If someone forks a button, it lands as a file with a header saying where it came from, and a weekly check reports it. **A registry makes a fork a file with your name on it.**
>
> Things that are **Safe business logic** — anything that knows about chains, transactions or wallets — never leave this repo at all.

One less obvious item belongs in the registry too: **the Claude skills and the written contract.** A new Safe app runs one command and its Claude Code is now enforcing the same rules as ours. That's the cheapest consistency mechanism available and it costs almost nothing to set up.

---

## Part 5: The stages

Ordered so that each stage is useful even if the next one never happens. Nothing here is a big-bang rewrite.

### Stage 0 — Turn the checks on (about a week)

Everything else depends on this, and none of it is hard.

1. **A CI job for the design system.** Runs `yarn verify:ds` and the wallet app's checks whenever the design system or the theme changes. This is the single most important item in this document — it brings the token tests, the contrast test and the rules test into CI for the first time.
2. **A `CODEOWNERS` file.** Colour and spacing files need a designer's approval. The tests, the rules, the build config and anything in `.github/` need an engineer's — **a designer must never be able to weaken the thing that protects them.**
3. **Install the accessibility panel** in the design system's Storybook, and show the contrast number and a pass/fail badge next to every colour in the Foundations page. The functions to compute this already exist in our contrast test.
4. **Stop people editing the generated colour file.** It's the file with the actual hex values in it, so it's the first place someone will try to change a colour, and today the only thing preventing that is a sentence in a markdown file. Make CI fail instead.
5. **Deploy the design system's Storybook per branch**, next to the app one that already deploys. Designers need a link, not a command.
6. **Fix the wrong facts** — remove the dead Chromatic markers and correct the two instruction files that tell people to use a tool we don't have.

### Stage 1 — One source of colour truth (three to four weeks)

This is the Linear project's WA-2575, with one correction: the migration should be provably invisible before it changes anything.

1. **Move the hidden web overrides** out of the generator into a proper file. No visual change.
2. **Make the semantic layer generated instead of hand-written.** The key trick: _seed it so the first generated output is byte-identical to today's hand-written file._ Land the generator with a zero-line diff. No visual change, no risk, and the file is now generated.
3. **Emit references, not values.** The generated file should say "the card background is the brand's paper colour", not `#ffffff`. Three consequences: a colour change touches one file; a review shows which _role_ was rewired instead of a wall of hex codes; and most of the dark-mode duplication disappears, because only the ~6 tokens whose _role_ genuinely differs between themes need a dark entry.
4. **Add a ratchet.** A test counts how many hand-written values remain and only ever lets that number go down. Each following pull request converts one group and lowers the number, with a screenshot comparison attached.
5. **Collapse dark mode to one switch.** Keep the page attribute, retire the CSS class. It's a one-line change to how the styling tool defines "dark", which re-points all 112 dark-mode utilities at once — no find-and-replace. Keep the old class working for one release so this doesn't have to land at the same time as the component change.
6. **Fix the radius scale.** The components use a 16px "large" radius that doesn't exist in the shared scale, and the shared scale's default of 6px has no component equivalent. Add 16 to the shared scale rather than renumbering it — mobile refers to those numbers, and renumbering would break every mobile screen.

**One trap that must be handled in the same pull request, not a follow-up.** Both of our safety tests read colour values expecting a hex code. Once values become references, a careless fix ("can't resolve it, skip it") leaves both tests **green and meaningless**. The contrast test must fail loudly on anything it can't resolve, and both tests need an assertion on how many pairs they actually measured. This is the kind of failure that looks like success for six months.

**Order the conversions by measured risk**, cheapest first: the invisible ones (primary, border, card) → the accessibility fix to muted text, which needs mobile sign-off because mobile inherits it → the status colours, where contrast actually improves → the chart colours, which have no brand equivalent at all and need a design decision.

### Stage 2 — Untangle it (one to two weeks)

The four knots from Problem 3. Each is independently worth doing and none commits us to a distribution model:

1. Inline the address-prefix handling; drop `ethers` from the graph.
2. Inline the one line of CSS the `shadcn` CLI provides; move the CLI to a build-time tool.
3. Route the theme read through the provider we already have; drop `next-themes`.
4. Split the stylesheet's folder paths: the version used inside this repo keeps them; the published version replaces them with a path relative to itself, plus a generated list of every class name the components use as a safety net.

Also here: fix the hard-coded colour in `tabs.tsx`, delete the dead token, and move one helper file so that stories can be excluded from anything we publish.

### Stage 3 — Make reuse the easy path (two weeks)

This is the direct answer to "instead of just building a button, reuse what we have".

1. **A generated inventory.** One file, `inventory.json`, listing every primitive and preset: its name, how to import it, its variants, the note on each variant saying when to use it, and whether it has a story, a test and a rule. Generated from the code by the AST scanner **we already have** for the Storybook coverage report, with a CI check that fails if it's out of date. This is the keystone — everything below depends on it.
2. **A "what do we have?" page in Storybook**, rendered from that inventory. Everything on one screen, scannable in thirty seconds. Reuse gets easier because _finding_ gets easier.
3. **A mandatory first step in the skills.** Before scaffolding anything new, load the inventory, print the five closest existing options with links, and _ask_. Not "search the codebase" — an agent will run a lazy search and declare victory. A step whose output it then has to reason about is one it can't skip.
4. **Rules against hand-rolling.** Forbid raw `<button>`, `<input>`, `<table>`, `<h1>`–`<h6>`, `<p>` and `<a>` in app code, with a message naming the replacement. Land it as a warning with a baseline, because it will fire hundreds of times. Same file, same test file as the existing 38.
5. **A gate on new components.** A new file in the components folder must arrive with a story, a test, a rule entry and an export, or the build fails. Four existence checks. Plus a name-collision check, so `StatCard` next to `Card` and `PrimaryButton` next to `Button` get caught.
6. **Fill in the missing variants** for the ten primitives that have none, starting with table, skeleton, spinner and avatar — the ones the 79 documented overrides keep asking for.

**Two things we are deliberately not doing here**, because they look sensible and won't work: a hand-written "which component for which job" table (it will drift within two months, and a drifted guide is worse than none because agents trust it — generate it from the notes already required on each variant instead), and a copy-paste detector (it finds copied _code_, not duplicated _intent_ — a second button written from scratch has almost no overlap with the first, while the shadcn primitives, which intentionally repeat themselves, would set it off constantly).

### Stage 4 — Let designers in (two weeks, after Stage 0)

1. **A separate development environment aimed at designers**, runnable in the browser with nothing installed, exposing the design system Storybook port and pre-built so the first start is two minutes rather than twelve. The existing engineer setup can't be reused directly — it depends on paths that only exist on a local Mac.
2. **Rewrite the skills for a designer audience.** The four new ones are good, and they're written for engineers: they open with "read the contract" and end with a terminal command. A designer's job ends with _looking at something_. Every designer-facing skill should finish with a clickable Storybook link, and should report the blast radius as a number **before** editing — a designer imagines a colour change touches one screen; the honest answer is often 340 places.
3. **Retire what points the wrong way.** Two skills exist to copy values and components _from_ Figma into code. If code is the source of truth, those are a ritual pointing backwards. Keep the Figma-to-code skill for designs that only exist in Figma; keep the Figma links as citations; retire the two sync skills. Fix the three skills whose tool names don't match reality.
4. **Prototypes get a home** in the design system's Storybook, as their own group excluded from visual comparison. A prototype made only of existing components needs no mock data, so it belongs in the fast Storybook the designer is already sitting in. And the skill should report what it _had to invent_ — that's how prototyping feeds the component backlog instead of quietly forking the system.
5. **Turn on visual comparison for the design system's Storybook first** — 116 stories with no mock data produce stable results. Do not start with the app's 704, which will be flaky, because **a flaky visual check teaches everyone to ignore visual checks.**
6. **A review shape that prevents rubber-stamping.** Ask the two reviewers _different_ questions: design answers "is this the right colour, in both themes, everywhere it lands?", engineering answers "is the blast radius what the description claims, and does anything break?". Rubber-stamping happens when both are asked the same thing. And render the diff as colour swatches with contrast numbers, because nobody can review a hex code.

### Stage 5 — Ship it outward (three to four weeks)

Only after Stages 0–2. In this order:

1. **Publish the tokens.** Publish the existing theme package rather than inventing a fourth one. It ships the colours as CSS, as a machine-readable format design tools can import, and as types. Versioning rule, and it's deliberately unusual: **changing a colour's value is a minor release, not a patch** — it's the only thing that can break a consumer's visual tests, so it must be visible in the version.
2. **Publish the rules** as a lint plugin, with a severity switch. A team adopting mid-flight starts at "warning" and ratchets up. Without that switch they will delete the config, and then the rules — the actual consistency mechanism — are gone.
3. **Build the registry.** Generated from the component files so it cannot drift, with two CI checks: one that it's up to date, and one that a scratch project can actually install from it and compile. That second check is the one that finds the problems.
4. **A drift reporter.** Every generated file carries a header saying which version it came from. A small tool reads those headers, compares against the registry, and reports per file: current, behind, or locally modified with the diff. Note: shadcn's own `diff` command **does not work** for private registries — we verified this against the installed CLI — so this has to be ours.
5. **Onboard one consumer and treat its first two weeks as the real test.** Not the fixtures — a real app finds things fixtures don't.

**Be honest about what the registry does not solve.** Nothing stops someone editing a copied file. Registry distribution _trades_ update guarantees for local editability — that's the entire point of it, and no tooling undoes that. What it buys is that drift becomes **visible within a week instead of discovered in a year.** If we ever need a hard guarantee that three apps render an identical button, the answer is the token layer, where the guarantee is real.

### Stage 6 — The long tail (ongoing, not a project)

The 206 CSS module files and 10,000 lines of app-specific styling. This is the Linear project's WA-2578 and its own honest caveat applies: ship the inventory, a pilot, the playbook and the guardrails — the _mechanism_ to reach zero — and let the rest happen per feature. Do the cheap high-signal part early though: the 45 hard-coded colours are about a day's work and they're the ones that visibly break dark mode.

---

## Part 6: What we are deliberately not doing

- **Not rewriting `tx-builder`.** It stays on its old UI library. It shares colours only.
- **Not sharing components with mobile.** Mobile uses a different rendering system. It shares the colour palette, and that's the right boundary. But note the consequence: **a brand colour change ships to mobile too**, so it always needs an engineer.
- **Not replacing Figma.** Figma stays better at exploring twenty layouts in an hour, at anything not made of components (illustration, marketing, icons), at spatial thinking, at comments pinned to a pixel, and at working with people who will never open a repo. The boundary worth holding: **Figma owns everything before a decision; the repo owns everything after it.** The change is that we stop maintaining a Figma component library as a second source of truth — that library is the expensive ritual, and it will drift by definition.
- **Not adopting a token framework** (Style Dictionary, Terrazzo). Our generators are about 150 lines with tests. The hard parts here are role-mapping with accessibility constraints and preserving references in the output — and the main framework resolves references to plain values by default, which is the opposite of what we need. Revisit if Safe ever needs a second brand.
- **Not building a duplicate-code detector.** Explained in Stage 3.

---

## Part 7: How we'll know it worked

Things that are either true or false, no interpretation:

1. A pull request touching only the design system runs its lint, types, tests and a visual comparison. _(Today: none of these.)_
2. No hand-written colour value exists in the semantic layer. One dark-mode switch.
3. A colour that fails the contrast standard fails CI, in every advertised combination — not just the three we check today.
4. `inventory.json` exists, is generated, and is what the skills read first.
5. Raw `<button>`, `<p>`, `<table>` and headings are lint errors in app code, and the count is zero.
6. The 79 documented styling overrides trend downward, with a test that fails if the number rises.
7. A designer can change a colour, see it, and open a pull request without an engineer — and cannot merge it alone.
8. A second Safe app renders Safe-styled components from the published tokens plus the registry, and the drift report says "current".
9. Every primitive has variants covering what call sites actually need — measured by the override count in item 6 going to near zero, not by opinion.

---

## Part 8: Decisions we need from humans

These are genuinely not ours to make.

1. **The package name.** The Linear plan recommends `@safe-global/ui`. What shipped is `@safe-global/design-system`. Renaming is cheap now (one codemod, same one we already used) and expensive after anything is published. **Pick one this week.**
2. **The colour rule.** Do you accept "brand decides the colour, Figma decides the role, accessibility outranks both and we fix the palette when it loses"? This is the decision Stage 1 rests on, and it has a live consequence: the brand's secondary text colour fails the accessibility standard and would need to change — which also changes the mobile app.
3. **How much visual review to buy.** Argos is already paid for and switched off for Storybook; turning it on is nearly free. A purpose-built design review tool would handle designer sign-off better. Recommendation: turn Argos on first, and only look at buying something if sign-off keeps slipping.
4. **Who owns the design system.** Stage 0 needs a `CODEOWNERS` file, which needs named people, which we can't invent.
5. **Is there actually a second consumer yet?** We could not find a Safe dashboard repository from here. Stages 0–4 are worth doing regardless — they're about consistency and letting designers in. Stage 5 is only worth its cost if a real second app is coming. **If it is, the strongest single thing you can do is give that team write access to `packages/design-system`,** so "we need one more button variant" is a pull request they open rather than a reason to override styling in a repo we can't see.
6. **Whether designers get their own environment or use the browser-based one.** Cost is real and worth deciding deliberately rather than discovering: roughly $0.36 per hour per designer past the free allowance.

---

## Appendix: the numbers, as measured in August 2026

|                                                  |                                                 |
| ------------------------------------------------ | ----------------------------------------------- |
| Primitives / presets                             | 51 / 7                                          |
| Stories                                          | 62 (100% of primitives and presets covered)     |
| Primitives with variants                         | 18 of 51                                        |
| Hand-written colour values in the semantic layer | 45 light, 37 dark                               |
| Tokens that reference the brand palette          | 2 light, 6 dark                                 |
| Styling rules enforced                           | 38 JSX elements, in both web apps               |
| Documented styling overrides in the wallet app   | 79                                              |
| CSS module files in the wallet app               | 206 (~10,000 lines)                             |
| Inline styles in the wallet app                  | 187 across 117 files                            |
| Hard-coded colours in app code                   | 45 (20 arbitrary hex, 25 stock palette)         |
| Raw HTML that should be a component              | 52 buttons, 49 paragraphs, 6 headings, 3 tables |
| Design-system imports across the apps            | 1,732 across 798 files                          |
| CI jobs running design-system checks             | **0**                                           |
| Anything published to npm from this repo         | **nothing**                                     |
