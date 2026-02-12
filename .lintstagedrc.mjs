/**
 * We use bash -c on the type-check command, because lint-staging would pass all
 * the staged files to the type-check command and tsc is then going to ignore its config file
 */
export default {
  'apps/web/**/*.{js,jsx,ts,tsx}': [
    'yarn workspace @safe-global/web prettier:fix',
    'yarn workspace @safe-global/web lint:fix',
    "bash -c 'yarn workspace @safe-global/web type-check' --",
  ],
  'apps/mobile/**/*.{js,jsx,ts,tsx}': [
    'yarn workspace @safe-global/mobile prettier:fix',
    'yarn workspace @safe-global/mobile lint:fix',
    "bash -c 'yarn workspace @safe-global/mobile type-check' --",
  ],
  'packages/store/**/*.{js,jsx,ts,tsx}': [
    'yarn workspace @safe-global/store lint:fix',
    "bash -c 'yarn workspace @safe-global/store type-check' --",
  ],
  'packages/utils/**/*.{js,jsx,ts,tsx}': [
    'yarn workspace @safe-global/utils lint:fix',
    "bash -c 'yarn workspace @safe-global/utils type-check' --",
  ],
  'apps/mobile/assets/fonts/safe-icons/selection.json': [
    'node ./apps/mobile/scripts/generateIconTypes.js',
    'git add ./apps/mobile/src/types/iconTypes.ts',
  ],
}
