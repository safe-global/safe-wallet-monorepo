## What it solves

Resolves:

## How this PR fixes it

## How to test it

## Affected flows

<!-- The primary user journey(s) this PR intentionally changes. One bullet per flow. Example: "Owner adds a new signer from Settings > Signers". -->

## Blast radius

<!--
List the surfaces touched by this change and who else depends on them. Think in dependency terms, not files.
Include where relevant:
- Shared hooks / components / selectors / slices touched and their known consumers
- RTK Query endpoints / API contracts
- Feature flags / chain configs
- Persistence / cache / migration implications
- Routes or layouts affected indirectly
- Mobile impact (shared packages)
-->

## Risks / not checked

<!--
Be explicit about what you did NOT verify. This exposes false confidence and helps reviewers target their attention.
Example:
- Did not verify behavior with feature flag X disabled
- Did not test on mobile
- Did not exercise the retry / error path manually
-->

## Visual summary

<!-- REQUIRED for AI-authored PRs. Include a Mermaid diagram for architecture/logic changes, a screenshot for UI changes, or both. See AGENTS.md for examples. -->

## Checklist

- [ ] I've tested the branch on mobile 📱
- [ ] I've documented how it affects the analytics (if at all) 📊
- [ ] I've written a unit/e2e test for it (if applicable) 🧑‍💻
- [ ] I've listed affected flows and blast radius, and named what I did not verify 🎯
- [ ] For web feature/bugfix PRs, I've added a Playwright one-shot happy-path clickthrough under apps/web/e2e/tests/one-shots/ and run it locally — CI records and posts the clickthrough GIF 🎬

---

## CLA signature

With the submission of this Pull Request, I confirm that I have read and agree to the terms of the [Contributor License Agreement](https://safe.global/cla).
