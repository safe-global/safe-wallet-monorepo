#!/bin/bash

set -ev

if [[ -f $CHECKSUM_FILE ]]; then
  cp ./$CHECKSUM_FILE ./out/$CHECKSUM_FILE
fi

cd out

# Upload the build to S3
aws s3 sync . $BUCKET --delete

# Upload all HTML files again but w/o an extention so that URLs like /welcome open the right page
for file in $(find . -name '*.html' | sed 's|^\./||'); do
    aws s3 cp ${file%} $BUCKET/${file%.*} --content-type 'text/html' &
done

wait

cd -
