// Full-page navigation lives here because jsdom's window.location can't be spied on; tests mock this module.
export const navigateTo = (url: string): void => {
  window.location.assign(url)
}

export const reloadPage = (): void => {
  window.location.reload()
}
