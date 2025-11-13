# Automated Release Procedure

This guide describes the **automated release process** using GitHub Actions workflows.

---

## Quick Reference

### Starting a Release
```
GitHub → Actions → "🚀 Start Web Release"
→ Enter version (e.g., 1.74.0)
→ Choose type (regular/hotfix)
→ Click "Run workflow"
```

### Back-merge
```
GitHub → Actions → "🔄 Back-merge Main to Dev"
→ Click "Run workflow"
```

---

## Complete Release Process

### Step 1: Start Release

**Who:** Release Manager

1. Go to **GitHub → Actions → "🚀 Start Web Release"**
2. Click **"Run workflow"**
3. Fill in:
   - **Version:** e.g., `1.74.0` (must be X.Y.Z format)
   - **Release type:**
     - `regular` → from `main` branch (normal releases)
     - `hotfix` → from `main` branch (urgent fixes)
4. Click **"Run workflow"**

**What happens automatically:**
- ✅ Creates/updates `release` branch
- ✅ Bumps version in `package.json`
- ✅ Generates changelog with grouped changes
- ✅ Creates PR from `release` to `main`
- ✅ Sends Slack notification (if configured)

**Result:** Pull Request ready for QA (~2-3 minutes)

---

### Step 2: QA Testing

**Who:** QA Team

**Manual process** (unchanged):
1. Find the release PR (has `release` label)
2. Test the changes thoroughly
3. If bugs found:
   - Create PRs targeting `release` branch
   - Merge fixes
   - Continue testing
4. When all tests pass → Approve the PR

---

### Step 3: Merge Release PR

**Who:** Release Manager (after QA approval)

**Manual steps:**
1. Review and approve the release PR
2. Merge the PR to `main`

**What happens automatically:**
- ✅ Creates git tag
- ✅ Creates and publishes GitHub release
- ✅ Builds production assets
- ✅ Deploys to production
- ✅ Sends Slack notification to `#topic-wallet-releases`

**Result:** Production deployment completed (~5-10 minutes)

---

### Step 4: Back-merge

**Who:** Release Manager (after production deployment)

1. Go to **GitHub → Actions → "🔄 Back-merge Main to Dev"**
2. Click **"Run workflow"**
3. Keep defaults or choose "Create PR" to review changes
4. Click **"Run workflow"**

**What happens automatically:**
- ✅ Checks if back-merge needed
- ✅ Detects merge conflicts
- ✅ If clean → merges directly to `dev`
- ✅ If conflicts → creates PR for manual resolution
- ✅ Sends Slack notification (if configured)

**Result:** Branches synced (~1 minute)

---

## Configuration

### Required: None

Workflows work immediately after merging this PR.

### Optional: Slack Notifications

To enable notifications:
1. Create a Slack webhook URL
2. Go to **Settings → Secrets and variables → Actions → Variables**
3. Add variable: `SLACK_WEBHOOK_URL` with your webhook URL

Notifications will be sent for:
- Release started
- Production deployment completed (to `#topic-wallet-releases` channel)
- Back-merge status

---

## Workflow Diagram

```
┌──────────────┐
│   dev        │  ← Active development
└──────┬───────┘
       │
       │ (1) Click "Start Release"
       ▼
┌──────────────┐
│   release    │  ← Code freeze for QA
└──────┬───────┘
       │
       │ (2) QA Testing (manual)
       │ (3) Merge PR
       ▼
┌──────────────┐
│   main       │  ← Production-ready
└──────┬───────┘
       │
       │ (Auto: Tag, Release & Deploy)
       ▼
   Production 🎉
       │
       │ (4) Click "Back-merge"
       ▼
┌──────────────┐
│   dev        │  ← Synced
└──────────────┘
```

---

## Troubleshooting

### Version already exists
**Problem:** Version tag already exists
**Solution:** Use a different version number

### PR checks failing
**Problem:** Complete Release won't run due to failing checks
**Solution:**
- Fix the failing checks, or
- Use `skip_checks: true` if checks are incorrectly failing

### Back-merge conflicts
**Problem:** Cannot automatically merge main to dev
**Solution:** Workflow creates PR automatically - resolve conflicts manually

### Workflow not appearing
**Problem:** Can't find workflow in Actions tab
**Solution:**
- Ensure workflows are merged to main/dev branch
- Refresh the Actions page
- Check you have repository access

### Slack notifications not working
**Problem:** No Slack messages received
**Solution:**
- Verify `SLACK_WEBHOOK_URL` is configured in repository variables
- Test webhook manually with curl
- Check workflow logs for errors

---

## Important Notes

### What's Automated
- Creating release branches
- Bumping versions
- Generating changelogs
- Creating and merging PRs
- Syncing branches

### What's Manual (Human Control)
- **QA testing and approval** - Still requires thorough testing
- **PR review and approval** - Team still reviews changes
- **Decision to merge** - You trigger "Complete Release" only after QA approves
- **Publishing releases** - You manually publish the draft
- **Production deployment** - DevOps still controls final deployment

### Safety
- ✅ No breaking changes - manual process still documented
- ✅ Existing deployment workflows unchanged
- ✅ Easy rollback - just don't use the workflows
- ✅ QA process remains human-controlled

---

## Manual Process (Fallback)

If you need to use the manual process, see the legacy documentation in `release-procedure.md`.

Use manual process if:
- Automated workflows are unavailable
- You need emergency access without GitHub UI
- Debugging workflow issues

---

## Support

- **Quick questions:** Review this guide
- **Workflow issues:** Check Actions logs for detailed error messages
- **Process questions:** Contact Release Manager
- **Bug reports:** Create GitHub issue with workflow run link

---

## Links

- GitHub Actions: https://github.com/safe-global/safe-wallet-monorepo/actions
- Release Workflows:
  - [Start Release](https://github.com/safe-global/safe-wallet-monorepo/actions/workflows/web-release-start.yml)
  - [Back-merge](https://github.com/safe-global/safe-wallet-monorepo/actions/workflows/web-release-backmerge.yml)
  - [Tag Release](https://github.com/safe-global/safe-wallet-monorepo/actions/workflows/web-tag-release.yml) (auto-triggered)
  - [Deploy Production](https://github.com/safe-global/safe-wallet-monorepo/actions/workflows/web-deploy-production.yml) (auto-triggered)

