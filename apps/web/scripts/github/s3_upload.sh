#!/bin/bash

set -ev

if [[ -f $CHECKSUM_FILE ]]; then
  cp ./$CHECKSUM_FILE ./out/$CHECKSUM_FILE
fi

cd out

# Upload the build to S3
aws s3 sync . "$BUCKET" --delete

export BUCKET

MAX_JOBS=10

# Upload all HTML files again but w/o an extension so that URLs like /welcome open the right page
find . -name '*.html' -print0 | \
xargs -0 -n 1 -P "$MAX_JOBS" -I {} bash -c '
  filepath="{}"
  noext="${filepath%.html}"
  aws s3 cp "$filepath" "$BUCKET/$noext" --content-type "text/html"
'

cd -
