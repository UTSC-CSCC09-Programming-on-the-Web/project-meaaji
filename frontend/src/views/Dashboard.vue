<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAuth } from "../composables/useAuth";
import { useRouter } from "vue-router";
import LoadingSpinner from "../components/LoadingSpinner.vue";

const { user, signOut, checkSubscriptionStatus } = useAuth();
const router = useRouter();

const dashboardData = ref(null);
const isLoading = ref(true);
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

onMounted(async () => {
  // Check subscription status first
  const status = await checkSubscriptionStatus();

  if (!status?.hasActiveSubscription) {
    // User doesn't have active subscription, redirect to subscribe page
    router.push("/subscribe");
    return;
  }

  // Load dashboard data
  await loadDashboardData();
});

const loadDashboardData = async () => {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/dashboard-data`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (response.ok) {
      dashboardData.value = await response.json();
    } else if (response.status === 403) {
      // Subscription required
      router.push("/subscribe");
    } else if (response.status === 401) {
      // Token expired
      router.push("/login");
    }
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <div
              class="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center"
            >
              <svg
                class="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span class="ml-2 text-xl font-semibold text-gray-900"
              >Premium Dashboard</span
            >
            <span
              class="ml-3 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
            >
              Active Subscription
            </span>
          </div>

          <div class="flex items-center space-x-4">
            <div v-if="user" class="flex items-center space-x-3">
              <img
                :src="user.picture"
                :alt="user.name"
                class="h-8 w-8 rounded-full"
              />
              <span class="text-sm font-medium text-gray-700">{{
                user.name
              }}</span>
            </div>

            <button
              @click="signOut"
              class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div v-if="isLoading" class="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>

      <div v-else-if="!dashboardData" class="text-center py-12">
        <p class="text-gray-600">
          Failed to load dashboard data. Please try refreshing the page.
        </p>
      </div>

      <div v-else class="space-y-8 animate-fade-in">
        <!-- Welcome Section -->
        <div class="card p-8">
          <div class="flex items-center space-x-4">
            <img
              :src="user?.picture"
              :alt="user?.name"
              class="h-16 w-16 rounded-full ring-4 ring-primary-100"
            />
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                Welcome back, {{ user?.name.split(" ")[0] }}! 👋
              </h1>
              <p class="text-gray-600">{{ user?.email }}</p>
              <div class="flex items-center mt-2">
                <svg
                  class="h-4 w-4 text-green-500 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-sm text-green-700 font-medium"
                  >Premium Member</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Dashboard Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Stats Cards -->
          <div class="card p-6">
            <div class="flex items-center">
              <div class="p-3 bg-primary-100 rounded-lg">
                <svg
                  class="h-6 w-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Total Users</p>
                <p class="text-2xl font-bold text-gray-900">
                  <span
                    v-if="dashboardData?.data?.stats?.totalUsers !== undefined"
                  >
                    {{ dashboardData.data.stats.totalUsers.toLocaleString() }}
                  </span>
                  <span v-else> N/A </span>
                </p>
              </div>
            </div>
          </div>

          <div class="card p-6">
            <div class="flex items-center">
              <div class="p-3 bg-green-100 rounded-lg">
                <svg
                  class="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Revenue</p>
                <p class="text-2xl font-bold text-gray-900">
                  <span
                    v-if="dashboardData?.data?.stats?.revenue !== undefined"
                  >
                    ${{ (dashboardData.data.stats.revenue / 1000).toFixed(1) }}k
                  </span>
                  <span v-else> N/A </span>
                </p>
              </div>
            </div>
          </div>

          <div class="card p-6">
            <div class="flex items-center">
              <div class="p-3 bg-yellow-100 rounded-lg">
                <svg
                  class="h-6 w-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Growth</p>
                <p class="text-2xl font-bold text-gray-900">
                  <span v-if="dashboardData?.data?.stats?.growth !== undefined">
                    +{{ dashboardData.data.stats.growth }}%
                  </span>
                  <span v-else> N/A </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Premium Features Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Analytics Chart Placeholder -->
          <div class="card">
            <div class="p-6 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">
                Analytics Overview
              </h3>
              <p class="text-sm text-gray-600">
                Premium analytics and insights
              </p>
            </div>
            <div class="p-6">
              <div
                class="h-64 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg flex items-center justify-center"
              >
                <div class="text-center">
                  <svg
                    class="h-12 w-12 text-primary-600 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p class="text-primary-700 font-medium">Advanced Analytics</p>
                  <p class="text-primary-600 text-sm">
                    Premium feature unlocked
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="card">
            <div class="p-6 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Recent Activity</h3>
              <p class="text-sm text-gray-600">
                Latest updates and notifications
              </p>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                <div
                  v-for="i in 5"
                  :key="i"
                  class="flex items-center space-x-4"
                >
                  <div
                    class="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center"
                  >
                    <svg
                      class="h-5 w-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">
                      Premium Activity {{ i }}
                    </p>
                    <p class="text-sm text-gray-500">
                      {{ Math.floor(Math.random() * 60) }} minutes ago
                    </p>
                  </div>
                  <div
                    class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
                  >
                    Premium
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Subscription Status -->
        <div class="card p-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium text-gray-900">
                Subscription Status
              </h3>
              <p class="text-sm text-gray-600">
                Manage your premium subscription
              </p>
            </div>
            <div class="flex items-center space-x-4">
              <div class="text-right">
                <p class="text-sm font-medium text-green-700">
                  Active Subscription
                </p>
                <p class="text-xs text-gray-500">
                  Next billing:
                  {{
                    new Date(
                      Date.now() + 30 * 24 * 60 * 60 * 1000,
                    ).toLocaleDateString()
                  }}
                </p>
              </div>
              <div class="h-3 w-3 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
