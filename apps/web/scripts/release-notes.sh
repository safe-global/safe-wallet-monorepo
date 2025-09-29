#!/usr/bin/env bash

# Generate grouped release notes as Markdown tables from commit messages
# Usage: ./release-notes.sh main dev

BASE_BRANCH=${1:-main}
COMPARE_BRANCH=${2:-dev}

# Arrays for grouping
features=()
fixes=()
mobile=()
others=()

# Process commits (short hash + subject)
while IFS="|" read -r hash subject; do
  # Extract PR if exists
  if [[ $subject =~ \(#([0-9]+)\) ]]; then
    PR="#${BASH_REMATCH[1]}"
    DESC=$(echo "$subject" | sed -E 's/ \(#([0-9]+)\)//')
  else
    PR="$hash"   # fallback to commit hash
    DESC="$subject"
  fi

  # Group by prefix
  if [[ $DESC =~ ^[a-zA-Z]+\([Mm]obile\): ]]; then
    mobile+=("| $DESC | $PR |")
  elif [[ $DESC =~ ^([Ff]eat) ]]; then
    features+=("| $DESC | $PR |")
  elif [[ $DESC =~ ^([Ff]ix) ]]; then
    fixes+=("| $DESC | $PR |")
  else
    others+=("| $DESC | $PR |")
  fi
done < <(git log origin/"$BASE_BRANCH"..origin/"$COMPARE_BRANCH" --pretty=format:'%h|%s')

# Function to print a table
print_table () {
  local title=$1
  shift
  local rows=("$@")
  if [ ${#rows[@]} -gt 0 ]; then
    echo "### $title"
    echo ""
    echo "| Change | PR/Commit |"
    echo "|--------|-----------|"
    for row in "${rows[@]}"; do
      echo "$row"
    done
    echo ""
  fi
}

# Print grouped tables
print_table "🚀 Features" "${features[@]}"
print_table "🐛 Fixes" "${fixes[@]}"
print_table "📱 Mobile" "${mobile[@]}"
print_table "📦 Other" "${others[@]}"
