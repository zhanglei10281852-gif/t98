<template>
  <div class="page">
    <a-row :gutter="16">
      <a-col :span="8">
        <a-card>
          <a-statistic
            title="本月补贴总额度"
            :value="quota.totalQuota"
            prefix="¥"
            :value-style="{ color: '#1890ff' }"
          />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card>
          <a-statistic
            title="已使用补贴"
            :value="quota.usedAmount"
            prefix="¥"
            :value-style="{ color: '#fa8c16' }"
          />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card>
          <a-statistic
            title="剩余额度"
            :value="quota.remainingAmount"
            prefix="¥"
            :value-style="{ color: quota.remainingAmount > 0 ? '#52c41a' : '#ff4d4f' }"
          />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="16">
        <a-card title="月度补贴汇总">
          <template #extra>
            <div>
              <a-month-picker
                v-model:value="selectedMonth"
                format="YYYY年MM月"
                :allow-clear="false"
                style="margin-right: 12px"
                @change="handleMonthChange"
              />
              <a-button type="primary" @click="handleExport">
                <DownloadOutlined />
                导出CSV
              </a-button>
            </div>
          </template>

          <a-table
            :columns="columns"
            :data-source="dataSource"
            :pagination="pagination"
            :loading="loading"
            row-key="elderlyId"
            @change="handleTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'subsidyCategory'">
                <a-tag :color="getCategoryTagColor(record.subsidyCategory)">
                  {{ getCategoryText(record.subsidyCategory) }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'totalSubsidy'">
                <span style="color: #52c41a; font-weight: 500">
                  ¥{{ record.totalSubsidy.toFixed(2) }}
                </span>
              </template>
              <template v-else-if="column.key === 'totalSelfPay'">
                <span style="color: #fa8c16">
                  ¥{{ record.totalSelfPay.toFixed(2) }}
                </span>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="补贴类别占比">
          <div ref="pieChart" style="width: 100%; height: 350px"></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import { message } from 'ant-design-vue'
import { DownloadOutlined } from '@ant-design/icons-vue'
import dayjs, { Dayjs } from 'dayjs'
import {
  getMonthlySummary,
  getCategoryStats,
  exportSubsidyCsv,
  SubsidySummaryItem,
  CategoryStat,
} from '@/api/subsidy'

const loading = ref(false)
const dataSource = ref<SubsidySummaryItem[]>([])
const categoryStats = ref<CategoryStat[]>([])

const selectedMonth = ref<Dayjs>(dayjs())

const quota = reactive({
  totalQuota: 100000,
  usedAmount: 0,
  remainingAmount: 100000,
  status: 'active',
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 位老人`,
})

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
  { title: '身份证号', dataIndex: 'idCard', key: 'idCard', width: 160 },
  { title: '所属社区', dataIndex: 'community', key: 'community', width: 100 },
  { title: '补贴类别', key: 'subsidyCategory', width: 140 },
  { title: '用餐次数', dataIndex: 'mealCount', key: 'mealCount', width: 90, align: 'right' },
  { title: '补贴总额', key: 'totalSubsidy', width: 100, align: 'right' },
  { title: '自付总额', key: 'totalSelfPay', width: 100, align: 'right' },
]

const pieChart = ref<HTMLElement | null>(null)
let pieChartInstance: echarts.ECharts | null = null

function getCategoryText(category: string): string {
  const map: Record<string, string> = {
    low_income_full: '低保户全额',
    low_income: '低收入',
    normal: '普通老人',
    senior_extra: '高龄额外',
  }
  return map[category] || category
}

function getCategoryTagColor(category: string): string {
  const map: Record<string, string> = {
    low_income_full: 'red',
    low_income: 'orange',
    normal: 'blue',
    senior_extra: 'purple',
  }
  return map[category] || 'default'
}

async function loadData() {
  loading.value = true
  try {
    const monthStr = selectedMonth.value.format('YYYY-MM')
    
    const [summaryRes, statsRes] = await Promise.all([
      getMonthlySummary({
        month: monthStr,
        page: pagination.current,
        pageSize: pagination.pageSize,
      }),
      getCategoryStats({ month: monthStr }),
    ])
    
    dataSource.value = summaryRes.list
    pagination.total = summaryRes.total
    
    if (summaryRes.quota) {
      quota.totalQuota = summaryRes.quota.totalQuota
      quota.usedAmount = summaryRes.quota.usedAmount
      quota.remainingAmount = summaryRes.quota.remainingAmount
      quota.status = summaryRes.quota.status
    }
    
    categoryStats.value = statsRes
    
    await nextTick()
    initPieChart()
  } finally {
    loading.value = false
  }
}

function initPieChart() {
  if (!pieChart.value) return
  if (pieChartInstance) pieChartInstance.dispose()
  
  pieChartInstance = echarts.init(pieChart.value)
  
  const colors = ['#ff4d4f', '#fa8c16', '#1890ff', '#722ed1']
  
  const data = categoryStats.value.map((item, index) => ({
    value: item.totalSubsidy,
    name: getCategoryText(item.category),
    itemStyle: { color: colors[index % colors.length] },
  }))
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
    },
    series: [
      {
        name: '补贴类别',
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['60%', '50%'],
        data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        label: {
          formatter: '{b}\n{d}%',
        },
      },
    ],
  }
  
  pieChartInstance.setOption(option)
}

function handleMonthChange(date: Dayjs | null) {
  if (date) {
    selectedMonth.value = date
    pagination.current = 1
    loadData()
  }
}

function handleTableChange(pag: any) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

function handleExport() {
  const monthStr = selectedMonth.value.format('YYYY-MM')
  exportSubsidyCsv(monthStr)
  message.success('正在导出CSV...')
}

function handleResize() {
  pieChartInstance?.resize()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
.page {
  padding: 24px;
}
</style>
