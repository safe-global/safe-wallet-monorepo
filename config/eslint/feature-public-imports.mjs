// Features that follow the public/ convention. Other code may import them only through their public/ folder.
const PUBLIC_FOLDER_FEATURES = ['recovery']

export const featurePublicImportPatterns = PUBLIC_FOLDER_FEATURES.map((feature) => ({
  regex: `^@/features/${feature}(/(?!public/).*)?$`,
  message: `Import ${feature} code only from @/features/${feature}/public/. Inside the feature, use relative imports.`,
}))
