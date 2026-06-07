import request from '@/utils/request'

export interface CanteenOrderStat {
  _id: string
  canteenName: string
  count: number
}

export interface DailyTrendItem {
  date: string
  count: number
}

export interface DashboardStats {
  todayOrders: number
  totalElderly: number
  totalCanteens: number
  monthSubsidyTotal: number
  monthSubsidyCount: number
  monthQuota: {
    totalQuota: number
    usedAmount: number
    remainingAmount: number
  }
  canteenOrders: CanteenOrderStat[]
  dailyTrend: DailyTrendItem[]
}

export function getDashboardStats() {
  return request.get<any, DashboardStats>('/dashboard/stats')
}
