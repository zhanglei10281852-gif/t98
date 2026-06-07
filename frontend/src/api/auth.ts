import request from '@/utils/request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    username: string
    name: string
    role: string
    canteenId?: string
  }
}

export function login(params: LoginParams) {
  return request.post<any, LoginResponse>('/auth/login', params)
}

export function getProfile() {
  return request.get<any, any>('/auth/profile')
}
