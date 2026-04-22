# epicSpacesM2 shadcn audit

Scope:

- Branch reviewed: `origin/epicSpacesM2`
- Focused on high-confidence shadcn/ui contract breaches in Spaces code

## Three points to highlight

1. Primitives are being styled as if they were raw HTML.
   Visual intent is often pushed through `className` on `Button`, `SidebarMenuButton`, `Avatar`, and `SelectTrigger` instead of through `variant`, `size`, or a wrapper component.

2. Feature CSS is overriding primitive state behavior.
   The sidebar is the clearest example: feature CSS uses `!important` and dark-mode overrides to replace hover and active styling already owned by `SidebarMenuButton`.

3. Repeated overrides point to missing API, not one-off exceptions.
   If the same shape, padding, or surface treatment keeps appearing, add a supported variant/size/wrapper instead of layering more custom classes onto each call site.

## Breach table

| File                                                                                                                                                                               | Usage example                                                                                                                                | Why this breaks the contract                                                                                                                                  | Better approach                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/features/spaces/components/Sidebar/variants/NavItem/NavItem.tsx` and `apps/web/src/features/spaces/components/Sidebar/styles.module.css`                             | `SidebarMenuButton className="h-9 gap-3 ${css.sidebarInteractive} ${css.sidebarNavItem}"` plus dark-mode `!important` hover/active overrides | `SidebarMenuButton` already owns size, spacing, hover, active, and typography through its variant system. Feature CSS replaces those states from the outside. | Add a dedicated `SidebarMenuButton` variant or a small wrapper component for sidebar nav items. Keep feature CSS to layout only. |
| `apps/web/src/features/spaces/components/Sidebar/variants/SpaceSelectorDropdown/SpaceSelectorDropdown.tsx` and `apps/web/src/features/spaces/components/Sidebar/styles.module.css` | `SidebarMenuButton className={...css.spaceSelector}` plus CSS that forces width, padding, background, and collapsed behavior                 | This bypasses the sidebar primitive API and recreates the button surface in feature CSS.                                                                      | Model the selector as a supported sidebar trigger variant or wrapper, rather than restyling the primitive externally.            |
| `apps/web/src/features/spaces/components/Sidebar/ApiCtaSidebar/ApiCtaSidebar.tsx`                                                                                                  | `<Button variant="outline" size="sm" className="w-auto self-start !bg-background hover:!bg-muted">`                                          | `outline` already defines surface and hover treatment. Inline `!bg-*` overrides mutate the variant instead of using it.                                       | Add an API CTA wrapper or a new button variant. Leave `className` for layout only.                                               |
| `apps/web/src/features/spaces/components/Dashboard/HeaderActions.tsx`                                                                                                              | `<Button variant="outline" className="!px-6" ...>` and `<Button variant="default" className="!px-6" ...>`                                    | Button horizontal padding is part of the size contract. `!px-6` creates a hidden new size.                                                                    | Add a larger button size or a dashboard action wrapper component.                                                                |
| `apps/web/src/features/spaces/components/Dashboard/AggregatedBalances.tsx`                                                                                                         | `<Button variant="ghost" size="sm" className="text-muted-foreground">`                                                                       | `ghost` owns its text and hover behavior. Muting the label from the outside creates a one-off variant.                                                        | Add a muted ghost variant if needed repeatedly, otherwise use the standard `ghost` styling.                                      |
| `apps/web/src/features/spaces/components/InviteMembersOnboarding/components/MemberInviteRow.tsx`                                                                                   | `<SelectTrigger className="min-w-[120px] cursor-pointer rounded-lg bg-card data-[size=default]:h-11">`                                       | `SelectTrigger` already owns height, radius, and surface through its base classes and size prop. This override replaces those decisions ad hoc.               | Add a new select size or onboarding-specific wrapper component.                                                                  |
| `apps/web/src/features/spaces/components/SpaceCardNew/index.tsx`                                                                                                                   | `<Avatar ... className="... rounded-[6px] ring-2 ring-border">` and fallback `className="rounded-[6px] text-white font-bold"`                | `Avatar` exposes `size`, but not a square/rounded-rect shape variant. This repurposes the primitive into a custom tile.                                       | Add a dedicated `SpaceAvatar`/`InitialsTile` wrapper or extend the avatar API with an explicit shape variant.                    |
| `apps/web/src/components/common/SpaceSafeBar/SpaceBackLink.tsx`                                                                                                                    | `<Avatar className="size-8 shrink-0">` with fallback `className="rounded-md ..."`                                                            | Size is being set through classes instead of `size="sm"`, and the fallback shape is being changed outside the primitive contract.                             | Use `size="sm"` and move the square-avatar treatment into a wrapper or explicit variant.                                         |
| `apps/web/src/features/spaces/components/Sidebar/variants/SpaceSelectorDropdown/SpaceSelectorDropdown.tsx`                                                                         | `<Avatar className={cn('size-8 shrink-0', css.spaceSelectorItemAvatar)}>`                                                                    | Same pattern repeated: avatar size and shape are being restyled externally instead of through the component API.                                              | Use the built-in avatar size prop and a supported wrapper for workspace/space avatars.                                           |
| `apps/web/src/features/spaces/components/Sidebar/ApiCtaSidebar/ApiCtaSidebar.tsx`                                                                                                  | `<Badge className="text-[10px] px-1 py-0 leading-none ...">New</Badge>`                                                                      | Badge density is being changed inline, effectively creating an undocumented compact badge variant.                                                            | Add a compact badge size/variant if this chip style is legitimate and reused.                                                    |

## Rule of thumb

Usually okay through `className`:

- layout placement
- truncation
- outer wrappers and container spacing

Usually not okay through `className`:

- background, border, radius, height, internal padding
- hover and selected state styling
- `!important`
- typography weight, tracking, and line-height overrides on `Typography`

If those are needed repeatedly, the design system needs a new variant, size, or wrapper.
