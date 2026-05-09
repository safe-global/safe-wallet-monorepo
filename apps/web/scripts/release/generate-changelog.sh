#!/usr/bin/env bash

# Enhanced changelog generator with better formatting and categorization
# Usage: ./generate-changelog.sh <base_branch> <compare_branch>

set -e

BASE_BRANCH=${1:-main}
COMPARE_BRANCH=${2:-dev}

# Colors for terminal output (optional)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if branches exist
if ! git rev-parse --verify "origin/$BASE_BRANCH" >/dev/null 2>&1; then
  echo -e "${RED}Error: Branch origin/$BASE_BRANCH does not exist${NC}" >&2
  exit 1
fi

if ! git rev-parse --verify "origin/$COMPARE_BRANCH" >/dev/null 2>&1; then
  echo -e "${RED}Error: Branch origin/$COMPARE_BRANCH does not exist${NC}" >&2
  exit 1
fi

# Count commits
COMMIT_COUNT=$(git rev-list --count origin/"$BASE_BRANCH"..origin/"$COMPARE_BRANCH")

if [ "$COMMIT_COUNT" -eq 0 ]; then
  echo "No changes between $BASE_BRANCH and $COMPARE_BRANCH"
  exit 0
fi

# Arrays for grouping
declare -a features=()
declare -a fixes=()
declare -a mobile=()
declare -a breaking=()
declare -a chores=()
declare -a others=()

# Process commits
while IFS="|" read -r hash subject author; do
  # Skip merge commits
  if [[ $subject =~ ^Merge ]]; then
    continue
  fi

  # Extract PR number if exists
  if [[ $subject =~ \(#([0-9]+)\) ]]; then
    PR_NUM="${BASH_REMATCH[1]}"
    PR_LINK="[#$PR_NUM](https://github.com/${GITHUB_REPOSITORY:-safe-global/safe-wallet-web}/pull/$PR_NUM)"
    DESC=$(echo "$subject" | sed -E 's/ \(#([0-9]+)\)//')
  else
    PR_LINK="[\`$hash\`](https://github.com/${GITHUB_REPOSITORY:-safe-global/safe-wallet-web}/commit/$hash)"
    DESC="$subject"
  fi

  # Clean up description
  DESC=$(echo "$DESC" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

  # Detect breaking changes
  if [[ $DESC =~ BREAKING[[:space:]]CHANGE ]] || [[ $subject =~ ! ]]; then
    breaking+=("| $DESC | $PR_LINK | $author |")
    continue
  fi

  # Group by conventional commit prefix
  if [[ $DESC =~ ^[a-zA-Z]+\([Mm]obile\): ]]; then
    mobile+=("| $DESC | $PR_LINK | $author |")
  elif [[ $DESC =~ ^[Ff]eat(\(.*\))?: ]]; then
    features+=("| $DESC | $PR_LINK | $author |")
  elif [[ $DESC =~ ^[Ff]ix(\(.*\))?: ]]; then
    fixes+=("| $DESC | $PR_LINK | $author |")
  elif [[ $DESC =~ ^[Cc]hore(\(.*\))?: ]] || [[ $DESC =~ ^[Bb]uild(\(.*\))?: ]] || [[ $DESC =~ ^[Cc]i(\(.*\))?: ]]; then
    chores+=("| $DESC | $PR_LINK | $author |")
  else
    others+=("| $DESC | $PR_LINK | $author |")
  fi
done < <(git log origin/"$BASE_BRANCH"..origin/"$COMPARE_BRANCH" --pretty=format:'%h|%s|%an')

# Function to print a table
print_table() {
  local title=$1
  local emoji=$2
  shift 2
  local rows=("$@")

  if [ ${#rows[@]} -gt 0 ]; then
    echo ""
    echo "### $emoji $title"
    echo ""
    echo "| Change | PR/Commit | Author |"
    echo "|--------|-----------|--------|"
    for row in "${rows[@]}"; do
      echo "$row"
    done
  fi
}

# Print statistics
echo "## 📊 Release Statistics"
echo ""
echo "- **Total commits:** $COMMIT_COUNT"
echo "- **Features:** ${#features[@]}"
echo "- **Bug fixes:** ${#fixes[@]}"
echo "- **Mobile changes:** ${#mobile[@]}"
echo "- **Breaking changes:** ${#breaking[@]}"
echo ""
echo "---"
echo ""

# Print grouped tables
if [ ${#breaking[@]} -gt 0 ]; then
  print_table "Breaking Changes" "⚠️" "${breaking[@]}"
  echo ""
  echo "> **Warning:** This release contains breaking changes. Please review carefully."
  echo ""
fi

print_table "Features" "✨" "${features[@]}"
print_table "Bug Fixes" "🐛" "${fixes[@]}"
print_table "Mobile" "📱" "${mobile[@]}"
print_table "Chores & Maintenance" "🔧" "${chores[@]}"
print_table "Other Changes" "📦" "${others[@]}"

echo ""
echo "---"
echo ""
echo "_Generated from \`$BASE_BRANCH..$COMPARE_BRANCH\` on $(date -u +"%Y-%m-%d %H:%M:%S UTC")_"
