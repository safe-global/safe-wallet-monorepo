#!/bin/bash

set -ev

# Only:
# - Tagged commits
# - GH_TOKEN is available.
if [ -n "$VERSION_TAG" ] && [ -n "$GH_TOKEN" ]
then
  gh workflow run web-core-production.yml \
    --repo safe-global/safe-production-promotions \
    -f "tag=$VERSION_TAG"
else
  echo "⚠︎ Production deployment could not be prepared"
fi
