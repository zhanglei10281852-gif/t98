<template>
  <div class="submissions-page">
    <a-card class="filter-card">
      <div class="filter-row">
        <a-radio-group v-model:value="reportType" size="large">
          <a-radio-button value="daily">日报</a-radio-button>
          <a-radio-button value="monthly">月报</a-radio-button>
          <a-radio-button value="quarterly">季报</a-radio-button>
        </a-radio-group>

        <a-date-picker
          v-if="reportType === 'daily'"
          v-model:value="selectedDate"
          style="width: 200px"
        />
        <a-month-picker
          v-else-if="reportType === 'monthly'"
          v-model:value="selectedMonth"
          style="width: 200px"
          format="YYYY-MM"
        />
        <a-select
          v-else
          v-model:value="selectedQuarter"
          style="width: 200px"
        >
          <a-select-option v-for="q in quarterOptions" :key="q" :value="q">{{ q }}</a-select-option>
        </a-select>

        <a-button type="primary" @click="handleGenerate" :loading="generating">
          <template #icon><FileSearchOutlined /></template>
          生成上报表
        </a-button>
      </div>
    </a-card>

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="16">
        <a-card title="上报数据" :loading="loading">
          <template v-if="currentSubmission">
            <div class="submission-header">
              <div class="submission-no">
                上报编号：<strong>{{ currentSubmission.submissionNo }}</strong>
              </div>
              <a-tag :color="getStatusColor(currentSubmission.status)">
                {{ getStatusText(currentSubmission.status) }}
              </a-tag>
            </div>

            <a-table
              :columns="dataColumns"
              :data-source="formattedData"
              :pagination="false"
              size="small"
              style="margin-top: 16px"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'value'">
                  <span v-if="record.isMoney">¥{{ Number(record.value).toFixed(2) }}</span>
                  <span v-else-if="record.isPercent">{{ Number(record.value).toFixed(2) }}%</span>
                  <span v-else>{{ record.value }}</span>
                </template>
              </template>
            </a-table>

            <div class="action-bar" style="margin-top: 20px">
              <a-space>
                <a-button
                  type="primary"
                  @click="handleConfirm"
                  :disabled="currentSubmission.status !== 'draft' || currentSubmission.validationErrors.length > 0"
                >
                  <template #icon><CheckCircleOutlined /></template>
                  确认上报数据
                </a-button>
                <a-button
                  danger
                  @click="handleSubmit"
                  :disabled="currentSubmission.status !== 'confirmed'"
                >
                  <template #icon><UploadOutlined /></template>
                  正式上报
                </a-button>
              </a-space>
            </div>
          </template>

          <a-empty v-else description="请选择周期后生成上报表" />
        </a-card>
      </a-col>

      <a-col :span="8">
        <a-card title="数据校验结果">
          <template v-if="currentSubmission">
            <div v-if="currentSubmission.validationErrors.length === 0" class="validation-success">
              <CheckCircleOutlined style="color: #52c41a; font-size: 20px; margin-right: 8px" />
              <span>数据校验通过</span>
            </div>
            <div v-else class="validation-error">
              <div class="error-title">
                <ExclamationCircleOutlined style="color: #ff4d4f; margin-right: 8px" />
                <span>发现 {{ currentSubmission.validationErrors.length }} 个问题</span>
              </div>
              <ul class="error-list">
                <li v-for="(err, index) in currentSubmission.validationErrors" :key="index">
                  {{ err }}
                </li>
              </ul>
            </div>
          </template>
          <a-empty v-else description="暂无校验结果" />
        </a-card>

        <a-card title="助餐点明细" style="margin-top: 16px">
          <template v-if="currentSubmission?.data?.canteenDetails?.length">
            <a-table
              :columns="canteenColumns"
              :data-source="currentSubmission.data.canteenDetails"
              :pagination="false"
              size="small"
            />
          </template>
          <a-empty v-else description="暂无数据" />
        </a-card>
      </a-col>
    </a-row>

    <a-card title="上报历史" style="margin-top: 16px">
      <a-table
        :columns="historyColumns"
        :data-source="historyList"
        :loading="historyLoading"
        :pagination="{
          current: historyPage,
          pageSize: 10,
          total: historyTotal,
          onChange: handleHistoryPageChange,
        }"
        row-key="_id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-button type="link" size="small" @click="viewSubmission(record)">
              查看
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  FileSearchOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons-vue'
import {
  generateSubmission,
  confirmSubmission,
  submitSubmission,
  getSubmissionList,
  SubmissionRecord,
} from '@/api/submissions'

const reportType = ref<string>('monthly')
const selectedDate = ref<dayjs.Dayjs>(dayjs())
const selectedMonth = ref<dayjs.Dayjs>(dayjs())
const selectedQuarter = ref<string>('')
const currentSubmission = ref<SubmissionRecord | null>(null)
const loading = ref(false)
const generating = ref(false)

const historyList = ref<SubmissionRecord[]>([])
const historyLoading = ref(false)
const historyPage = ref(1)
const historyTotal = ref(0)

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

const dataColumns = [
  { title: '字段名称', dataIndex: 'label', key: 'label', width: '50%' },
  { title: '数值', dataIndex: 'value', key: 'value' },
]

