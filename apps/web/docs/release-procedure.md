# Releasing to production

> **⚠️ NOTICE: This document describes the LEGACY manual release process.**
>
> **For the NEW automated process using GitHub Actions (recommended), see:** > **[📖 Automated Release Procedure](./release-procedure-automated.md)**
>
> ---

## Legacy Manual Process

The code is being actively developed on the `dev` branch. Pull requests are made against this branch.

We prepare at least one release every sprint. Sprints are two weeks long.

When it's time to make a release, we "freeze" the code by creating a release branch off of the `dev` branch. A release PR is created from that branch, and sent to QA.

### Preparing a release branch

- Create a code-freeze branch named `release/X.Y.Z`, where `X.Y.Z` is the new version. The git tag and the app version are taken from this name
  - If it's a regular release, this branch is typically based off of `dev`
  - For hot fixes, it would be `main` + cherry-picked commits
- Create a PR with the list of changes

  > 💡 To generate a quick changelog:
  >
  > ```bash
  > git log origin/main..origin/dev --pretty=format:'* %s'
  > ```
  >
  > To generate a more structured table layout:
  >
  > ```
  > bash ./scripts/release-notes.sh <target branch> <source branch>
  > ```

```bash
git checkout -B release/1.54.0 # where 1.54.0 is the new version
git fetch --all; git reset --hard origin/dev # sync it with dev
```

Once pushed:

- Create a PR from `release/1.54.0` to `main`.
- Add the PR to the Wallet project and set the status to `Ready for QA`

### QA

- The QA team do regression testing on this branch
- If issues are found, bugfixes are merged into this branch
- Once the QA is done, proceed to the next step

### Releasing to production

After the PR is tested and approved by QA:

- Switch to the main branch and make sure it's up to date:

```
git checkout main
git fetch --all
git reset --hard origin/main
```

- Pull from the release branch:

```
git pull origin release/1.54.0
```

- Push:

```
git push
```

A deployment workflow will be triggered and it will do the following things:

- Create a new git tag from the version in the release branch name
- Create and publish a [GitHub release](https://github.com/safe-global/safe-wallet-web/releases) linked to this tag, with a changelog taken from the release PR
- Build production assets
- Upload to S3
- Prepare production deployment

After that, the release manager should:

- Notify devops on Slack and send them the release link to deploy to production

**Note:** The `main` branch is automatically back-merged into `dev` by the workflow
