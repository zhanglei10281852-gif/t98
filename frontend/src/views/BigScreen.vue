<template>
  <div class="bigscreen">
    <div class="bigscreen-header">
      <div class="header-left">
        <span class="header-subtitle">街道助餐服务管理平台</span>
      </div>
      <div class="header-title">
        <span class="title-text">智慧助餐 · 数据大屏</span>
      </div>
      <div class="header-right">
        <div class="current-time">{{ currentTime }}</div>
        <a-button size="small" @click="handleBack" class="back-btn">
          <template #icon><ArrowLeftOutlined /></template>
          返回
        </a-button>
      </div>
    </div>

    <div class="bigscreen-body">
      <div class="panel-column left">
        <div class="panel">
          <div class="panel-title">
            <span class="title-icon"></span>
            各助餐点实时就餐量
          </div>
          <div ref="canteenChart" class="panel-content chart-container"></div>
        </div>

        <div class="panel">
          <div class="panel-title">
            <span class="title-icon"></span>
            老人类别分布
          </div>
          <div ref="categoryChart" class="panel-content chart-container"></div>
        </div>
      </div>

      <div class="panel-column center">
        <div class="core-metrics">
          <div class="metric-item" v-for="metric in coreMetrics" :key="metric.key">
            <div class="metric-value">
              <span class="number-scroll">{{ displayValues[metric.key] }}</span>
              <span class="metric-unit" v-if="metric.unit">{{ metric.unit }}</span>
            </div>
            <div class="metric-label">{{ metric.label }}</div>
          </div>
        </div>

        <div class="panel center-panel">
          <div class="panel-title">
            <span class="title-icon"></span>
            近30天就餐趋势
          </div>
          <div ref="trendChart" class="panel-content chart-container"></div>
        </div>
      </div>

      <div class="panel-column right">
        <div class="panel">
          <div class="panel-title">
            <span class="title-icon"></span>
            今日餐段分布
          </div>
          <div ref="mealTypeChart" class="panel-content chart-container"></div>
        </div>

        <div class="panel">
          <div class="panel-title">
            <span class="title-icon"></span>
            助餐点排行
          </div>
          <div class="panel-content ranking-content">
            <div
              class="ranking-item"
              v-for="(item, index) in (data?.canteenRealtime || []).slice(0, 5)"
              :key="item.canteenId"
            >
              <span class="rank" :class="getRankClass(index)">{{ index + 1 }}</span>
              <span class="name">{{ item.canteenName }}</span>
              <span class="count">{{ item.count }}<em>人次</em></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bigscreen-footer">
      <span>数据更新时间：{{ updateTime }}</span>
      <span class="update-tip" :class="{ blinking: !isAutoRefresh }">
        {{ isAutoRefresh ? '自动刷新中' : '刷新已暂停' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import { getBigScreenData, BigScreenData } from '@/api/bigscreen'

const router = useRouter()
const data = ref<BigScreenData | null>(null)
const currentTime = ref('')
const updateTime = ref('')
const isAutoRefresh = ref(true)

const canteenChart = ref<HTMLElement | null>(null)
const categoryChart = ref<HTMLElement | null>(null)
const trendChart = ref<HTMLElement | null>(null)
const mealTypeChart = ref<HTMLElement | null>(null)

let canteenChartInstance: echarts.ECharts | null = null
let categoryChartInstance: echarts.ECharts | null = null
let trendChartInstance: echarts.ECharts | null = null
let mealTypeChartInstance: echarts.ECharts | null = null

const coreMetrics = [
  { key: 'todayMeals', label: '今日就餐人次', unit: '人次' },
  { key: 'totalElderly', label: '累计服务老人', unit: '人' },
  { key: 'totalCanteens', label: '助餐点数量', unit: '个' },
  { key: 'monthSubsidyTotal', label: '本月补贴支出', unit: '元' },
]

const displayValues = reactive<Record<string, string>>({
  todayMeals: '0',
  totalElderly: '0',
  totalCanteens: '0',
  monthSubsidyTotal: '0.00',
})

let timeTimer: number | null = null
let dataTimer: number | null = null
let animationFrame: number | null = null

function updateCurrentTime() {
  currentTime.value = dayjs().format('YYYY年MM月DD日 HH:mm:ss')
}

function animateValue(key: string, target: number, duration = 1500) {
  const start = parseFloat(displayValues[key]) || 0
  const startTime = Date.now()
  const isFloat = key === 'monthSubsidyTotal'

  function animate() {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    const current = start + (target - start) * easeProgress

    displayValues[key] = isFloat ? current.toFixed(2) : Math.floor(current).toString()

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate)
    }
  }

  animate()
}

function updateDisplayValues() {
  if (!data.value) return
  
  animateValue('todayMeals', data.value.coreMetrics.todayMeals)
  animateValue('totalElderly', data.value.coreMetrics.totalElderly)
  animateValue('totalCanteens', data.value.coreMetrics.totalCanteens)
  animateValue('monthSubsidyTotal', data.value.coreMetrics.monthSubsidyTotal)
}

