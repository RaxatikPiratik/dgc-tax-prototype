export const DEMO_AUTH_KEY = 'dgc-demo-auth'

export function getDemoSession() {
  if (typeof window === 'undefined') {
    return null
  }

  const storedValue = window.localStorage.getItem(DEMO_AUTH_KEY)

  if (!storedValue) {
    return null
  }

  try {
    return JSON.parse(storedValue)
  } catch {
    return null
  }
}

export function setDemoSession(session) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(session))
}

export function clearDemoSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(DEMO_AUTH_KEY)
}
