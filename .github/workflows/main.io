            - name: Update GitBoard.io Dashboard
  # You may pin to the exact commit or the version.
  # uses: gitboard-io/gitboard-action@4dc4751047fdaf866c6c11d497d331349e48f23c
  uses: gitboard-io/gitboard-action@v1.1.2
  with:
    # GitBoard.io username, dictates which GitBoard.io account will reflect the job status. A users GitBoard.io username can be found at https://gitboard.io/profile. Multiple account usernames can be supplied. Separate account usernames with a comma. Align corresponding account usernames and account keys.
    username: 
    # GitBoard.io users api key, authenticates the request to the GitBoard.io api. This should be kept secret, we recommend storing this in a GitHub secret. A users GitBoard.io api key can be found at https://gitboard.io/profile. Multiple account keys can be supplied. Separate account keys with a comma. Align corresponding account usernames and account keys.
    key: 
    # job status
    status: # optional, default is ${{ job.status }}
          
