#!/bin/bash

set -ev

# Only:
# - Tagged commits
# - GH_TOKEN and PROMOTIONS_REPO are available.
if [ -n "$VERSION_TAG" ] && [ -n "$GH_TOKEN" ] && [ -n "$PROMOTIONS_REPO" ]
then
  gh workflow run web-core-production.yml \
    --repo "$PROMOTIONS_REPO" \
    -f "tag=$VERSION_TAG"
else
  echo "⚠︎ Production deployment could not be prepared"
fi
