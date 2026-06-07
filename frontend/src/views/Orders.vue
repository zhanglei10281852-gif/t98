<template>
  <div class="page">
    <div class="page-header">
      <a-form :model="queryForm" layout="inline">
        <a-form-item label="状态筛选">
          <a-select
            v-model:value="queryForm.status"
            placeholder="全部状态"
            style="width: 140px"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option value="ordered">已下单</a-select-option>
            <a-select-option value="confirmed">已确认</a-select-option>
            <a-select-option value="preparing">制作中</a-select-option>
            <a-select-option value="ready">待取/待送</a-select-option>
            <a-select-option value="completed">已完成</a-select-option>
            <a-select-option value="cancelled">已取消</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="助餐点">
          <a-select
            v-model:value="queryForm.canteenId"
            placeholder="全部助餐点"
            style="width: 180px"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option v-for="c in canteenList" :key="c._id" :value="c._id">
              {{ c.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="日期">
          <a-range-picker
            v-model:value="dateRange"
            style="width: 260px"
            @change="handleDateChange"
          />
        </a-form-item>
        <a-form-item>
          <a-button @click="handleReset">重置</a-button>
        </a-form-item>
        <a-form-item style="float: right">
          <a-button type="primary" @click="handleAdd" v-if="canCreateOrder">
            <PlusOutlined />
            新建订单
          </a-button>
        </a-form-item>
      </a-form>
    </div>

    <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
      <a-tab-pane key="all" tab="全部订单" />
      <a-tab-pane key="ordered" tab="已下单" />
      <a-tab-pane key="confirmed" tab="已确认" />
      <a-tab-pane key="preparing" tab="制作中" />
      <a-tab-pane key="ready" tab="待取/待送" />
      <a-tab-pane key="completed" tab="已完成" />
    </a-tabs>

    <a-table
      :columns="columns"
      :data-source="dataSource"
      :pagination="pagination"
      :loading="loading"
      row-key="_id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'elderly'">
          <div>
            <div>{{ record.elderlyId?.name || '-' }}</div>
            <div style="color: #999; font-size: 12px">
              {{ record.elderlyId?.age }}岁 · {{ getSubsidyText(record.elderlyId?.subsidyCategory) }}
            </div>
          </div>
        </template>
        <template v-else-if="column.key === 'canteen'">
          {{ record.canteenId?.name || '-' }}
        </template>
        <template v-else-if="column.key === 'mealInfo'">
          <div>
            <div>
              {{ record.mealType === 'lunch' ? '午餐' : '晚餐' }}
              · {{ record.mealStandard }}餐
              · ¥{{ record.mealPrice }}
            </div>
            <div style="color: #999; font-size: 12px">
              {{ formatDate(record.mealDate) }}
            </div>
          </div>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'subsidy'">
          <div>
            <div style="color: #52c41a">补贴: ¥{{ record.subsidyAmount }}</div>
            <div style="color: #fa8c16; font-size: 12px">自付: ¥{{ record.selfPayAmount }}</div>
          </div>
        </template>
        <template v-else-if="column.key === 'deliveryType'">
          <div>
            {{ record.deliveryType === 'pickup' ? '到店取餐' : '送餐到家' }}
            <template v-if="record.deliveryType === 'delivery' && record.deliveryInfo">
              <div style="color: #999; font-size: 12px">
              {{ record.deliveryInfo.volunteerName }}
              · {{ record.deliveryInfo.estimatedTime }}
            </div>
            </template>
          </div>
        </template>
        <template v-else-if="column.key === 'action'">
          <template v-if="record.status !== 'cancelled' && record.status !== 'completed'">
            <a-dropdown v-if="canManageOrder(record)">
              <a-button type="link" size="small">
              状态操作
              <DownOutlined />
            </a-button>
              <template #overlay>
                <a-menu @click="({ key }: { key: string }) => handleStatusChange(record, key)">
                  <a-menu-item v-if="record.status === 'ordered'" key="confirmed">确认接单</a-menu-item>
                  <a-menu-item v-if="record.status === 'confirmed'" key="preparing">开始制作</a-menu-item>
                  <a-menu-item v-if="record.status === 'preparing'" key="ready">制作完成</a-menu-item>
                  <a-menu-item v-if="record.status === 'ready'" key="completed">完成配送/取餐</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
            <a-button
              v-if="record.deliveryType === 'delivery' && record.status !== 'completed'"
              type="link"
              size="small"
              @click="handleSetDelivery(record)"
            >
              设置配送
            </a-button>
          </template>
          <a-popconfirm
            v-if="record.status === 'ordered' && canCancelOrder"
            title="确定取消该订单？"
            @confirm="handleCancel(record)"
          >
            <a-button type="link" size="small" danger>取消订单</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="orderModalVisible"
      title="新建订单"
      width="500px"
      @ok="handleSubmitOrder"
      @cancel="orderModalVisible = false"
      :confirm-loading="submitLoading"
    >
      <a-form :model="orderForm" layout="vertical">
        <a-form-item
          label="选择老人"
          :rules="[{ required: true, message: '请选择老人' }]"
        >
          <a-select
            v-model:value="orderForm.elderlyId"
            placeholder="请选择老人"
            show-search
            :filter-option="filterOption"
          >
            <a-select-option
              v-for="e in elderlyList"
              :key="e._id"
              :value="e._id"
            >
              {{ e.name }} ({{ e.age }}岁, {{ e.community }})
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="助餐点"
          :rules="[{ required: true, message: '请选择助餐点' }]"
        >
          <a-select v-model:value="orderForm.canteenId" placeholder="请选择助餐点">
            <a-select-option v-for="c in canteenList" :key="c._id" :value="c._id">
              {{ c.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item
              label="用餐日期"
              :rules="[{ required: true, message: '请选择日期' }]"
            >
              <a-date-picker
                v-model:value="orderForm.mealDate"
                style="width: 100%"
                :disabled-date="disabledDate"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item
              label="餐次"
              :rules="[{ required: true, message: '请选择餐次' }]"
            >
              <a-select v-model:value="orderForm.mealType" placeholder="请选择">
                <a-select-option value="lunch">午餐</a-select-option>
                <a-select-option value="dinner">晚餐</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item
          label="餐标"
          :rules="[{ required: true, message: '请选择餐标' }]"
        >
          <a-radio-group v-model:value="orderForm.mealStandard">
            <a-radio value="A">A餐 - ¥12</a-radio>
            <a-radio value="B">B餐 - ¥15</a-radio>
            <a-radio value="C">C餐 - ¥18</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="取餐方式">
          <a-radio-group v-model:value="orderForm.deliveryType">
            <a-radio value="pickup">到店取餐</a-radio>
            <a-radio value="delivery">送餐到家</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea
            v-model:value="orderForm.remark"
            placeholder="忌口、特殊需求等"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="deliveryModalVisible"
      title="设置配送信息"
      width="400px"
      @ok="handleSubmitDelivery"
      @cancel="deliveryModalVisible = false"
      :confirm-loading="deliveryLoading"
    >
      <a-form :model="deliveryForm" layout="vertical">
        <a-form-item label="志愿者姓名">
          <a-input v-model:value="deliveryForm.volunteerName" placeholder="请输入志愿者姓名" />
        </a-form-item>
        <a-form-item label="预计送达时间">
          <a-time-picker
            v-model:value="deliveryForm.estimatedTime"
            style="width: 100%"
            format="HH:mm"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, ref as vueRef } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import {
  PlusOutlined,
  DownOutlined,
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import {
  getOrderList,
  createOrder,
  updateOrderStatus,
  setDeliveryInfo,
  cancelOrder,
  OrderItem,
  OrderStatus,
  MealType,
  MealStandard,
  DeliveryType,
} from '@/api/orders'
import { getElderlyList, ElderlyItem } from '@/api/elderly'
import { getCanteenList, CanteenItem } from '@/api/canteens'

const userStore = useUserStore()

const loading = ref(false)
const dataSource = ref<OrderItem[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
})

const activeTab = ref('all')
const dateRange = ref<[Dayjs | null, Dayjs | null]>([null, null])

const queryForm = reactive({
  status: undefined as string | undefined,
  canteenId: undefined as string | undefined,
  startDate: undefined as string | undefined,
  endDate: undefined as string | undefined,
  mealType: undefined as string | undefined,
})

const canteenList = ref<CanteenItem[]>([])
const elderlyList = ref<ElderlyItem[]>([])

const canCreateOrder = computed(() => {
  return userStore.userInfo?.role === 'admin' || userStore.userInfo?.role === 'worker'
})

const canCancelOrder = computed(() => {
  return userStore.userInfo?.role === 'admin' || userStore.userInfo?.role === 'worker'
})

function canManageOrder(record: OrderItem): boolean {
  const role = userStore.userInfo?.role
  if (role === 'admin') return true
  if (role === 'canteen') return true
  return false
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    ordered: '已下单',
    confirmed: '已确认',
    preparing: '制作中',
    ready: '待取/待送',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ordered: 'blue',
    confirmed: 'cyan',
    preparing: 'orange',
    ready: 'gold',
    completed: 'green',
    cancelled: 'default',
  }
  return map[status] || 'default'
}

function getSubsidyText(category?: string): string {
  const map: Record<string, string> = {
    low_income_full: '全额补贴',
    low_income: '低收入',
    normal: '普通补贴',
  }
  return map[category || ''] || ''
}

function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD')
}

const columns = [
  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 160 },
  { title: '老人信息', key: 'elderly', width: 180 },
  { title: '助餐点', key: 'canteen', width: 160 },
  { title: '餐食信息', key: 'mealInfo', width: 200 },
  { title: '配送方式', key: 'deliveryType', width: 160 },
  { title: '补贴/自付', key: 'subsidy', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' },
]

async function loadData() {
  loading.value = true
  try {
    const status = activeTab.value === 'all' ? undefined : activeTab.value
    const res = await getOrderList({
      page: pagination.current,
      pageSize: pagination.pageSize,
      status,
      canteenId: queryForm.canteenId,
      startDate: queryForm.startDate,
      endDate: queryForm.endDate,
      mealType: queryForm.mealType,
    })
    dataSource.value = res.list
    pagination.total = res.total
  } finally {
    loading.value = false
  }
}

async function loadCanteens() {
  try {
    const res = await getCanteenList()
    canteenList.value = res
  } catch (e) {
    console.error(e)
  }
}

async function loadElderly() {
  try {
    const res = await getElderlyList({ page: 1, pageSize: 100 })
    elderlyList.value = res.list
  } catch (e) {
    console.error(e)
  }
}

function handleTabChange(key: string) {
  activeTab.value = key
  pagination.current = 1
  loadData()
}

function handleDateChange(dates: [Dayjs | null, Dayjs | null] | null) {
  if (dates && dates[0] && dates[1]) {
    queryForm.startDate = dates[0].format('YYYY-MM-DD')
    queryForm.endDate = dates[1].format('YYYY-MM-DD')
  } else {
    queryForm.startDate = undefined
    queryForm.endDate = undefined
  }
  pagination.current = 1
  loadData()
}

function handleSearch() {
  pagination.current = 1
  loadData()
}

function handleReset() {
  queryForm.status = undefined
  queryForm.canteenId = undefined
  queryForm.startDate = undefined
  queryForm.endDate = undefined
  queryForm.mealType = undefined
  dateRange.value = [null, null]
  activeTab.value = 'all'
  pagination.current = 1
  loadData()
}

function handleTableChange(pag: any) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

const orderModalVisible = ref(false)
const submitLoading = ref(false)

const defaultOrderForm = {
  elderlyId: '',
  canteenId: '',
  mealDate: null as Dayjs | null,
  mealType: 'lunch' as MealType,
  mealStandard: 'B' as MealStandard,
  deliveryType: 'pickup' as DeliveryType,
  remark: '',
}

const orderForm = reactive({ ...defaultOrderForm })

function handleAdd() {
  Object.assign(orderForm, defaultOrderForm)
  orderModalVisible.value = true
}

function disabledDate(current: Dayjs) {
  return current && current < dayjs().endOf('day')
}

function filterOption(input: string, option: any) {
  return option.children && option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

async function handleSubmitOrder() {
  if (!orderForm.elderlyId || !orderForm.canteenId || !orderForm.mealDate || !orderForm.mealType || !orderForm.mealStandard) {
    message.warning('请填写完整订单信息')
    return
  }
  
  submitLoading.value = true
  try {
    await createOrder({
      elderlyId: orderForm.elderlyId,
      canteenId: orderForm.canteenId,
      mealDate: orderForm.mealDate.format('YYYY-MM-DD'),
      mealType: orderForm.mealType,
      mealStandard: orderForm.mealStandard,
      remark: orderForm.remark,
      deliveryType: orderForm.deliveryType,
    })
    message.success('订单创建成功')
    orderModalVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

async function handleStatusChange(record: OrderItem, status: string) {
  try {
    await updateOrderStatus(record._id, status as OrderStatus)
    message.success('状态更新成功')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

const deliveryModalVisible = ref(false)
const deliveryLoading = ref(false)
const deliveryForm = reactive({
  volunteerName: '',
  estimatedTime: '' as any,
})
const deliveryOrderId = ref('')

function handleSetDelivery(record: OrderItem) {
  deliveryOrderId.value = record._id
  deliveryForm.volunteerName = record.deliveryInfo?.volunteerName || ''
  deliveryForm.estimatedTime = record.deliveryInfo?.estimatedTime
    ? dayjs(record.deliveryInfo.estimatedTime, 'HH:mm')
    : null
  deliveryModalVisible.value = true
}

async function handleSubmitDelivery() {
  if (!deliveryForm.volunteerName || !deliveryForm.estimatedTime) {
    message.warning('请填写完整配送信息')
    return
  }
  
  deliveryLoading.value = true
  try {
    await setDeliveryInfo(deliveryOrderId.value, {
      volunteerName: deliveryForm.volunteerName,
      estimatedTime: dayjs(deliveryForm.estimatedTime).format('HH:mm'),
    })
    message.success('配送信息设置成功')
    deliveryModalVisible.value = false
    loadData()
  } finally {
    deliveryLoading.value = false
  }
}

async function handleCancel(record: OrderItem) {
  try {
    await cancelOrder(record._id)
    message.success('订单已取消')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
  loadCanteens()
  if (canCreateOrder.value) {
    loadElderly()
  }
})
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-header {
  margin-bottom: 16px;
}
</style>
