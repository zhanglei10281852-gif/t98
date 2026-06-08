<template>
  <div class="ranking-page">
    <a-card class="filter-card">
      <div class="filter-row">
        <a-radio-group v-model:value="rankType" size="large">
          <a-radio-button value="daily">日排名</a-radio-button>
          <a-radio-button value="monthly">月排名</a-radio-button>
        </a-radio-group>

        <a-date-picker
          v-if="rankType === 'daily'"
          v-model:value="selectedDate"
          style="width: 200px"
          @change="loadData"
        />
        <a-month-picker
          v-else
          v-model:value="selectedMonth"
          style="width: 200px"
          @change="loadData"
          format="YYYY-MM"
        />

        <a-button type="primary" @click="loadData">
          <template #icon><ReloadOutlined /></template>
          刷新排名
        </a-button>
      </div>
    </a-card>

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="12">
        <a-card title="🏆 红榜 - 优秀助餐点">
          <a-tabs v-model:activeKey="activeRedTab">
            <a-tab-pane key="mealCount" tab="就餐量">
              <div class="ranking-list">
                <div
                  v-for="(item, index) in rankingData?.redList?.mealCount || []"
                  :key="item.canteenId"
                  class="ranking-item red"
                >
                  <span class="rank gold">{{ index + 1 }}</span>
                  <span class="name">{{ item.canteenName }}</span>
                  <span class="value">{{ item.mealCount }} 人次</span>
                </div>
              </div>
            </a-tab-pane>
            <a-tab-pane key="revenue" tab="营业额">
              <div class="ranking-list">
                <div
                  v-for="(item, index) in rankingData?.redList?.revenue || []"
                  :key="item.canteenId"
                  class="ranking-item red"
                >
                  <span class="rank gold">{{ index + 1 }}</span>
                  <span class="name">{{ item.canteenName }}</span>
                  <span class="value">¥{{ item.revenue.toFixed(2) }}</span>
                </div>
              </div>
            </a-tab-pane>
            <a-tab-pane key="satisfaction" tab="满意度">
              <div class="ranking-list">
                <div
                  v-for="(item, index) in rankingData?.redList?.satisfaction || []"
                  :key="item.canteenId"
                  class="ranking-item red"
                >
                  <span class="rank gold">{{ index + 1 }}</span>
                  <span class="name">{{ item.canteenName }}</span>
                  <span class="value">{{ item.satisfaction.toFixed(1) }} 分</span>
                </div>
              </div>
            </a-tab-pane>
            <a-tab-pane key="subsidyEfficiency" tab="补贴效率">
              <div class="ranking-list">
                <div
                  v-for="(item, index) in rankingData?.redList?.subsidyEfficiency || []"
                  :key="item.canteenId"
                  class="ranking-item red"
                >
                  <span class="rank gold">{{ index + 1 }}</span>
                  <span class="name">{{ item.canteenName }}</span>
                  <span class="value">{{ item.subsidyEfficiency.toFixed(4) }} 人/元</span>
                </div>
              </div>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>

      <a-col :span="12">
        <a-card title="📉 黑榜 - 待改进助餐点">
          <a-tabs v-model:activeKey="activeBlackTab">
            <a-tab-pane key="mealCount" tab="就餐量">
              <div class="ranking-list">
                <div
                  v-for="(item, index) in rankingData?.blackList?.mealCount || []"
                  :key="item.canteenId"
                  class="ranking-item black"
                >
                  <span class="rank bad">{{ index + 1 }}</span>
                  <span class="name">{{ item.canteenName }}</span>
                  <span class="value">{{ item.mealCount }} 人次</span>
                </div>
              </div>
            </a-tab-pane>
            <a-tab-pane key="revenue" tab="营业额">
              <div class="ranking-list">
                <div
                  v-for="(item, index) in rankingData?.blackList?.revenue || []"
                  :key="item.canteenId"
                  class="ranking-item black"
                >
                  <span class="rank bad">{{ index + 1 }}</span>
                  <span class="name">{{ item.canteenName }}</span>
                  <span class="value">¥{{ item.revenue.toFixed(2) }}</span>
                </div>
              </div>
            </a-tab-pane>
            <a-tab-pane key="satisfaction" tab="满意度">
              <div class="ranking-list">
                <div
                  v-for="(item, index) in rankingData?.blackList?.satisfaction || []"
                  :key="item.canteenId"
                  class="ranking-item black"
                >
                  <span class="rank bad">{{ index + 1 }}</span>
                  <span class="name">{{ item.canteenName }}</span>
                  <span class="value">{{ item.satisfaction.toFixed(1) }} 分</span>
                </div>
              </div>
            </a-tab-pane>
            <a-tab-pane key="subsidyEfficiency" tab="补贴效率">
              <div class="ranking-list">
                <div
                  v-for="(item, index) in rankingData?.blackList?.subsidyEfficiency || []"
                  :key="item.canteenId"
                  class="ranking-item black"
                >
                  <span class="rank bad">{{ index + 1 }}</span>
                  <span class="name">{{ item.canteenName }}</span>
                  <span class="value">{{ item.subsidyEfficiency.toFixed(4) }} 人/元</span>
                </div>
              </div>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="📊 综合排名详情" style="margin-top: 16px">
      <a-table
        :columns="rankingColumns"
        :data-source="rankingData?.rankings || []"
        :pagination="false"
        row-key="canteenId"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'rank'">
            <span class="rank-badge" :class="getRankClass(index)">{{ index + 1 }}</span>
          </template>
          <template v-else-if="column.key === 'revenue'">
            ¥{{ record.revenue.toFixed(2) }}
          </template>
          <template v-else-if="column.key === 'satisfaction'">
            <a-rate :value="record.satisfaction / 2" disabled allow-half />
            <span style="margin-left: 8px">{{ record.satisfaction.toFixed(1) }}</span>
          </template>
          <template v-else-if="column.key === 'subsidyEfficiency'">
            {{ record.subsidyEfficiency.toFixed(4) }}
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { ReloadOutlined } from '@ant-design/icons-vue'
import { getCanteenRanking, RankingData } from '@/api/ranking'

