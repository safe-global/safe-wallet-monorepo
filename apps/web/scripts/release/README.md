# Release Scripts

This directory contains helper scripts for the automated release process.

## Scripts

### `generate-changelog.sh`

Enhanced changelog generator with better formatting and categorization.

**Usage:**

```bash
./generate-changelog.sh <base_branch> <compare_branch>
```

**Example:**

```bash
./generate-changelog.sh main dev
```

**Features:**

- Groups commits by type (features, fixes, mobile, chores, etc.)
- Detects breaking changes
- Links to PRs and commits
- Shows author information
- Generates release statistics

**Output:** Markdown-formatted changelog

---

### `notify-slack.sh`

Sends formatted notifications to Slack about release events.

**Usage:**

```bash
SLACK_WEBHOOK_URL="<url>" ./notify-slack.sh <event_type> <version> [additional_info]
```

**Event Types:**

- `release_started` - Release initiated and ready for QA
- `qa_approved` - Release approved and merged
- `release_published` - Release deployed to production
- `backmerge_complete` - Back-merge completed successfully
- `backmerge_conflict` - Back-merge has conflicts
- `release_failed` - Release encountered an error

**Example:**

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
./notify-slack.sh release_started "1.74.0"
```

**Environment Variables:**

- `SLACK_WEBHOOK_URL` (required) - Slack webhook URL
- `GITHUB_REPOSITORY` (optional) - Repository name for links
- `GITHUB_RUN_ID` (optional) - Workflow run ID for links

---

## Integration with GitHub Actions

These scripts are called by the automated release workflows:

- **Start Web Release** (`../.github/workflows/web-release-start.yml`)

  - Uses `generate-changelog.sh` to create PR description
  - Uses `notify-slack.sh` to announce release start

- **Complete Web Release** (`../.github/workflows/web-release-complete.yml`)

  - Uses `notify-slack.sh` to announce QA approval

- **Back-merge Main to Dev** (`../.github/workflows/web-release-backmerge.yml`)
  - Uses `notify-slack.sh` to announce back-merge status

---

## Development

### Testing Changelog Generation

```bash
# Test changelog between branches
./generate-changelog.sh main dev

# Test with different branches
./generate-changelog.sh v1.73.0 release
```

### Testing Slack Notifications

```bash
# Test notification (requires webhook URL)
export SLACK_WEBHOOK_URL="your-webhook-url"
./notify-slack.sh release_started "test-version" "Testing notifications"
```

### Making Changes

After modifying scripts:

1. Test locally first
2. Ensure scripts remain POSIX-compliant
3. Update this README if adding new scripts
4. Update workflow files if script interfaces change

---

## Troubleshooting

### Script not executable

```bash
chmod +x generate-changelog.sh
chmod +x notify-slack.sh
```

### Git commands failing

Ensure you're in a git repository and have fetched latest changes:

```bash
git fetch --all
```

### Slack notifications not working

1. Verify webhook URL is correct
2. Test webhook with curl:
   ```bash
   curl -X POST "$SLACK_WEBHOOK_URL" \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test message"}'
   ```
3. Check GitHub Actions secrets/variables configuration

---

## Contributing

When adding new scripts:

1. Follow existing naming convention
2. Add proper error handling
3. Document usage in this README
4. Make scripts executable (`chmod +x`)
5. Use `#!/usr/bin/env bash` shebang
6. Add comments for complex logic

---

**See also:** [Automated Release Procedure](../../docs/release-procedure-automated.md)