async function loadData() {
  try {
    const result = await getBigScreenData()
    data.value = result
    updateTime.value = dayjs(result.updateTime).format('YYYY-MM-DD HH:mm:ss')
    updateDisplayValues()
    await nextTick()
    initCharts()
  } catch (error) {
    console.error('加载大屏数据失败', error)
  }
}

function initCharts() {
  initCanteenChart()
  initCategoryChart()
  initTrendChart()
  initMealTypeChart()
}

function initCanteenChart() {
  if (!canteenChart.value) return
  if (canteenChartInstance) canteenChartInstance.dispose()

  canteenChartInstance = echarts.init(canteenChart.value, 'dark')

  const canteens = data.value?.canteenRealtime || []
  const names = canteens.map(c => c.canteenName)
  const values = canteens.map(c => c.count)
  const capacities = canteens.map(c => c.capacity)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 11,
        interval: 0,
        rotate: 15,
      },
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: 'rgba(255, 255, 255, 0.7)' },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
    },
    series: [
      {
        name: '就餐人次',
        type: 'bar',
        data: values,
        barWidth: '50%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#00d4ff' },
            { offset: 1, color: '#0066ff' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          color: '#00d4ff',
          fontSize: 12,
        },
      },
    ],
  }

  canteenChartInstance.setOption(option)
}

function initCategoryChart() {
  if (!categoryChart.value) return
  if (categoryChartInstance) categoryChartInstance.dispose()

  categoryChartInstance = echarts.init(categoryChart.value, 'dark')

  const categories = data.value?.elderlyCategoryStats || []
  const dataArr = categories.map(c => ({
    value: c.value,
    name: c.name,
  }))

  const colors = ['#00d4ff', '#00ff88', '#ffaa00', '#ff6b6b']

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}人 ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['35%', '50%'],
        data: dataArr.map((d, i) => ({ ...d, itemStyle: { color: colors[i % colors.length] } })),
        label: {
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: 11,
          formatter: '{b}\n{d}%',
        },
        labelLine: {
          lineStyle: { color: 'rgba(255, 255, 255, 0.3)' },
        },
      },
    ],
  }

  categoryChartInstance.setOption(option)
}

function initTrendChart() {
  if (!trendChart.value) return
  if (trendChartInstance) trendChartInstance.dispose()

  trendChartInstance = echarts.init(trendChart.value, 'dark')

  const trend = data.value?.dailyTrend || []
  const dates = trend.map(t => t.date)
  const counts = trend.map(t => t.count)
  const subsidies = trend.map(t => t.subsidy)

  const option = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['就餐人次', '补贴金额'],
      textStyle: { color: 'rgba(255, 255, 255, 0.8)' },
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 10,
        interval: 3,
      },
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
    },
    yAxis: [
      {
        type: 'value',
        name: '人次',
        axisLabel: { color: 'rgba(255, 255, 255, 0.7)' },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
        nameTextStyle: { color: 'rgba(255, 255, 255, 0.7)' },
      },
      {
        type: 'value',
        name: '补贴(元)',
        axisLabel: { color: 'rgba(255, 255, 255, 0.7)' },
        splitLine: { show: false },
        nameTextStyle: { color: 'rgba(255, 255, 255, 0.7)' },
      },
    ],
    series: [
      {
        name: '就餐人次',
        type: 'line',
        smooth: true,
        data: counts,
        lineStyle: { color: '#00d4ff', width: 2 },
        itemStyle: { color: '#00d4ff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 212, 255, 0.4)' },
            { offset: 1, color: 'rgba(0, 212, 255, 0.02)' },
          ]),
        },
      },
      {
        name: '补贴金额',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: subsidies,
        lineStyle: { color: '#ffaa00', width: 2 },
        itemStyle: { color: '#ffaa00' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 170, 0, 0.3)' },
            { offset: 1, color: 'rgba(255, 170, 0, 0.02)' },
          ]),
        },
      },
    ],
  }

  trendChartInstance.setOption(option)
}

function initMealTypeChart() {
  if (!mealTypeChart.value) return
  if (mealTypeChartInstance) mealTypeChartInstance.dispose()

  mealTypeChartInstance = echarts.init(mealTypeChart.value, 'dark')

  const stats = data.value?.mealTypeStats || { lunch: 0, dinner: 0 }
  const total = stats.lunch + stats.dinner

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}人次 ({d}%)',
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '50%'],
        data: [
          { value: stats.lunch, name: '午餐', itemStyle: { color: '#ff9500' } },
          { value: stats.dinner, name: '晚餐', itemStyle: { color: '#5856d6' } },
        ],
        label: {
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: 14,
          formatter: '{b}\n{c}人次\n{d}%',
        },
        labelLine: {
          lineStyle: { color: 'rgba(255, 255, 255, 0.3)' },
          length: 15,
          length2: 10,
        },
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: 'center',
        style: {
          text: `总 ${total}`,
          fill: 'rgba(255, 255, 255, 0.9)',
          fontSize: 18,
          fontWeight: 'bold',
          textAlign: 'center',
        },
      },
    ],
  }

  mealTypeChartInstance.setOption(option)
}

