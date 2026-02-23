import client from './client'

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
}

export const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  const response = await client.post<LoginResponse>('/admin/login', payload)
  return response.data
}

