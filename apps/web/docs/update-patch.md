# Update yarn patches

You can find all patches that are currently applied inside the `.yarn/patches` directory. The name of the package that the patch applies to can be found in the file name of the patch.

Following are the steps to update a patch in case an update to the dependency needs to be done.

1. Run `yarn add <package-name>@<version>` to update the dependency

### If the file you are patching hasn't changed after the update:

1. Update the patch file name inside `.yarn/patches` to reflect the new version
   1. e.g. `next-npm-15.2.3-06a6671f62.patch` -> `next-npm-15.2.4-06a6671f62.patch`
2. Update the dependency inside `package.json` again to apply the patch
   1. e.g. `"next": "15.2.4"` -> `"next": "patch:next@15.2.4#../../.yarn/patches/next-npm-15.2.4-06a6671f62.patch"`
3. Run `yarn install` to update lock file
4. Go to the package directory inside `node_modules` and check that the patch is applied

### If the file you are patching has changed after the update:

1. Run `yarn patch <package-name>` e.g. `yarn patch next@npm:15.2.4`
2. Follow the instructions from your CLI
3. Check the generated patch file inside `.yarn/patches` and make sure it contains the expected changes
4. Update the dependency inside `package.json`
   1. e.g. `"next": "15.2.4"` -> `"next": "patch:next@15.2.4#../../.yarn/patches/next-npm-15.2.4-06a6671f62.patch"`
5. Run `yarn install` to update lock file
6. Go to the package directory inside `node_modules` and check that the patch is applied
