<template>
  <div class="reports-page">
    <a-card class="filter-card">
      <div class="filter-row">
        <a-radio-group v-model:value="reportType" @change="handleTypeChange" size="large">
          <a-radio-button value="daily">日报</a-radio-button>
          <a-radio-button value="monthly">月报</a-radio-button>
          <a-radio-button value="quarterly">季报</a-radio-button>
        </a-radio-group>

        <a-date-picker
          v-if="reportType === 'daily'"
          v-model:value="selectedDate"
          style="width: 200px"
          @change="handleDateChange"
        />
        <a-month-picker
          v-else-if="reportType === 'monthly'"
          v-model:value="selectedMonth"
          style="width: 200px"
          @change="handleDateChange"
          format="YYYY-MM"
        />
        <a-select
          v-else
          v-model:value="selectedQuarter"
          style="width: 200px"
          @change="handleDateChange"
        >
          <a-select-option v-for="q in quarterOptions" :key="q" :value="q">{{ q }}</a-select-option>
        </a-select>

        <a-space>
          <a-button type="primary" @click="handleGenerate">
            <template #icon><ReloadOutlined /></template>
            生成报表
          </a-button>
          <a-button @click="handleExportCSV">
            <template #icon><DownloadOutlined /></template>
            导出CSV
          </a-button>
          <a-button @click="handleExportHTML">
            <template #icon><PrinterOutlined /></template>
            打印预览
          </a-button>
        </a-space>
      </div>

      <div v-if="reportData?.compareData?.abnormalMetrics?.length" class="abnormal-warning">
        <WarningOutlined style="color: #faad14; margin-right: 8px" />
        <span>异常指标待核实：{{ reportData.compareData.abnormalMetrics.join('、') }}</span>
      </div>
    </a-card>

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="6" v-for="metric in coreMetrics" :key="metric.key">
        <a-card class="metric-card" :class="{ abnormal: isAbnormal(metric.key) }">
          <div class="metric-label">{{ metric.label }}</div>
          <div class="metric-value">
            <span v-if="metric.prefix">{{ metric.prefix }}</span>
            {{ formatValue(reportData?.[metric.key], metric.format) }}
            <span v-if="metric.suffix" class="metric-suffix">{{ metric.suffix }}</span>
          </div>
          <div class="metric-compare">
            <div class="compare-item">
              <span class="compare-label">环比</span>
              <span
                class="compare-value"
                :class="getCompareClass(reportData?.compareData?.mom?.[metric.key])"
              >
                {{ formatCompare(reportData?.compareData?.mom?.[metric.key]) }}
              </span>
            </div>
            <div class="compare-item">
              <span class="compare-label">同比</span>
              <span
                class="compare-value"
                :class="getCompareClass(reportData?.compareData?.yoy?.[metric.key])"
              >
                {{ formatCompare(reportData?.compareData?.yoy?.[metric.key]) }}
              </span>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="12">
        <a-card title="各餐段分布">
          <div ref="mealTypeChart" style="width: 100%; height: 300px"></div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="老人类别分布">
          <div ref="categoryChart" style="width: 100%; height: 300px"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row style="margin-top: 16px">
      <a-col :span="24">
        <a-card title="各助餐点运营数据">
          <a-table :columns="canteenColumns" :data-source="reportData?.canteenStats || []" :pagination="false" row-key="canteenId">
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'rank'">
                <span class="rank-badge" :class="getRankClass(index)">{{ index + 1 }}</span>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <a-row style="margin-top: 16px">
      <a-col :span="24">
        <a-card title="操作区">
          <a-space>
            <a-button type="primary" @click="handleConfirm" :disabled="!reportData || reportData.status !== 'draft'">
              <template #icon><CheckOutlined /></template>
              确认报表
            </a-button>
            <a-button danger @click="handleLock" :disabled="!reportData || reportData.status === 'locked'">
              <template #icon><LockOutlined /></template>
              锁定报表
            </a-button>
            <a-tag v-if="reportData" :color="getStatusColor(reportData.status)">
              {{ getStatusText(reportData.status) }}
            </a-tag>
          </a-space>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import {
  ReloadOutlined,
  DownloadOutlined,
  PrinterOutlined,
  WarningOutlined,
  CheckOutlined,
  LockOutlined,
} from '@ant-design/icons-vue'
import {
  getReport,
  generateReport,
  confirmReport,
  lockReport,
  exportReportCSV,
  exportReportHTML,
  ReportType,
  ReportData,
} from '@/api/reports'

