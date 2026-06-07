<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible width="220">
      <div class="logo">
        <span class="logo-text">助餐服务平台</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        :items="menuItems"
        @click="handleMenuClick"
      />
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="header">
        <div class="header-left">
          <a-button type="text" @click="collapsed = !collapsed">
            <MenuUnfoldOutlined v-if="collapsed" />
            <MenuFoldOutlined v-else />
          </a-button>
          <span class="page-title">{{ currentPageTitle }}</span>
        </div>
        <div class="header-right">
          <a-dropdown>
            <div class="user-info">
              <a-avatar :size="32" style="background-color: #1890ff">{{ userStore.userInfo?.name?.charAt(0) }}</a-avatar>
              <span class="user-name">{{ userStore.userInfo?.name }}</span>
              <DownOutlined />
            </div>
            <template #overlay>
              <a-menu>
                <a-menu-item key="role">
                  <UserOutlined />
                  角色：{{ roleText }}
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" @click="handleLogout">
                  <LogoutOutlined />
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const collapsed = ref(false)
const selectedKeys = ref<string[]>([route.path])

const roleText = computed(() => {
  const roleMap: Record<string, string> = {
    admin: '管理员',
    canteen: '助餐点',
    worker: '社区工作者',
  }
  return roleMap[userStore.userInfo?.role || ''] || '未知'
})

const allMenuItems = [
  {
    key: '/dashboard',
    icon: DashboardOutlined,
    label: '仪表盘',
    roles: ['admin', 'canteen', 'worker'],
  },
  {
    key: '/elderly',
    icon: UserOutlined,
    label: '老人管理',
    roles: ['admin', 'worker'],
  },
  {
    key: '/orders',
    icon: ShoppingCartOutlined,
    label: '订单管理',
    roles: ['admin', 'canteen', 'worker'],
  },
  {
    key: '/canteens',
    icon: ShopOutlined,
    label: '助餐点管理',
    roles: ['admin'],
  },
  {
    key: '/subsidy',
    icon: FileTextOutlined,
    label: '补贴报表',
    roles: ['admin', 'worker'],
  },
]

const menuItems = computed(() => {
  const userRole = userStore.userInfo?.role
  return allMenuItems
    .filter(item => !item.roles || item.roles.includes(userRole || ''))
    .map(item => ({
      key: item.key,
      icon: () => h(item.icon),
      label: item.label,
    }))
})

const currentPageTitle = computed(() => {
  const path = route.path
  const item = allMenuItems.find(i => i.key === path)
  return item?.label || ''
})

function handleMenuClick({ key }: { key: string }) {
  router.push(key)
}

function handleLogout() {
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: () => {
      userStore.logout()
      router.push('/login')
      message.success('已退出登录')
    },
  })
}

onMounted(() => {
  selectedKeys.value = [route.path]
})
</script>

<style scoped>
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.1);
}

.logo-text {
  white-space: nowrap;
  overflow: hidden;
}

.header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 500;
  color: #262626;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 0 8px;
  height: 64px;
}

.user-info:hover {
  background: #f5f5f5;
}

.user-name {
  color: #262626;
}

.content {
  margin: 24px;
  background: #fff;
  border-radius: 8px;
  min-height: calc(100vh - 112px);
}
</style>
