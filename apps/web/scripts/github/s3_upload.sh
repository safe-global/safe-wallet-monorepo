#!/bin/bash

set -ev

if [[ -f $CHECKSUM_FILE ]]; then
  cp ./$CHECKSUM_FILE ./out/$CHECKSUM_FILE
fi

cd out

# Upload the build to S3
aws s3 sync . $BUCKET --delete --exclude "storybook/*"

# Storybook's entry files are not content-hashed; a cached index points at bundles --delete already removed.
# Paths excluded from a sync are also excluded from its --delete, so these passes own storybook/.
# The release workflow builds no Storybook, so the directory may not exist.
# JS/CSS/JSON are uploaded pre-gzipped: the review host otherwise gzips the multi-MB bundles on every request, slowly.
# HTML stays plain because the extensionless-HTML loop below re-uploads it without a Content-Encoding.
if [[ -d storybook ]]; then
  find storybook -type f \( -name '*.js' -o -name '*.css' -o -name '*.json' \) -exec gzip -9 -n {} \; -exec mv {}.gz {} \;
  aws s3 sync storybook "$BUCKET/storybook" --delete --cache-control "no-cache" --content-encoding gzip \
    --exclude "*" --include "*.js" --include "*.css" --include "*.json"
  aws s3 sync storybook "$BUCKET/storybook" --delete --cache-control "no-cache" \
    --exclude "*.js" --exclude "*.css" --exclude "*.json"
fi

function parallel_limit {
    local max="$1"
    while (( $(jobs -rp | wc -l) >= max )); do
        sleep 0.1
    done
}

export BUCKET

MAX_JOBS=10

# Upload all HTML files again but w/o an extention so that URLs like /welcome open the right page
find . -name '*.html' -print0 | while IFS= read -r -d '' file; do
    filepath="${file#./}"
    noext="${filepath%.html}"

    # Throttle jobs when max limit is hit
    parallel_limit "$MAX_JOBS"

    # Upload files to S3 using parallel threads
    aws s3 cp "$filepath" "$BUCKET/$noext" --content-type 'text/html' &
done

wait

cd -