const reportType = ref<ReportType>('daily')
const selectedDate = ref<dayjs.Dayjs>(dayjs())
const selectedMonth = ref<dayjs.Dayjs>(dayjs())
const selectedQuarter = ref<string>('')
const reportData = ref<ReportData | null>(null)
const loading = ref(false)

const mealTypeChart = ref<HTMLElement | null>(null)
const categoryChart = ref<HTMLElement | null>(null)
let mealTypeChartInstance: echarts.ECharts | null = null
let categoryChartInstance: echarts.ECharts | null = null

const quarterOptions = computed(() => {
  const options: string[] = []
  const now = dayjs()
  for (let y = now.year(); y >= now.year() - 2; y--) {
    for (let q = 4; q >= 1; q--) {
      options.push(`${y}-Q${q}`)
    }
  }
  return options
})

const coreMetrics = [
  { key: 'totalOrders', label: '总订单数', format: 'number' },
  { key: 'mealPersonTimes', label: '就餐人次', format: 'number' },
  { key: 'revenue', label: '营业额', format: 'money', prefix: '¥' },
  { key: 'subsidyAmount', label: '补贴发放额', format: 'money', prefix: '¥' },
  { key: 'selfPayAmount', label: '自费金额', format: 'money', prefix: '¥' },
  { key: 'newElderlyCount', label: '新增老人数', format: 'number' },
  { key: 'activeElderlyCount', label: '活跃老人数', format: 'number' },
  { key: 'subsidyCoverageRate', label: '补贴覆盖率', format: 'percent', suffix: '%' },
]

const canteenColumns = [
  { title: '排名', key: 'rank', width: 80 },
  { title: '助餐点名称', dataIndex: 'canteenName', key: 'canteenName' },
  { title: '就餐人次', dataIndex: 'mealCount', key: 'mealCount', sorter: (a: any, b: any) => a.mealCount - b.mealCount },
  { title: '营业额(元)', dataIndex: 'revenue', key: 'revenue', sorter: (a: any, b: any) => a.revenue - b.revenue },
  { title: '补贴发放额(元)', dataIndex: 'subsidyAmount', key: 'subsidyAmount' },
  { title: '自费金额(元)', dataIndex: 'selfPayAmount', key: 'selfPayAmount' },
]

function getCurrentPeriod(): string {
  if (reportType.value === 'daily') {
    return selectedDate.value.format('YYYY-MM-DD')
  } else if (reportType.value === 'monthly') {
    return selectedMonth.value.format('YYYY-MM')
  } else {
    return selectedQuarter.value
  }
}

async function loadReport() {
  try {
    loading.value = true
    const period = getCurrentPeriod()
    const data = await getReport(reportType.value, period)
    reportData.value = data
    await nextTick()
    initCharts()
  } catch (error) {
    console.error('加载报表失败', error)
  } finally {
    loading.value = false
  }
}

async function handleGenerate() {
  try {
    loading.value = true
    const period = getCurrentPeriod()
    const data = await generateReport(reportType.value, period)
    reportData.value = data
    message.success('报表生成成功')
    await nextTick()
    initCharts()
  } catch (error: any) {
    message.error(error.message || '生成报表失败')
  } finally {
    loading.value = false
  }
}

async function handleConfirm() {
  if (!reportData.value) return
  try {
    const data = await confirmReport(reportData.value._id)
    reportData.value = data
    message.success('报表已确认')
  } catch (error: any) {
    message.error(error.message || '确认失败')
  }
}

async function handleLock() {
  if (!reportData.value) return
  try {
    await lockReport(reportData.value._id)
    reportData.value.status = 'locked'
    message.success('报表已锁定')
  } catch (error: any) {
    message.error(error.message || '锁定失败')
  }
}

function handleExportCSV() {
  const period = getCurrentPeriod()
  exportReportCSV(reportType.value, period)
}

function handleExportHTML() {
  const period = getCurrentPeriod()
  exportReportHTML(reportType.value, period)
}

function handleTypeChange() {
  loadReport()
}

function handleDateChange() {
  loadReport()
}

function formatValue(value: any, format?: string): string {
  if (value === null || value === undefined || isNaN(value)) return '-'
  
  if (format === 'money') {
    return Number(value).toFixed(2)
  } else if (format === 'percent') {
    return (Number(value) * 100).toFixed(1)
  } else {
    return value.toString()
  }
}

