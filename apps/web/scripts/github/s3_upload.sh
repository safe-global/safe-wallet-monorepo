#!/bin/bash

set -ev

if [[ -f $CHECKSUM_FILE ]]; then
  cp ./$CHECKSUM_FILE ./out/$CHECKSUM_FILE
fi

cd out

# Upload the build to S3
aws s3 sync . $BUCKET --delete

# Upload all HTML files again but w/o an extention so that URLs like /welcome open the right page
# Max number of parallel processes
MAX_PARALLEL=20

# Counter to track the number of running processes
counter=0

for file in $(find . -name '*.html' | sed 's|^\./||'); do
    # Launch the process
    aws s3 cp "${file%}" "$BUCKET/${file%.*}" --content-type 'text/html' &

    # Increment the counter
    ((counter++))

    # If the counter reaches the max limit, wait for all processes to complete
    if ((counter >= MAX_PARALLEL)); then
        wait
        counter=0
    fi
done

# Wait for any remaining processes to complete
wait

cd -
