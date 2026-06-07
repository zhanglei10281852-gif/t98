import request from '@/utils/request'

export interface CanteenItem {
  _id: string
  name: string
  address: string
  phone: string
  dailyCapacity: number
  businessHours: {
    lunch: string
    dinner: string
  }
  status: string
}

export function getCanteenList() {
  return request.get<any, CanteenItem[]>('/canteens')
}

export function getCanteenDetail(id: string) {
  return request.get<any, CanteenItem>(`/canteens/${id}`)
}

export function createCanteen(data: Partial<CanteenItem>) {
  return request.post<any, CanteenItem>('/canteens', data)
}

export function updateCanteen(id: string, data: Partial<CanteenItem>) {
  return request.put<any, CanteenItem>(`/canteens/${id}`, data)
}

export function deleteCanteen(id: string) {
  return request.delete<any, { message: string }>(`/canteens/${id}`)
}
