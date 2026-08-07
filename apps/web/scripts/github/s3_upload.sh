#!/bin/bash

set -ev

if [[ -f $CHECKSUM_FILE ]]; then
  cp ./$CHECKSUM_FILE ./out/$CHECKSUM_FILE
fi

cd out

# Upload the build to S3. When the storybook build was skipped
# (SKIP_STORYBOOK=true, PR deploys only), exclude storybook/* so
# --delete does not remove the previously deployed storybook.
if [[ "$SKIP_STORYBOOK" == "true" ]]; then
  aws s3 sync . $BUCKET --delete --exclude 'storybook/*'
else
  aws s3 sync . $BUCKET --delete
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