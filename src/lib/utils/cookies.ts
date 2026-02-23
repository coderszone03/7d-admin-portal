type CookieOptions = {
  minutes?: number
  path?: string
}

export const setCookie = (name: string, value: string, options: CookieOptions = {}) => {
  if (typeof document === 'undefined') {
    return
  }

  const { minutes, path = '/' } = options
  let expires = ''

  if (typeof minutes === 'number') {
    const date = new Date()
    date.setTime(date.getTime() + minutes * 60 * 1000)
    expires = `; expires=${date.toUTCString()}`
  }

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value || '')}${expires}; path=${path}`
}

export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null
  }

  const needle = `${encodeURIComponent(name)}=`
  const parts = document.cookie.split(';')

  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith(needle)) {
      return decodeURIComponent(trimmed.substring(needle.length))
    }
  }

  return null
}

export const deleteCookie = (name: string, path = '/') => {
  setCookie(name, '', { minutes: -1, path })
}
