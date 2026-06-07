<template>
  <div class="page">
    <div class="page-header">
      <a-form :model="queryForm" layout="inline">
        <a-form-item label="关键词">
          <a-input
            v-model:value="queryForm.keyword"
            placeholder="姓名/身份证/电话"
            style="width: 200px"
            allow-clear
            @pressEnter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="社区">
          <a-select
            v-model:value="queryForm.community"
            placeholder="全部社区"
            style="width: 150px"
            allow-clear
          >
            <a-select-option v-for="c in communities" :key="c" :value="c">
              {{ c }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="补贴类别">
          <a-select
            v-model:value="queryForm.subsidyCategory"
            placeholder="全部类别"
            style="width: 180px"
            allow-clear
          >
            <a-select-option value="low_income_full">低保户全额补贴</a-select-option>
            <a-select-option value="low_income">低收入补贴</a-select-option>
            <a-select-option value="normal">普通老人补贴</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">
            <SearchOutlined />
            搜索
          </a-button>
          <a-button style="margin-left: 8px" @click="handleReset">
            重置
          </a-button>
        </a-form-item>
        <a-form-item style="float: right">
          <a-button type="primary" @click="handleAdd">
            <PlusOutlined />
            新增老人
          </a-button>
        </a-form-item>
      </a-form>
    </div>

    <a-table
      :columns="columns"
      :data-source="dataSource"
      :pagination="pagination"
      :loading="loading"
      row-key="_id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'subsidyCategory'">
          <a-tag :color="getSubsidyTagColor(record.subsidyCategory)">
            {{ getSubsidyText(record.subsidyCategory) }}
          </a-tag>
          <a-tag v-if="record.age >= 80" color="purple">
            +高龄补贴
          </a-tag>
        </template>
        <template v-else-if="column.key === 'canteen'">
          {{ record.canteenId?.name || '-' }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="handleEdit(record)">
            编辑
          </a-button>
          <a-popconfirm title="确定删除该老人信息？" @confirm="handleDelete(record)">
            <a-button type="link" size="small" danger>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑老人信息' : '新增老人'"
      width="600px"
      @ok="handleSubmit"
      @cancel="modalVisible = false"
      :confirmLoading="submitLoading"
    >
      <a-form
        ref="formRef"
        :model="formData"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item
              label="姓名"
              name="name"
              :rules="[{ required: true, message: '请输入姓名' }]"
            >
              <a-input v-model:value="formData.name" placeholder="请输入姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item
              label="身份证号"
              name="idCard"
              :rules="[{ required: true, message: '请输入身份证号' }]"
            >
              <a-input v-model:value="formData.idCard" placeholder="请输入身份证号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item
              label="年龄"
              name="age"
              class="form-item-no-wrap"
              :rules="[{ required: true, message: '请输入年龄' }]"
            >
              <a-input-number
                v-model:value="formData.age"
                :min="0"
                :max="120"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item
              label="性别"
              name="gender"
              class="form-item-no-wrap"
              :rules="[{ required: true, message: '请选择性别' }]"
            >
              <a-select v-model:value="formData.gender" placeholder="请选择">
                <a-select-option value="male">男</a-select-option>
                <a-select-option value="female">女</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item
              label="联系电话"
              name="phone"
              class="form-item-no-wrap"
              :rules="[{ required: true, message: '请输入联系电话' }]"
            >
              <a-input v-model:value="formData.phone" placeholder="请输入联系电话" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item
              label="所属社区"
              name="community"
              :rules="[{ required: true, message: '请选择社区' }]"
            >
              <a-select v-model:value="formData.community" placeholder="请选择社区">
                <a-select-option v-for="c in communities" :key="c" :value="c">
                  {{ c }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item
              label="助餐点"
              name="canteenId"
              :rules="[{ required: true, message: '请选择助餐点' }]"
            >
              <a-select v-model:value="formData.canteenId" placeholder="请选择助餐点">
                <a-select-option v-for="c in canteenList" :key="c._id" :value="c._id">
                  {{ c.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item
          label="家庭住址"
          name="address"
          :rules="[{ required: true, message: '请输入家庭住址' }]"
        >
          <a-input v-model:value="formData.address" placeholder="请输入家庭住址" />
        </a-form-item>
        <a-form-item
          label="补贴类别"
          name="subsidyCategory"
          :rules="[{ required: true, message: '请选择补贴类别' }]"
        >
          <a-select v-model:value="formData.subsidyCategory" placeholder="请选择补贴类别">
            <a-select-option value="low_income_full">低保户全额补贴（每餐15元）</a-select-option>
            <a-select-option value="low_income">低收入补贴（每餐10元）</a-select-option>
            <a-select-option value="normal">普通老人补贴（每餐5元）</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons-vue'
import {
  getElderlyList,
  createElderly,
  updateElderly,
  deleteElderly,
  ElderlyItem,
} from '@/api/elderly'
import { getCanteenList, CanteenItem } from '@/api/canteens'

const loading = ref(false)
const dataSource = ref<ElderlyItem[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
})

const queryForm = reactive({
  keyword: '',
  community: undefined as string | undefined,
  subsidyCategory: undefined as string | undefined,
})

const communities = ['幸福社区', '阳光社区', '百合社区', '和平社区', '新华社区']

const canteenList = ref<CanteenItem[]>([])

const modalVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref()

const defaultFormData = {
  name: '',
  idCard: '',
  age: 70,
  gender: undefined as string | undefined,
  phone: '',
  community: undefined as string | undefined,
  canteenId: undefined as string | undefined,
  address: '',
  subsidyCategory: 'normal',
}

const formData = reactive({ ...defaultFormData })
const editingId = ref('')

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
  { title: '性别', dataIndex: 'gender', key: 'gender', width: 80,
    customRender: ({ record }: { record: ElderlyItem }) => record.gender === 'male' ? '男' : '女'
  },
  { title: '年龄', dataIndex: 'age', key: 'age', width: 80 },
  { title: '身份证号', dataIndex: 'idCard', key: 'idCard', width: 180 },
  { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 120 },
  { title: '所属社区', dataIndex: 'community', key: 'community', width: 120 },
  { title: '助餐点', key: 'canteen', width: 150 },
  { title: '补贴类别', key: 'subsidyCategory', width: 200 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
]

function getSubsidyText(category: string): string {
  const map: Record<string, string> = {
    low_income_full: '低保户全额补贴',
    low_income: '低收入补贴',
    normal: '普通补贴',
  }
  return map[category] || category
}

function getSubsidyTagColor(category: string): string {
  const map: Record<string, string> = {
    low_income_full: 'red',
    low_income: 'orange',
    normal: 'blue',
  }
  return map[category] || 'default'
}

async function loadData() {
  loading.value = true
  try {
    const res = await getElderlyList({
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: queryForm.keyword,
      community: queryForm.community,
      subsidyCategory: queryForm.subsidyCategory,
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

function handleSearch() {
  pagination.current = 1
  loadData()
}

function handleReset() {
  queryForm.keyword = ''
  queryForm.community = undefined
  queryForm.subsidyCategory = undefined
  pagination.current = 1
  loadData()
}

function handleTableChange(pag: any) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

function handleAdd() {
  isEdit.value = false
  editingId.value = ''
  Object.assign(formData, defaultFormData)
  modalVisible.value = true
}

function handleEdit(record: ElderlyItem) {
  isEdit.value = true
  editingId.value = record._id
  Object.assign(formData, {
    name: record.name,
    idCard: record.idCard,
    age: record.age,
    gender: record.gender,
    phone: record.phone,
    community: record.community,
    canteenId: record.canteenId?._id || record.canteenId,
    address: record.address,
    subsidyCategory: record.subsidyCategory,
  })
  modalVisible.value = true
}

async function handleSubmit() {
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateElderly(editingId.value, formData as any)
      message.success('更新成功')
    } else {
      await createElderly(formData as any)
      message.success('创建成功')
    }
    modalVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(record: ElderlyItem) {
  try {
    await deleteElderly(record._id)
    message.success('删除成功')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
  loadCanteens()
})
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-header {
  margin-bottom: 16px;
}

:deep(.form-item-no-wrap .ant-form-item-label > label) {
  white-space: nowrap;
}
</style>
