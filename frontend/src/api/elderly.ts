import request from '@/utils/request'

export interface ElderlyItem {
  _id: string
  name: string
  idCard: string
  age: number
  gender: string
  community: string
  phone: string
  address: string
  subsidyCategory: string
  canteenId: any
  hasSeniorSubsidy: boolean
  status: string
  createdAt: string
}

export interface ElderlyQueryParams {
  page?: number
  pageSize?: number
  keyword?: string
  community?: string
  subsidyCategory?: string
}

export interface ElderlyListResponse {
  total: number
  list: ElderlyItem[]
  page: number
  pageSize: number
}

export function getElderlyList(params: ElderlyQueryParams) {
  return request.get<any, ElderlyListResponse>('/elderly', { params })
}

export function getElderlyDetail(id: string) {
  return request.get<any, ElderlyItem>(`/elderly/${id}`)
}

export function createElderly(data: Partial<ElderlyItem>) {
  return request.post<any, ElderlyItem>('/elderly', data)
}

export function updateElderly(id: string, data: Partial<ElderlyItem>) {
  return request.put<any, ElderlyItem>(`/elderly/${id}`, data)
}

export function deleteElderly(id: string) {
  return request.delete<any, { message: string }>(`/elderly/${id}`)
}