const rankType = ref('monthly')
const selectedDate = ref<dayjs.Dayjs>(dayjs())
const selectedMonth = ref<dayjs.Dayjs>(dayjs())
const rankingData = ref<RankingData | null>(null)
const loading = ref(false)

const activeRedTab = ref('mealCount')
const activeBlackTab = ref('mealCount')

const rankingColumns = [
  { title: '排名', key: 'rank', width: 80 },
  { title: '助餐点名称', dataIndex: 'canteenName', key: 'canteenName' },
  { title: '就餐人次', dataIndex: 'mealCount', key: 'mealCount', sorter: (a: any, b: any) => a.mealCount - b.mealCount },
  { title: '营业额', dataIndex: 'revenue', key: 'revenue', sorter: (a: any, b: any) => a.revenue - b.revenue },
  { title: '满意度', dataIndex: 'satisfaction', key: 'satisfaction', sorter: (a: any, b: any) => a.satisfaction - b.satisfaction },
  { title: '补贴效率(人/元)', dataIndex: 'subsidyEfficiency', key: 'subsidyEfficiency', sorter: (a: any, b: any) => a.subsidyEfficiency - b.subsidyEfficiency },
]

async function loadData() {
  try {
    loading.value = true
    let period: string | undefined
    if (rankType.value === 'daily') {
      period = selectedDate.value.format('YYYY-MM-DD')
    } else {
      period = selectedMonth.value.format('YYYY-MM')
    }
    const data = await getCanteenRanking(rankType.value, period)
    rankingData.value = data
  } catch (error: any) {
    message.error(error.message || '获取排名数据失败')
  } finally {
    loading.value = false
  }
}

function getRankClass(index: number): string {
  if (index === 0) return 'gold'
  if (index === 1) return 'silver'
  if (index === 2) return 'bronze'
  return ''
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.ranking-page {
  padding: 24px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.ranking-list {
  padding: 8px 0;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  transition: all 0.3s;
}

.ranking-item:hover {
  transform: translateX(4px);
}

.ranking-item.red {
  background: linear-gradient(90deg, #fff7e6 0%, #ffffff 100%);
  border-left: 4px solid #faad14;
}

.ranking-item.black {
  background: linear-gradient(90deg, #fff1f0 0%, #ffffff 100%);
  border-left: 4px solid #ff4d4f;
}

.rank {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  margin-right: 16px;
}

.rank.gold {
  background: linear-gradient(135deg, #ffd666 0%, #faad14 100%);
  color: #fff;
}

.rank.silver {
  background: linear-gradient(135deg, #e8e8e8 0%, #bfbfbf 100%);
  color: #fff;
}

.rank.bronze {
  background: linear-gradient(135deg, #ffbb96 0%, #d46b08 100%);
  color: #fff;
}

.rank.bad {
  background: #ffccc7;
  color: #cf1322;
}

.name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.value {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f0f0f0;
  color: #666;
  font-size: 13px;
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
