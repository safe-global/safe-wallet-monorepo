# Update yarn patches

You can find all patches that are currently applied inside the `.yarn/patches` directory. The name of the package that the patch applies to can be found in the file name of the patch.

Following are the steps to update a patch in case an update to the dependency needs to be done:

1. Go to the `package.json` of where the dependency is located and change the version manually 
   1. e.g. `"next": "patch:next@15.1.2#../../.yarn/patches/next-npm-15.1.2-24e7411703.patch"` -> `"next": "15.2.3"`
2. Run `yarn install` to update the dependency
3. Run `yarn patch <package-name>` e.g. `yarn patch next@npm:15.2.3`
4. Follow the instructions from your CLI
   1. This will generate a temporary directory with files of that dependency
   2. Navigate to that directory and do the necessary changes
   3. Run `yarn patch-commit -s <path to temporary directory>`
5. Check the generated patch file inside `.yarn/patches` and make sure it contains the expected changes
6. Update the dependency inside `package.json`
   1. e.g. `"next": "patch:next@15.2.3#../../.yarn/patches/next-npm-15.2.3-06a6671f62.patch"`
7. Run `yarn install` to update the dependency and lock file
8. Go to the package directory inside `node_modules` and check that the patch is applied