function handleResize() {
  canteenChartInstance?.resize()
  categoryChartInstance?.resize()
  trendChartInstance?.resize()
  mealTypeChartInstance?.resize()
}

function handleBack() {
  router.push('/')
}

function getRankClass(index: number): string {
  if (index === 0) return 'gold'
  if (index === 1) return 'silver'
  if (index === 2) return 'bronze'
  return ''
}

onMounted(() => {
  updateCurrentTime()
  loadData()

  timeTimer = window.setInterval(updateCurrentTime, 1000)
  dataTimer = window.setInterval(() => {
    if (isAutoRefresh.value) {
      loadData()
    }
  }, 30000)

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer)
  if (dataTimer) clearInterval(dataTimer)
  if (animationFrame) cancelAnimationFrame(animationFrame)
  window.removeEventListener('resize', handleResize)

  canteenChartInstance?.dispose()
  categoryChartInstance?.dispose()
  trendChartInstance?.dispose()
  mealTypeChartInstance?.dispose()
})
</script>

<style scoped>
.bigscreen {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0c1929 0%, #0a1628 50%, #0d2137 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bigscreen-header {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  background: linear-gradient(180deg, rgba(0, 102, 255, 0.2) 0%, transparent 100%);
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  position: relative;
}

.bigscreen-header::before,
.bigscreen-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  width: 200px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00d4ff, transparent);
}

.bigscreen-header::before {
  left: 10%;
}

.bigscreen-header::after {
  right: 10%;
}

.header-left,
.header-right {
  width: 300px;
}

.header-right {
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 15px;
}

.header-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.header-title {
  flex: 1;
  text-align: center;
}

.title-text {
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(90deg, #00d4ff, #00ff88, #00d4ff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine 3s linear infinite;
  letter-spacing: 4px;
}

@keyframes shine {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

.current-time {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  font-family: 'Courier New', monospace;
}

.back-btn {
  background: rgba(0, 212, 255, 0.2);
  border-color: rgba(0, 212, 255, 0.5);
  color: #00d4ff;
}

.back-btn:hover {
  background: rgba(0, 212, 255, 0.3);
  border-color: #00d4ff;
  color: #00d4ff;
}

.bigscreen-body {
  flex: 1;
  display: flex;
  padding: 15px;
  gap: 15px;
  overflow: hidden;
}

.panel-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-height: 0;
}

.panel-column.left,
.panel-column.right {
  width: 28%;
}

.panel-column.left .panel,
.panel-column.right .panel {
  flex: 1;
  min-height: 0;
}

.panel-column.center {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-height: 0;
}

.panel {
  background: linear-gradient(180deg, rgba(0, 102, 255, 0.08) 0%, rgba(0, 20, 40, 0.5) 100%);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.center-panel {
  flex: 1;
}

.panel-title {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  font-size: 15px;
  font-weight: 500;
  color: #00d4ff;
  background: rgba(0, 212, 255, 0.08);
  border-bottom: 1px solid rgba(0, 212, 255, 0.15);
}

.title-icon {
  width: 4px;
  height: 16px;
  background: linear-gradient(180deg, #00d4ff, #0066ff);
  border-radius: 2px;
  margin-right: 10px;
}

.panel-content {
  flex: 1;
  padding: 10px;
  min-height: 0;
}

.chart-container {
  width: 100%;
  height: 100%;
}

.core-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 0;
}

.metric-item {
  background: linear-gradient(180deg, rgba(0, 102, 255, 0.15) 0%, rgba(0, 20, 40, 0.6) 100%);
  border: 1px solid rgba(0, 212, 255, 0.25);
  border-radius: 8px;
  padding: 15px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.metric-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00d4ff, transparent);
}

.metric-value {
  font-size: 32px;
  font-weight: bold;
  color: #00d4ff;
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
  font-family: 'DIN Alternate', 'Courier New', monospace;
  line-height: 1.2;
}

.number-scroll {
  display: inline-block;
}

.metric-unit {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 4px;
  font-weight: normal;
}

.metric-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 6px;
}

.ranking-content {
  padding: 10px 15px;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.ranking-item:last-child {
  border-bottom: none;
}

.rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  margin-right: 12px;
}

.rank.gold {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #fff;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.rank.silver {
  background: linear-gradient(135deg, #e8e8e8, #c0c0c0);
  color: #333;
}

.rank.bronze {
  background: linear-gradient(135deg, #cd7f32, #8b4513);
  color: #fff;
}

.name {
  flex: 1;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.count {
  font-size: 16px;
  font-weight: bold;
  color: #00d4ff;
}

.count em {
  font-size: 11px;
  font-style: normal;
  color: rgba(255, 255, 255, 0.5);
  margin-left: 2px;
}

.bigscreen-footer {
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  border-top: 1px solid rgba(0, 212, 255, 0.1);
}

.update-tip {
  display: flex;
  align-items: center;
  gap: 5px;
}

.update-tip::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00ff88;
}

.update-tip.blinking::before {
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
