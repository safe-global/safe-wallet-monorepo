#!/usr/bin/env bash
# Resolves the NEXT_PUBLIC_* build environment for the web app.
#
# The `build` composite action receives the individual secrets it needs as env
# vars from its calling step. This script derives the values the bundler
# expects from them. It must be *sourced* from the same shell that invokes the
# bundler, so the exports are not subject to `$GITHUB_ENV` precedence rules.
#
# Expects: PROD ("true" for production builds), COMMIT_SHA, APP_VERSION (release builds only).

SHA="${COMMIT_SHA:-}"
export NEXT_PUBLIC_COMMIT_HASH="${NEXT_PUBLIC_COMMIT_HASH:-${SHA:0:7}}"

# Release builds pass APP_VERSION from the GitHub release tag. Every other build shows
# the latest published release; the checkout is shallow, so read the tags from the remote.
export NEXT_PUBLIC_APP_VERSION="${NEXT_PUBLIC_APP_VERSION:-${APP_VERSION:-}}"
if [ -z "$NEXT_PUBLIC_APP_VERSION" ]; then
  LATEST_RELEASE=$(git ls-remote --tags --refs origin 'refs/tags/web-v*' 2>/dev/null | sed 's|.*refs/tags/web-v||' | sort -V | tail -n 1 || true)
  if [ -n "$LATEST_RELEASE" ]; then
    export NEXT_PUBLIC_APP_VERSION="$LATEST_RELEASE"
  fi
fi

# Staging, dev and PR-preview builds use the devstaging Infura tokens.
if [ "${PROD:-}" != "true" ]; then
  export NEXT_PUBLIC_INFURA_TOKEN="${NEXT_PUBLIC_INFURA_TOKEN_DEVSTAGING:-}"
  export NEXT_PUBLIC_SAFE_APPS_INFURA_TOKEN="${NEXT_PUBLIC_SAFE_APPS_INFURA_TOKEN_DEVSTAGING:-}"
fi

# Datadog RUM env: the NEXT_PUBLIC_DATADOG_RUM_ENV secret wins when set,
# otherwise it follows the prod flag.
if [ -z "${NEXT_PUBLIC_DATADOG_RUM_ENV:-}" ]; then
  if [ "${PROD:-}" = "true" ]; then
    export NEXT_PUBLIC_DATADOG_RUM_ENV='production'
  else
    export NEXT_PUBLIC_DATADOG_RUM_ENV='development'
  fi
fi

# Secrets that aren't configured arrive as empty strings and the bundler inlines
# those verbatim. Drop them so the app's `?? default` and `!== undefined` checks
# keep treating them as absent.
for _var in $(compgen -e | grep '^NEXT_PUBLIC_' || true); do
  if [ -z "${!_var:-}" ]; then
    unset "$_var"
  fi
done
unset _var

echo 'NEXT_PUBLIC_* variables in the build env:'
compgen -e | grep '^NEXT_PUBLIC_' | sort | sed 's/^/  /' || true
