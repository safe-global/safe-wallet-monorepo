# Releasing to production

The code is being actively developed on the `dev` branch. Pull requests are made against this branch.

We prepare at least one release every sprint. Sprints are two weeks long.

When it's time to make a release, we "freeze" the code by creating a release branch off of the `dev` branch. A release PR is created from that branch, and sent to QA.

### Preparing a release branch

- Create a code-freeze branch named `release`
  - If it's a regular release, this branch is typically based off of `dev`
  - For hot fixes, it would be `main` + cherry-picked commits
- Bump the version in the `package.json` as a separate commit with the commit message equal to the exact version
- Create a PR with the list of changes

  > 💡 To generate a quick changelog:
  >
  > ```bash
  > git log origin/main..origin/dev --pretty=format:'* %s'
  > ```

```bash
git checkout release # switch to the release branch
git fetch --all; git reset --hard origin/dev # sync it with dev
```

Change the version in `app/web/package.json` to the new version.

```bash
git add .
git commit -m '1.54.0' # where 1.54.0 is the new version
git push
```

Once pushed:
* Create a PR from `release` to `main`.
* Add the PR to the Wallet project and set the status to `Ready for QA`

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
git pull origin release
```

- Push:

```
git push
```

A deployment workflow will be triggered and it will do the following things:

- Deploy the build to [staging](https://safe-wallet-web.staging.5afe.dev/)
- Create a new git tag from the version in `package.json`
- Create a draft [GitHub release](https://github.com/safe-global/safe-wallet-web/releases) linked to this tag, with a changelog taken from the release PR

After that, the release manager should:

- Publish the draft release. This will trigger a build and upload the code to an S3 bucket – wait for the job to finish
- Notify devops on Slack and send them the release link to deploy to production
- Back-merge `main` into the `dev` branch to keep them in sync unless the release branch was based on `dev`