function formatCompare(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toFixed(1)}%`
}

function getCompareClass(value: number | null | undefined): string {
  if (value === null || value === undefined) return ''
  if (Math.abs(value) > 30) return 'abnormal'
  return value > 0 ? 'up' : value < 0 ? 'down' : ''
}

function isAbnormal(key: string): boolean {
  const mom = reportData.value?.compareData?.mom?.[key]
  const yoy = reportData.value?.compareData?.yoy?.[key]
  return (mom !== null && mom !== undefined && Math.abs(mom) > 30) ||
         (yoy !== null && yoy !== undefined && Math.abs(yoy) > 30)
}

function getRankClass(index: number): string {
  if (index === 0) return 'gold'
  if (index === 1) return 'silver'
  if (index === 2) return 'bronze'
  return ''
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'draft': return 'default'
    case 'confirmed': return 'blue'
    case 'locked': return 'green'
    default: return 'default'
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'draft': return '草稿'
    case 'confirmed': return '已确认'
    case 'locked': return '已锁定'
    default: return status
  }
}

function initCharts() {
  initMealTypeChart()
  initCategoryChart()
}

function initMealTypeChart() {
  if (!mealTypeChart.value) return
  if (mealTypeChartInstance) mealTypeChartInstance.dispose()

  mealTypeChartInstance = echarts.init(mealTypeChart.value)

  const data = [
    { value: reportData.value?.mealTypeStats?.lunch || 0, name: '午餐', itemStyle: { color: '#fa8c16' } },
    { value: reportData.value?.mealTypeStats?.dinner || 0, name: '晚餐', itemStyle: { color: '#722ed1' } },
  ]

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}人次 ({d}%)' },
    legend: { orient: 'vertical', right: '10%', top: 'center' },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      data,
      label: { formatter: '{b}\n{d}%' },
    }],
  }

  mealTypeChartInstance.setOption(option)
}

function initCategoryChart() {
  if (!categoryChart.value) return
  if (categoryChartInstance) categoryChartInstance.dispose()

  categoryChartInstance = echarts.init(categoryChart.value)

  const categories = reportData.value?.subsidyCategoryStats || []
  const data = categories.map((cat, index) => ({
    value: cat.count,
    name: cat.categoryName,
  }))

  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: { orient: 'vertical', right: '10%', top: 'center' },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      data: data.map((d, i) => ({ ...d, itemStyle: { color: colors[i % colors.length] } })),
      label: { formatter: '{b}\n{d}%' },
    }],
  }

  categoryChartInstance.setOption(option)
}

function handleResize() {
  mealTypeChartInstance?.resize()
  categoryChartInstance?.resize()
}

onMounted(() => {
  if (quarterOptions.value.length > 0) {
    const now = dayjs()
    const q = Math.floor(now.month() / 3) + 1
    selectedQuarter.value = `${now.year()}-Q${q}`
  }
  loadReport()
  window.addEventListener('resize', handleResize)
})

watch(reportType, () => {
  nextTick(() => {
    initCharts()
  })
})
</script>

<style scoped>
.reports-page {
  padding: 24px;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.abnormal-warning {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 4px;
  color: #d48806;
  font-size: 13px;
}

.metric-card {
  text-align: center;
  transition: all 0.3s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-card.abnormal {
  border: 1px solid #ff7875;
  background: linear-gradient(135deg, #fff1f0 0%, #ffffff 100%);
}

.metric-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 28px;
  font-weight: 600;
  color: #1890ff;
  line-height: 1.2;
}

.metric-suffix {
  font-size: 16px;
  margin-left: 2px;
}

.metric-compare {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 10px;
  font-size: 12px;
}

.compare-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.compare-label {
  color: #999;
}

.compare-value {
  font-weight: 500;
}

.compare-value.up {
  color: #52c41a;
}

.compare-value.down {
  color: #ff4d4f;
}

.compare-value.abnormal {
  color: #ff4d4f;
  font-weight: 600;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f0f0f0;
  color: #666;
  font-size: 12px;
  font-weight: 600;
}

.rank-badge.gold {
  background: linear-gradient(135deg, #ffd666 0%, #faad14 100%);
  color: #fff;
}

.rank-badge.silver {
  background: linear-gradient(135deg, #e8e8e8 0%, #bfbfbf 100%);
  color: #fff;
}

.rank-badge.bronze {
  background: linear-gradient(135deg, #ffbb96 0%, #d46b08 100%);
  color: #fff;
}
</style>
