<template>
  <div class="page">
    <div class="page-header">
      <a-button type="primary" @click="handleAdd">
        <PlusOutlined />
        新增助餐点
      </a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="dataSource"
      :pagination="false"
      :loading="loading"
      row-key="_id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : 'default'">
            {{ record.status === 'active' ? '运营中' : '已停用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'capacity'">
          {{ record.dailyCapacity }} 份/天
        </template>
        <template v-else-if="column.key === 'hours'">
          <div>午餐: {{ record.businessHours.lunch }}</div>
          <div>晚餐: {{ record.businessHours.dinner }}</div>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="handleEdit(record)">
            编辑
          </a-button>
          <a-popconfirm title="确定删除该助餐点？" @confirm="handleDelete(record)">
            <a-button type="link" size="small" danger>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑助餐点' : '新增助餐点'"
      width="560px"
      @ok="handleSubmit"
      @cancel="modalVisible = false"
      :confirmLoading="submitLoading"
    >
      <a-form :model="formData" layout="vertical">
        <a-form-item label="助餐点名称" :rules="[{ required: true, message: '请输入名称' }]">
          <a-input v-model:value="formData.name" placeholder="请输入助餐点名称" />
        </a-form-item>
        <a-form-item label="地址" :rules="[{ required: true, message: '请输入地址' }]">
          <a-input v-model:value="formData.address" placeholder="请输入详细地址" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="联系电话" :rules="[{ required: true, message: '请输入电话' }]">
              <a-input v-model:value="formData.phone" placeholder="请输入联系电话" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="日供餐能力" :rules="[{ required: true, message: '请输入供餐能力' }]">
              <a-input-number
                v-model:value="formData.dailyCapacity"
                :min="1"
                style="width: 100%"
                addon-after="份/天"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="午餐时间" :rules="[{ required: true, message: '请输入午餐时间' }]">
              <a-input v-model:value="formData.businessHours.lunch" placeholder="如: 11:30-12:30" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="晚餐时间" :rules="[{ required: true, message: '请输入晚餐时间' }]">
              <a-input v-model:value="formData.businessHours.dinner" placeholder="如: 17:30-18:30" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="状态">
          <a-radio-group v-model:value="formData.status">
            <a-radio value="active">运营中</a-radio>
            <a-radio value="inactive">已停用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import {
  getCanteenList,
  createCanteen,
  updateCanteen,
  deleteCanteen,
  CanteenItem,
} from '@/api/canteens'

const loading = ref(false)
const dataSource = ref<CanteenItem[]>([])

const columns = [
  { title: '助餐点名称', dataIndex: 'name', key: 'name', width: 200 },
  { title: '地址', dataIndex: 'address', key: 'address' },
  { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 140 },
  { title: '日供餐能力', key: 'capacity', width: 120 },
  { title: '营业时间', key: 'hours', width: 180 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' },
]

const modalVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const editingId = ref('')

const defaultForm = {
  name: '',
  address: '',
  phone: '',
  dailyCapacity: 50,
  businessHours: {
    lunch: '11:30-12:30',
    dinner: '17:30-18:30',
  },
  status: 'active',
}

const formData = reactive({ ...defaultForm })

async function loadData() {
  loading.value = true
  try {
    const res = await getCanteenList()
    dataSource.value = res
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  isEdit.value = false
  editingId.value = ''
  Object.assign(formData, JSON.parse(JSON.stringify(defaultForm)))
  modalVisible.value = true
}

function handleEdit(record: CanteenItem) {
  isEdit.value = true
  editingId.value = record._id
  Object.assign(formData, JSON.parse(JSON.stringify(record)))
  modalVisible.value = true
}

async function handleSubmit() {
  if (!formData.name || !formData.address || !formData.phone || !formData.dailyCapacity) {
    message.warning('请填写完整信息')
    return
  }
  
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateCanteen(editingId.value, formData as any)
      message.success('更新成功')
    } else {
      await createCanteen(formData as any)
      message.success('创建成功')
    }
    modalVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(record: CanteenItem) {
  try {
    await deleteCanteen(record._id)
    message.success('删除成功')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-header {
  margin-bottom: 16px;
  text-align: right;
}
</style>
