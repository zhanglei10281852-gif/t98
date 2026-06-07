<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>老年人助餐服务</h1>
        <p>社区助餐服务管理平台</p>
      </div>
      <a-form
        :model="form"
        @finish="handleLogin"
        layout="vertical"
        size="large"
      >
        <a-form-item
          label="用户名"
          name="username"
          :rules="[{ required: true, message: '请输入用户名' }]"
        >
          <a-input
            v-model:value="form.username"
            placeholder="请输入用户名"
          >
            <template #prefix>
              <UserOutlined style="color: #bfbfbf" />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          label="密码"
          name="password"
          :rules="[{ required: true, message: '请输入密码' }]"
        >
          <a-input-password
            v-model:value="form.password"
            placeholder="请输入密码"
          >
            <template #prefix>
              <LockOutlined style="color: #bfbfbf" />
            </template>
          </a-input-password>
        </a-form-item>
        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            block
            :loading="loading"
          >
            登录
          </a-button>
        </a-form-item>
      </a-form>
      <div class="login-tips">
        <p class="tips-title">测试账号：</p>
        <p>管理员：admin / Pass@2024</p>
        <p>助餐点：canteen1 / cc123</p>
        <p>社区工作者：worker1 / wk123</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { login } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: '',
})

const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    const res = await login(form)
    userStore.setToken(res.token)
    userStore.setUserInfo(res.user)
    message.success('登录成功')
    
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (error) {
    // Error handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  color: #1890ff;
  font-size: 28px;
  margin: 0 0 8px 0;
}

.login-header p {
  color: #999;
  font-size: 14px;
  margin: 0;
}

.login-tips {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  font-size: 13px;
  color: #999;
  line-height: 1.8;
}

.login-tips p {
  margin: 0;
}

.tips-title {
  font-weight: 500;
  color: #666;
}
</style>
