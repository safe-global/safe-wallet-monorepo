#!/bin/bash

set -ev

# Only:
# - Tagged commits
# - GH_TOKEN and PROMOTIONS_REPO are available.
if [ -n "$VERSION_TAG" ] && [ -n "$GH_TOKEN" ] && [ -n "$PROMOTIONS_REPO" ]
then
  # --ref is required: without it gh resolves the default branch via GraphQL,
  # which the app token (actions:write, metadata:read only) is not allowed to do.
  if ! gh workflow run web-core-production.yml \
    --repo "$PROMOTIONS_REPO" \
    --ref main \
    -f "tag=$VERSION_TAG"
  then
    echo "::error::Failed to dispatch production deployment for $VERSION_TAG"
    exit 1
  fi
else
  echo "::warning::Production deployment could not be prepared: VERSION_TAG, GH_TOKEN or PROMOTIONS_REPO missing"
fi
