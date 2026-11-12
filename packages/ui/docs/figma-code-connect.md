# Figma Code Connect Reference

This document maps Figma design components to their code implementations in the Safe Wallet design system.

## Overview

**Figma File:** [Obra shadcn-ui (safe)](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-)
**File Key:** `trBVcpjZslO63zxiNUI9io`
**Code Location:** `packages/ui/src/primitives/<name>/` (shadcn primitives) and `packages/ui/src/components/<name>/` (Safe components)

Code Connect links Figma component definitions to their React implementations, enabling designers and developers to navigate between design and code seamlessly.

---

## Connected Components

| Component      | Code File                                                                    | Component Node       | Figma Canvas                                                                                        |
| -------------- | ---------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------- |
| Accordion      | [accordion.tsx](../src/primitives/accordion/accordion.tsx)                   | `66:5034`, `66:5041` | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=66-5033)   |
| Alert          | [alert.tsx](../src/primitives/alert/alert.tsx)                               | `58:5416`            | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-44439) |
| AlertDialog    | [alert-dialog.tsx](../src/primitives/alert-dialog/alert-dialog.tsx)          | `139:11941`          | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-52053) |
| Avatar         | [avatar.tsx](../src/primitives/avatar/avatar.tsx)                            | `18:1398`            | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-44440) |
| Badge          | [badge.tsx](../src/primitives/badge/badge.tsx)                               | `19:6979`            | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-44441) |
| Breadcrumb     | [breadcrumb.tsx](../src/primitives/breadcrumb/breadcrumb.tsx)                | `1362:217`           | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-51940) |
| Button         | [button.tsx](../src/primitives/button/button.tsx)                            | `9:1071`             | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-44442) |
| Calendar       | [calendar.tsx](../src/primitives/calendar/calendar.tsx)                      | `288:119954`         | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49186) |
| Card           | [card.tsx](../src/primitives/card/card.tsx)                                  | `179:29234`          | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-51942) |
| Carousel       | [carousel.tsx](../src/primitives/carousel/carousel.tsx)                      | `164:18293`          | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-44448) |
| Checkbox       | [checkbox.tsx](../src/primitives/checkbox/checkbox.tsx)                      | `16:1790`            | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49175) |
| Command        | [command.tsx](../src/primitives/command/command.tsx)                         | `66:5046`            | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-52056) |
| Dialog         | [dialog.tsx](../src/primitives/dialog/dialog.tsx)                            | `151:12298`          | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-51941) |
| Drawer         | [drawer.tsx](../src/primitives/drawer/drawer.tsx)                            | `151:12313`          | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-52050) |
| HoverCard      | [hover-card.tsx](../src/primitives/hover-card/hover-card.tsx)                | `303:246487`         | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-52051) |
| Input          | [input.tsx](../src/primitives/input/input.tsx)                               | `16:1738`            | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49172) |
| InputOTP       | [input-otp.tsx](../src/primitives/input-otp/input-otp.tsx)                   | `140:11468`          | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49177) |
| Label          | [label.tsx](../src/primitives/label/label.tsx)                               | `103:9453`           | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49170) |
| NavigationMenu | [navigation-menu.tsx](../src/primitives/navigation-menu/navigation-menu.tsx) | `294:233298`         | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-51938) |
| Pagination     | [pagination.tsx](../src/primitives/pagination/pagination.tsx)                | `133:11358`          | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-51939) |
| Progress       | [progress.tsx](../src/primitives/progress/progress.tsx)                      | `438:64981`          | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49187) |
| RadioGroup     | [radio-group.tsx](../src/primitives/radio-group/radio-group.tsx)             | `16:1796`            | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49182) |
| Resizable      | [resizable.tsx](../src/primitives/resizable/resizable.tsx)                   | `222:27733`          | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-52055) |
| ScrollArea     | [scroll-area.tsx](../src/primitives/scroll-area/scroll-area.tsx)             | `164:18669`          | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-52054) |
| Select         | [select.tsx](../src/primitives/select/select.tsx)                            | `16:1732`            | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49185) |
| Separator      | [separator.tsx](../src/primitives/separator/separator.tsx)                   | `176:26202`          | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49137) |
| Sheet          | [sheet.tsx](../src/primitives/sheet/sheet.tsx)                               | `301:243831`         | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-52049) |
| Sidebar        | [sidebar.tsx](../src/primitives/sidebar/sidebar.tsx)                         | `27:3414`            | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-51929) |
| Skeleton       | [skeleton.tsx](../src/primitives/skeleton/skeleton.tsx)                      | `303:246698`         | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-52052) |
| Slider         | [slider.tsx](../src/primitives/slider/slider.tsx)                            | `65:4902`            | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49188) |
| Sonner         | [sonner.tsx](../src/primitives/sonner/sonner.tsx)                            | `139:11361`          | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-51943) |
| Switch         | [switch.tsx](../src/primitives/switch/switch.tsx)                            | `16:1801`            | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49184) |
| Table          | [table.tsx](../src/primitives/table/table.tsx)                               | `19:6472`            | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-52058) |
| Tabs           | [tabs.tsx](../src/primitives/tabs/tabs.tsx)                                  | `9:639`              | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-50580) |
| Textarea       | [textarea.tsx](../src/primitives/textarea/textarea.tsx)                      | `16:1745`            | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-49180) |
| Toggle         | [toggle.tsx](../src/primitives/toggle/toggle.tsx)                            | `816:112827`         | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-44447) |
| Tooltip        | [tooltip.tsx](../src/primitives/tooltip/tooltip.tsx)                         | `133:14788`          | [View](https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-44449) |

---

## Components Without Figma Designs

These components exist in code but don't have corresponding Figma designs in this file:

- `chart.tsx` - Chart visualization component
- `collapsible.tsx` - Collapsible/accordion primitive
- `context-menu.tsx` - Right-click context menu
- `dropdown-menu.tsx` - Dropdown menu component
- `form.tsx` - Form utilities (react-hook-form integration)
- `menubar.tsx` - Menu bar component
- `popover.tsx` - Popover/floating content
- `toggle-group.tsx` - Composed layout using Toggle components

---

## How to Connect New Components

### 1. Find the Component Node ID

Canvas pages are documentation containers. To find the actual component definition:

1. Open the Figma canvas page
2. Look for a frame containing `<symbol>` elements (component variants)
3. The frame ID (e.g., `139:11361`) is the component node ID

### 2. Connect via Figma MCP

Use the `add_code_connect_map` tool:

```
fileKey: trBVcpjZslO63zxiNUI9io
nodeId: <component-node-id>
source: https://github.com/safe-global/safe-wallet-monorepo/blob/design-system-exploration/apps/web/src/components/ui/<component>.tsx
componentName: <PascalCaseName>
label: React
```

### 3. Verify Connection

Use `get_code_connect_map` to verify the connection was successful.

---

## Statistics

| Status               | Count  |
| -------------------- | ------ |
| Connected            | 37     |
| No Figma Design      | 8      |
| **Total Components** | **45** |