const canteenColumns = [
  { title: '助餐点', dataIndex: 'canteenName', key: 'canteenName', ellipsis: true },
  { title: '就餐人次', dataIndex: 'mealCount', key: 'mealCount' },
]

const historyColumns = [
  { title: '上报编号', dataIndex: 'submissionNo', key: 'submissionNo' },
  { title: '报表类型', dataIndex: 'reportType', key: 'reportType' },
  { title: '统计周期', dataIndex: 'period', key: 'period' },
  { title: '状态', key: 'status' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'actions', width: 100 },
]

const formattedData = computed(() => {
  if (!currentSubmission.value?.data) return []
  
  const data = currentSubmission.value.data
  const fields = [
    { key: 'period', label: '统计周期', value: data.period },
    { key: 'reportType', label: '报表类型', value: data.reportType },
    { key: 'totalOrders', label: '总订单数', value: data.totalOrders },
    { key: 'mealPersonTimes', label: '就餐人次', value: data.mealPersonTimes },
    { key: 'revenue', label: '营业额(元)', value: data.revenue, isMoney: true },
    { key: 'subsidyAmount', label: '补贴发放额(元)', value: data.subsidyAmount, isMoney: true },
    { key: 'selfPayAmount', label: '自费金额(元)', value: data.selfPayAmount, isMoney: true },
    { key: 'newElderlyCount', label: '新增老人数', value: data.newElderlyCount },
    { key: 'activeElderlyCount', label: '活跃老人数', value: data.activeElderlyCount },
    { key: 'totalElderlyCount', label: '服务老人总数', value: data.totalElderlyCount },
    { key: 'subsidyCoverageRate', label: '补贴覆盖率', value: data.subsidyCoverageRate, isPercent: true },
    { key: 'lunchCount', label: '午餐人次', value: data.lunchCount },
    { key: 'dinnerCount', label: '晚餐人次', value: data.dinnerCount },
    { key: 'canteenCount', label: '助餐点数量', value: data.canteenCount },
  ]
  
  return fields
})

function getCurrentPeriod(): string {
  if (reportType.value === 'daily') {
    return selectedDate.value.format('YYYY-MM-DD')
  } else if (reportType.value === 'monthly') {
    return selectedMonth.value.format('YYYY-MM')
  } else {
    return selectedQuarter.value
  }
}

async function handleGenerate() {
  try {
    generating.value = true
    const period = getCurrentPeriod()
    const data = await generateSubmission(reportType.value, period)
    currentSubmission.value = data
    
    if (data.validationErrors.length > 0) {
      message.warning(`数据校验发现 ${data.validationErrors.length} 个问题，请检查`)
    } else {
      message.success('上报表生成成功')
    }
  } catch (error: any) {
    message.error(error.message || '生成失败')
  } finally {
    generating.value = false
  }
}

async function handleConfirm() {
  if (!currentSubmission.value) return
  try {
    const data = await confirmSubmission(currentSubmission.value._id)
    currentSubmission.value = data
    message.success('已确认上报数据')
    loadHistory()
  } catch (error: any) {
    message.error(error.message || '确认失败')
  }
}

async function handleSubmit() {
  if (!currentSubmission.value) return
  
  try {
    await message.confirm({
      title: '确认上报',
      content: '确认正式上报此数据吗？上报后无法修改。',
      okText: '确认上报',
      cancelText: '取消',
    })

    const data = await submitSubmission(currentSubmission.value._id)
    currentSubmission.value = data
    message.success('上报成功')
    loadHistory()
  } catch (error: any) {
    message.error(error.message || '上报失败')
  }
}

function viewSubmission(record: SubmissionRecord) {
  currentSubmission.value = record
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'draft': return 'default'
    case 'confirmed': return 'blue'
    case 'submitted': return 'green'
    default: return 'default'
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'draft': return '草稿'
    case 'confirmed': return '已确认'
    case 'submitted': return '已上报'
    default: return status
  }
}

async function loadHistory() {
  try {
    historyLoading.value = true
    const result = await getSubmissionList({
      reportType: reportType.value,
      page: historyPage.value,
      pageSize: 10,
    })
    historyList.value = result.list
    historyTotal.value = result.total
  } catch (error) {
    console.error('加载历史失败', error)
  } finally {
    historyLoading.value = false
  }
}

function handleHistoryPageChange(page: number) {
  historyPage.value = page
  loadHistory()
}

onMounted(() => {
  if (quarterOptions.value.length > 0) {
    const now = dayjs()
    const q = Math.floor(now.month() / 3) + 1
    selectedQuarter.value = `${now.year()}-Q${q}`
  }
  loadHistory()
})
</script>

<style scoped>
.submissions-page {
  padding: 24px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.submission-no {
  font-size: 14px;
  color: #666;
}

.validation-success {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
  color: #389e0d;
  font-size: 15px;
}

.validation-error .error-title {
  display: flex;
  align-items: center;
  color: #cf1322;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 12px;
}

.error-list {
  margin: 0;
  padding-left: 20px;
  color: #cf1322;
  font-size: 13px;
}

.error-list li {
  margin-bottom: 6px;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
