export default {
  'apps/web/**/*.{js,jsx,ts,tsx}': ['yarn workspace @safe-global/web prettier:fix'],
  'apps/mobile/**/*.{js,jsx,ts,tsx}': ['yarn workspace @safe-global/mobile prettier:fix'],
  'packages/store/**/*.{js,jsx,ts,tsx}': ['yarn workspace @safe-global/store prettier:fix'],
  'packages/utils/**/*.{js,jsx,ts,tsx}': ['yarn workspace @safe-global/utils prettier:fix'],
  'packages/theme/**/*.{js,jsx,ts,tsx}': ['yarn workspace @safe-global/theme prettier:fix'],
  'apps/tx-builder/**/*.{js,jsx,ts,tsx}': ['yarn workspace @safe-global/tx-builder prettier:fix'],
}
