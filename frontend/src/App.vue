<template>
  <a-config-provider :locale="zhCN" :theme="theme">
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const theme = {
  token: {
    colorPrimary: '#1890ff',
  },
}
</script>

<style>
#app {
  width: 100%;
  height: 100%;
}
</style>
