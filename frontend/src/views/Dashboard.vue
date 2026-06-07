<template>
  <div class="dashboard">
    <a-row :gutter="16">
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-number">{{ stats.todayOrders }}</div>
          <div class="stat-label">今日订餐量</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-number" style="color: #52c41a">{{ stats.totalElderly }}</div>
          <div class="stat-label">在册老人数</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-number" style="color: #fa8c16">{{ stats.totalCanteens }}</div>
          <div class="stat-label">助餐点数量</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-number" style="color: #eb2f96">
            ¥{{ stats.monthSubsidyTotal?.toFixed(0) }}
          </div>
          <div class="stat-label">本月补贴总额</div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="12">
        <a-card title="各助餐点今日订单量">
          <div ref="canteenChart" class="chart-container"></div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="本月补贴使用进度">
          <div ref="quotaChart" class="chart-container"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row style="margin-top: 16px">
      <a-col :span="24">
        <a-card title="近30天日均用餐人次趋势">
          <div ref="trendChart" style="width: 100%; height: 350px"></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getDashboardStats, DashboardStats } from '@/api/dashboard'

const stats = ref<DashboardStats>({
  todayOrders: 0,
  totalElderly: 0,
  totalCanteens: 0,
  monthSubsidyTotal: 0,
  monthSubsidyCount: 0,
  monthQuota: {
    totalQuota: 0,
    usedAmount: 0,
    remainingAmount: 0,
  },
  canteenOrders: [],
  dailyTrend: [],
})

const canteenChart = ref<HTMLElement | null>(null)
const quotaChart = ref<HTMLElement | null>(null)
const trendChart = ref<HTMLElement | null>(null)

let canteenChartInstance: echarts.ECharts | null = null
let quotaChartInstance: echarts.ECharts | null = null
let trendChartInstance: echarts.ECharts | null = null

async function loadData() {
  try {
    const data = await getDashboardStats()
    stats.value = data
    await nextTick()
    initCharts()
  } catch (error) {
      console.error('Failed to load dashboard stats')
    }
}

function initCharts() {
  initCanteenChart()
  initQuotaChart()
  initTrendChart()
}

function initCanteenChart() {
  if (!canteenChart.value) return
  if (canteenChartInstance) canteenChartInstance.dispose()
  
  canteenChartInstance = echarts.init(canteenChart.value)
  
  const names = stats.value.canteenOrders.map(i => i.canteenName)
  const values = stats.value.canteenOrders.map(i => i.count)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        interval: 0,
        rotate: 0,
      },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
    },
    series: [
      {
        name: '订单量',
        type: 'bar',
        data: values,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#1890ff' },
            { offset: 1, color: '#69c0ff' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '40%',
      },
    ],
  }
  
  canteenChartInstance.setOption(option)
}

function initQuotaChart() {
  if (!quotaChart.value) return
  if (quotaChartInstance) quotaChartInstance.dispose()
  
  quotaChartInstance = echarts.init(quotaChart.value)
  
  const used = stats.value.monthQuota?.usedAmount || 0
  const remaining = stats.value.monthQuota?.remainingAmount || 0
  const total = stats.value.monthQuota?.totalQuota || 100000
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
    },
    series: [
      {
        name: '补贴额度',
        type: 'pie',
        radius: ['50%', '70%'],
        center: ['35%', '50%'],
        data: [
          { value: used, name: '已使用', itemStyle: { color: '#ff4d4f' } },
          { value: remaining, name: '剩余额度', itemStyle: { color: '#52c41a' } },
        ],
        label: {
          formatter: '¥{b}\n{d}%',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  }
  
  quotaChartInstance.setOption(option)
}

function initTrendChart() {
  if (!trendChart.value) return
  if (trendChartInstance) trendChartInstance.dispose()
  
  trendChartInstance = echarts.init(trendChart.value)
  
  const dates = stats.value.dailyTrend.map(i => i.date.slice(5))
  const values = stats.value.dailyTrend.map(i => i.count)
  
  const option = {
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        interval: 3,
      },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
    },
    series: [
      {
        name: '用餐人次',
        type: 'line',
        smooth: true,
        data: values,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
          ]),
        },
        lineStyle: {
          color: '#1890ff',
          width: 2,
        },
        itemStyle: {
          color: '#1890ff',
        },
      },
    ],
  }
  
  trendChartInstance.setOption(option)
}

function handleResize() {
  canteenChartInstance?.resize()
  quotaChartInstance?.resize()
  trendChartInstance?.resize()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
.dashboard {
  padding: 24px;
}

.stat-card {
  text-align: center;
  padding: 20px 0;
}

.stat-number {
  font-size: 32px;
  font-weight: 600;
  color: #1890ff;
  line-height: 1.2;
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin-top: 8px;
}

.chart-container {
  width: 100%;
  height: 300px;
}
</style>
