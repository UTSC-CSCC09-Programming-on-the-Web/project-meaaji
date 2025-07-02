<script setup lang="ts">
import { onMounted } from "vue";
import { useAuth } from "../composables/useAuth";
import { useRouter } from "vue-router";

const { user, signOut, checkSubscriptionStatus } = useAuth();
const router = useRouter();

onMounted(async () => {
  // Optional: keep subscription check if needed
  const status = await checkSubscriptionStatus();
  if (!status?.hasActiveSubscription) {
    router.push("/subscribe");
    return;
  }
});
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
              >Draw2Play</span
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
    <main class="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <div class="card p-8 mt-16 flex flex-col items-center space-y-6">
        <div class="text-3xl font-bold text-gray-900">
          Hello {{ user?.name || 'User' }}
        </div>
        <button
          @click="signOut"
          class="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </main>
  </div>
</template>
