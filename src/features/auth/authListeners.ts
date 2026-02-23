import { createListenerMiddleware } from '@reduxjs/toolkit'
import { deleteCookie, setCookie } from '../../lib/utils/cookies'
import { AUTH_COOKIE_KEY, AUTH_COOKIE_MAX_AGE_MINUTES } from './constants'
import { loginSuccess, logout } from './authSlice'

const authListenerMiddleware = createListenerMiddleware()

authListenerMiddleware.startListening({
  actionCreator: loginSuccess,
  effect: async (action) => {
    setCookie(AUTH_COOKIE_KEY, JSON.stringify(action.payload), {
      minutes: AUTH_COOKIE_MAX_AGE_MINUTES,
    })
  },
})

authListenerMiddleware.startListening({
  actionCreator: logout,
  effect: async () => {
    deleteCookie(AUTH_COOKIE_KEY)
  },
})

export default authListenerMiddleware
