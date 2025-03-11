export const getInputThemeName = (hasError?: boolean, hasSuccess?: boolean) => {
  if (hasError) {
    return 'error'
  }

  if (hasSuccess) {
    return 'success'
  }

  return 'default'
}
