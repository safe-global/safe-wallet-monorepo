export default {
  '**/*.{js,jsx,ts,tsx,md,json,css,yml,yaml}': ['prettier --write'],
  'apps/mobile/assets/fonts/safe-icons/safe-icons.icomoon.json': [
    'node ./apps/mobile/scripts/generateIconTypes.js',
    'git add ./apps/mobile/src/types/iconTypes.ts',
  ],
}
