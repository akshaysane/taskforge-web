import axios from 'axios'
import apiClient from './client'
import type { AdminUser } from '../store/auth'

export interface LoginInput {
  username: string
  password: string
}

export interface AuthSession {
  accessToken: string
  user: AdminUser
}

const sessionClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

export async function loginUser(input: LoginInput): Promise<AuthSession> {
  const { data } = await apiClient.post<AuthSession>('/api/auth/login', input)
  return data
}

export async function refreshSession(): Promise<AuthSession> {
  const { data } = await sessionClient.post<AuthSession>('/api/auth/refresh')
  return data
}

export async function logoutUser(): Promise<void> {
  await sessionClient.post('/api/auth/logout')
}
