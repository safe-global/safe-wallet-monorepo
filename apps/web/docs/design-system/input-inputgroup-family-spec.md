# Input / InputGroup family — sweep spec

> Executable handoff. Method: [`../DESIGN_SYSTEM_CONSISTENCY.md`](../DESIGN_SYSTEM_CONSISTENCY.md). Backlog item **C4**.

Primitives: `apps/web/src/components/ui/input.tsx`, `input-group.tsx` · Stories: `stories/input.stories.tsx`, `input-group.stories.tsx`

## Status — DONE

**2026-07-09 (part 1):** `Input`/`InputGroup` gained the `xl` 66px tier + `surface` variant, `SearchInput`
became the shared search preset, `NumberField`/`NameInput` pass `inputSize`/`variant`, and the safe search +
66px call sites were migrated.

**2026-07-10 (part 2 — tail closed):** the deferred outliers are resolved and the **Input ESLint guard is
live** (`dsInputClassnameRule` for `Input`/`InputGroup*` + presets `SearchField`/`SearchInput`/`NumberField`/
`NameInput`; button regex + `border`). No new variants were added — `surface` already covered the recurring
bg-card cases:

- **ActivityLogFilters** + **CreateSpaceOnboarding** → `variant="surface"` (radius/44px height grandfathered).
- **MemberInviteRow** (another 44px surface field surfaced by the guard) → `variant="surface"` + grandfather.
- **NftGrid** borderless table-header filter and **SidebarInput** `bg-background` → grandfathered (single-use,
  bespoke; a one-off `ghost`/`muted` variant wasn't worth the API surface).
- **InputGroupInput** primitive-internal border/bg stripping → grandfathered (it's the primitive doing its job).

Follow-up (not blocking): retire `SearchField` fully onto `<SearchInput>` (several consumers still import it),
and the `AddressInput` MUI holdover (out of scope — see Risk).

## Current state

- **input.tsx** `inputVariants`: single axis `inputSize` (`sm h-8` / `default h-9` / `lg h-10`). Named `inputSize` (not `size`) to avoid the native numeric `size` attr. **No `variant`/skin axis** — bg/border/radius/padding/font hard-coded in the base string.
- **input-group.tsx**: `InputGroup` wrapper **has NO cva and NO props** — plain `div` with hard-coded `h-9 rounded-md border shadow-xs`. (Backlog claim confirmed: no `size`.) `inputGroupAddonVariants` (`align`), `inputGroupButtonVariants` (`size` xs/sm/icon-xs/icon-sm). `InputGroupInput`/`InputGroupTextarea` strip border/bg/ring and inherit group height.

## Proposed additions

### input.tsx — `xl` size + `variant` skin (move `bg-*`/`px-*` out of base)

```ts
inputSize: { sm:'h-8 px-3', default:'h-9 px-3', lg:'h-10 px-3', xl:'h-[66px] px-4 rounded-[calc(var(--radius)-2px)]' }
variant:   { default:'bg-transparent dark:bg-input/30', surface:'bg-card dark:bg-card' }
// defaultVariants { inputSize:'default', variant:'default' }
```

Thread `variant` through the `Input` fn. **Gotcha:** move `px-3` out of the base into each size (cva concatenates, does not tw-merge, so a base `px-3` would fight `xl`'s `px-4`). `xl` (66px) absorbs `formFieldStyles.largeFormFieldSurfaceClassName` + `TxFilterForm` h-[66px]×2.

### input-group.tsx — wrap the div in `inputGroupVariants` (mirror Input)

```ts
inputSize: { sm:'h-8', default:'h-9', lg:'h-10', xl:'h-[66px] px-4 rounded-[calc(var(--radius)-2px)]' } // remove hard-coded h-9 from base
variant:   { default:'', surface:'bg-card dark:bg-card shadow-none' }
```

`function InputGroup({ className, inputSize, variant, ...props }: ComponentProps<'div'> & VariantProps<typeof inputGroupVariants>)`.

### New `components/ui/search-input.tsx` — retire the SearchField↔InputGroup split

```tsx
function SearchInput({ inputSize, className, ...props }) {
  return (
    <InputGroup variant="surface" inputSize={inputSize} className={className}>
      <InputGroupAddon align="inline-start">
        <Search />
      </InputGroupAddon>
      <InputGroupInput type="search" {...props} />
    </InputGroup>
  )
}
```

Collapses the whole leading-icon search cluster (SearchField, AddressBookSearchInput, GlobalSearch, SafeSearch, AccountsSearch, AddAccounts/SelectSafesOnboarding, AccountListFilters, TrustedSafesList, AccountsModal, SafeDropdownContainer) to `<SearchInput …/>` — no `pl-*` hack, standardize on the addon.

## Drift inventory

### `<Input>`

| file:line                                       | drift                                                          | replacement                                                                                                  |
| ----------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `spaces/.../SafeSearch.tsx:13`                  | `pl-10` + absolute icon                                        | `<SearchInput placeholder="Search for safes" value onChange/>`                                               |
| `spaces/.../CreateSpaceOnboarding/index.tsx:97` | `mt-2 h-11 rounded-sm bg-card px-4`                            | `variant="surface" className="mt-2"`; `h-11`(44) one-off → design (lg=40 closest)                            |
| `spaces/.../ActivityLogFilters.tsx:58`          | `bg-card border-border w-40 rounded-lg [&~p]:…`                | `variant="surface"`; keep `w-40 [color-scheme] [&~p]:*`; `rounded-lg` grandfather; `border-border` redundant |
| `spaces/.../ImportAddressBookDialog.tsx:140`    | `pl-9` + absolute icon                                         | `<SearchInput placeholder="Search" onChange/>` (drop manual icon/relative)                                   |
| `nfts/.../NftGrid/index.tsx:168`                | `h-auto border-none bg-transparent py-0 pl-6 pr-0 shadow-none` | add borderless `variant="ghost"` OR grandfather (inline table-header filter)                                 |
| `ui/sidebar.tsx:476` (SidebarInput)             | `bg-background w-full shadow-none` (inputSize sm)              | needs `bg-background` skin (surface=card) → add `variant="muted"` or grandfather `bg-background`             |

Clean: IdentitySection:76 (`max-w-md`), UpdateSpaceForm:39, DeleteSpaceDialog:102, MemberInviteRow:100, WcInput:95, AddCustomAppModal:99, AdvancedOptionsStep:206, PkModulePopup:37.

### SearchField family (retire)

| file:line                                                                         | drift                                                                          | replacement                                        |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| `common/SearchField/index.tsx:12`                                                 | `h-10 border-border bg-card pl-10 pr-3 shadow-none …` (canonical drift source) | delete/reimplement on `<SearchInput>`              |
| `common/AddressBookSearchInput/index.tsx:22`                                      | `dark:bg-white/10 hover:ring-1 …` + `w-full sm:w-[320px]`                      | `<SearchInput className="w-full sm:w-[320px]" …/>` |
| `safe-apps/SafeAppsFilters/index.tsx:45`, `global-search/.../GlobalSearch.tsx:10` | clean consumers                                                                | swap to `<SearchInput>` when SearchField retired   |

### InputGroup + subcomponents

| file:line                                           | drift                                                                | replacement                                                                                    |
| --------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `myAccounts/.../AccountsSearch/index.tsx:16`        | `bg-card px-3 rounded-lg`                                            | `<SearchInput variant="surface" …>` (leading Search)                                           |
| `spaces/.../AddAccounts/index.tsx:417`              | `bg-card px-2`                                                       | `<SearchInput variant="surface">`                                                              |
| `spaces/.../SelectSafesOnboarding/index.tsx:93`     | `bg-card px-2 shrink-0`                                              | `<InputGroup variant="surface" className="shrink-0">` (or SearchInput)                         |
| `spaces/.../SafeDropdownContainer.tsx:156`          | `flex-1 shadow-none`                                                 | `<InputGroup variant="surface" className="flex-1">`                                            |
| `common/SpaceSafeBar/AccountsModal/index.tsx:143`   | `flex-1 shadow-none`                                                 | `<InputGroup variant="surface" className="flex-1">` (SearchInput better)                       |
| `common/DatePickerInput/index.tsx:114`              | `cn(largeFormInputGroupClassName, hasError && 'border-destructive')` | `<InputGroup inputSize="xl" variant="surface" aria-invalid={hasError}>`; delete constant usage |
| `myAccounts/.../AccountListFilters/index.tsx:23`    | `w-full` (search)                                                    | `<SearchInput className="w-full">`                                                             |
| `spaces/.../SearchInput/index.tsx:21`               | layout only (width/transition)                                       | keep layout; inner → `<SearchInput>`                                                           |
| `common/TrustedSafesModal/TrustedSafesList.tsx:120` | `mb-4` (search)                                                      | `<SearchInput className="mb-4">`                                                               |
| `ui/combobox.tsx:80,84`                             | layout / state `bg-transparent`                                      | no change / grandfather                                                                        |
| `tx-flow/common/TxNonce/index.tsx:176`              | `[&_input]:font-bold`                                                | grandfather (font-weight)                                                                      |

Clean: TxNoteInput:47, RpcProviderSection:39, TenderlySection:58,91, AddMemberInput:127 (css module).

### Wrapper/pass-through drift vectors

| file:line                                       | mechanism                                                 | replacement                                                                        |
| ----------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `common/NumberField/index.tsx:92`               | forwards `className` onto Input/InputGroupInput           | add `inputSize`/`variant` props                                                    |
| `transactions/TxFilterForm/index.tsx:197,251`   | `<NumberField className="h-[66px]">` ×2 (deliberate 66px) | `inputSize="xl"`, drop `h-[66px]`                                                  |
| `common/NameInput/index.tsx:93,99`              | forwards `InputProps.className`                           | add `inputSize`/`variant` props                                                    |
| `new-safe/OwnerRow/index.tsx:80,90`             | `InputProps.className = large*` constants                 | `<NameInput inputSize="xl" variant="surface">`; delete formFieldStyles imports     |
| `new-safe/load/.../SetAddressStep/index.tsx:37` | `largeFormInputGroupClassName`                            | `<NameInput inputSize="xl" variant="surface">`                                     |
| `common/formFieldStyles.ts:1`                   | the 66px constants                                        | delete after `xl`+`surface` land (keep `largeFormFieldRowClassName` layout helper) |

Clean NameInput sites (just need wrapper props): SetNameStep:122, SetupNestedSafe:72, AddOwner/ChooseOwner:92, AddTrustedSafeDialog:95, UpsertProposer:293, SpaceCreationModal:83, MemberInfoForm:12, AcceptInviteDialog:87, AddContactDialog:151, EditContactDialog:136, EditOwnerDialog:73, EntryDialog:72.

## ESLint — LIVE (`dsInputClassnameRule` in `eslint.config.mjs`)

Applied to `Input, InputGroup, InputGroupInput, InputGroupAddon, InputGroupText, InputGroupTextarea,
InputGroupButton` + presets `SearchField` (until retired), `SearchInput`, `NumberField`, `NameInput`. Regex is
the button set plus `border`: `(?:^|\s)(h-|px-|py-|text-(xs|sm|base|lg)|rounded-|bg-|border)` — `w-*`, margins,
and flex/grid stay layout-only; `hover:`/`dark:`-prefixed and arbitrary `[…]` utilities aren't flagged.

## Stories

input: add `xl` to `inputSize` options + Sizes row; add "Skins/Variants" (default vs surface, + ghost if added). input-group: add "Sizes" (sm/default/lg/xl), "Surface", "Search preset" (`<SearchInput>`).

## Risk

- **Deliberate 66px tier** (TxFilterForm Amount/Nonce; formFieldStyles used by OwnerRow/SetAddressStep/DatePickerInput) must map to `inputSize="xl"` (66px), NOT flattened to `lg` (40px). Skeleton `h-[66px]` placeholders (PendingTxsList:32, Assets:45) are not Inputs — leave, keep 66 consistent.
- **MUI TextField holdovers:** `common/AddressInput/index.tsx` is NOT on the shadcn Input (uses `@base-ui/react/input` + CSS modules + own 66px) — out of scope but is the parity target for `xl`/`surface`. `NumberField`/`NameInput` launder 66px/surface via `className`/`InputProps.className` → give them `inputSize`/`variant`.
- **cva concat gotcha** (see §proposed) — move `px-3`/`bg-*` out of base.
- **`rounded-lg`/`rounded-sm` outliers** (ActivityLogFilters, CreateSpaceOnboarding) differ from `rounded-md` — fold into tiers or grandfather.
