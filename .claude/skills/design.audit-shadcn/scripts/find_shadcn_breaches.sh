#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${1:-.}"

cd "$REPO_ROOT"

if ! command -v rg >/dev/null 2>&1; then
  echo "rg is required" >&2
  exit 1
fi

echo "== Primitive className overrides =="
rg -n \
  "<Button[^>]*className=|<Badge[^>]*className=|<Avatar[^>]*className=|<AvatarFallback[^>]*className=|<Typography[^>]*className=|<SidebarMenuButton[^>]*className=|<SelectTrigger[^>]*className=" \
  apps/web/src/features/spaces \
  apps/web/src/components/common/SpaceSafeBar \
  apps/web/src/features/safe-overview \
  -g '!**/*.stories.tsx' \
  -g '!**/*.test.tsx' \
  -g '!**/__tests__/**'

echo
echo "== CSS/state overrides =="
rg -n \
  "!important|hover:!|!bg-|!border-|!px-|data-active|data-open|hover:bg-sidebar|background-color: var\\(--secondary\\)" \
  apps/web/src/features/spaces/components/Sidebar \
  apps/web/src/features/spaces/components/Dashboard \
  apps/web/src/components/common/SpaceSafeBar \
  -g '!**/*.stories.tsx' \
  -g '!**/*.test.tsx' \
  -g '!**/__tests__/**'

echo
echo "== Primitive contracts to verify against =="
printf '%s\n' \
  "apps/web/src/components/ui/button.tsx" \
  "apps/web/src/components/ui/sidebar.tsx" \
  "apps/web/src/components/ui/avatar.tsx" \
  "apps/web/src/components/ui/select.tsx" \
  "apps/web/src/components/ui/typography.tsx"
