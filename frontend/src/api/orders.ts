import request from '@/utils/request'

export type OrderStatus = 'ordered' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
export type MealType = 'lunch' | 'dinner'
export type MealStandard = 'A' | 'B' | 'C'
export type DeliveryType = 'pickup' | 'delivery'

export interface OrderItem {
  _id: string
  orderNo: string
  elderlyId: any
  canteenId: any
  mealDate: string
  mealType: MealType
  mealStandard: MealStandard
  mealPrice: number
  remark: string
  status: OrderStatus
  deliveryType: DeliveryType
  deliveryInfo?: {
    volunteerName: string
    estimatedTime: string
  }
  subsidyAmount: number
  selfPayAmount: number
  createdBy: string
  confirmedAt?: string
  completedAt?: string
  createdAt: string
}

export interface OrderQueryParams {
  page?: number
  pageSize?: number
  status?: string
  canteenId?: string
  startDate?: string
  endDate?: string
  mealType?: string
}

export interface OrderListResponse {
  total: number
  list: OrderItem[]
  page: number
  pageSize: number
}

export interface CreateOrderParams {
  elderlyId: string
  canteenId: string
  mealDate: string
  mealType: MealType
  mealStandard: MealStandard
  remark?: string
  deliveryType: DeliveryType
}

export function getOrderList(params: OrderQueryParams) {
  return request.get<any, OrderListResponse>('/orders', { params })
}

export function getOrderDetail(id: string) {
  return request.get<any, OrderItem>(`/orders/${id}`)
}

export function createOrder(data: CreateOrderParams) {
  return request.post<any, OrderItem>('/orders', data)
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  return request.patch<any, OrderItem>(`/orders/${id}/status`, { status })
}

export function setDeliveryInfo(id: string, data: { volunteerName: string; estimatedTime: string }) {
  return request.patch<any, OrderItem>(`/orders/${id}/delivery`, data)
}

export function cancelOrder(id: string) {
  return request.delete<any, { message: string }>(`/orders/${id}`)
}
