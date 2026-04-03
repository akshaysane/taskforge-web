import apiClient from './client'

interface RegisterInput {
  name: string
  email: string
  password: string
}

interface RegisterResponse {
  id: string
  email: string
  name: string
  role: string
}

interface LoginInput {
  email: string
  password: string
}

interface AuthUser {
  id: string
  name: string
  role: string
  familyId: string | null
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

export async function registerUser(input: RegisterInput): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>('/api/auth/register', input)
  return data
}

export async function loginUser(input: LoginInput): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/auth/login', input)
  return data
}

export async function refreshToken(token: string): Promise<RefreshResponse> {
  const { data } = await apiClient.post<RefreshResponse>('/api/auth/refresh', {
    refreshToken: token,
  })
  return data
}

export async function loginPin(input: {
  familyName: string
  name: string
  pin: string
}): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/auth/login/pin', input)
  return data
}

export async function logoutUser(token: string): Promise<void> {
  await apiClient.post('/api/auth/logout', { refreshToken: token })
}
