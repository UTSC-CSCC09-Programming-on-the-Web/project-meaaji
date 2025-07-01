<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAuth } from "../composables/useAuth";
import { useStripe } from "../composables/useStripe";
import { useRoute, useRouter } from "vue-router";
import LoadingSpinner from "../components/LoadingSpinner.vue";

const { user, checkSubscriptionStatus, signOut } = useAuth();
const { isLoading, createCheckoutSession } = useStripe();
const route = useRoute();
const router = useRouter();

const canceled = ref(false);

onMounted(async () => {
  // Check if user came back from canceled checkout
  if (route.query.canceled === "true") {
    canceled.value = true;
  }

  // Check current subscription status
  const status = await checkSubscriptionStatus();
  if (status?.hasActiveSubscription) {
    // User already has active subscription, redirect to dashboard
    router.push("/dashboard");
  }
});

const handleSubscribe = () => {
  createCheckoutSession();
};
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100"
  >
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
              >Premium App</span
            >
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
    <main class="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div class="text-center animate-fade-in">
        <!-- Canceled Message -->
        <div
          v-if="canceled"
          class="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div class="flex items-center justify-center">
            <svg
              class="h-5 w-5 text-yellow-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <p class="text-yellow-800">
              Payment was canceled. You can try again anytime.
            </p>
          </div>
        </div>

        <!-- Header -->
        <div class="mb-12">
          <div
            class="mx-auto h-20 w-20 bg-primary-100 rounded-full flex items-center justify-center mb-6"
          >
            <svg
              class="h-10 w-10 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 class="text-4xl font-bold text-gray-900 mb-4">
            Unlock Premium Features
          </h1>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Subscribe to access your dashboard and all premium features. Cancel
            anytime.
          </p>
        </div>

        <!-- Pricing Card -->
        <div class="max-w-md mx-auto">
          <div class="card p-8 animate-slide-up">
            <div class="text-center mb-6">
              <div class="flex items-center justify-center mb-4">
                <span class="text-5xl font-bold text-gray-900">$9</span>
                <span class="text-gray-600 ml-2">/month</span>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">
                Premium Access
              </h3>
              <p class="text-gray-600">Everything you need to get started</p>
            </div>

            <!-- Features -->
            <div class="space-y-4 mb-8">
              <div class="flex items-center">
                <svg
                  class="h-5 w-5 text-green-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-gray-700">Full dashboard access</span>
              </div>
              <div class="flex items-center">
                <svg
                  class="h-5 w-5 text-green-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-gray-700">Advanced analytics</span>
              </div>
              <div class="flex items-center">
                <svg
                  class="h-5 w-5 text-green-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-gray-700">Priority support</span>
              </div>
              <div class="flex items-center">
                <svg
                  class="h-5 w-5 text-green-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-gray-700">Cancel anytime</span>
              </div>
            </div>

            <!-- Subscribe Button -->
            <button
              @click="handleSubscribe"
              :disabled="isLoading"
              class="btn-primary w-full relative text-lg py-4"
            >
              <div
                v-if="isLoading"
                class="absolute inset-0 flex items-center justify-center"
              >
                <LoadingSpinner size="sm" color="border-white" />
              </div>

              <span :class="{ 'opacity-0': isLoading }"> Subscribe Now </span>
            </button>

            <p class="text-xs text-gray-500 mt-4 text-center">
              Secure payment powered by Stripe • 30-day money-back guarantee
            </p>
          </div>
        </div>

        <!-- Security Notice -->
        <div class="mt-12 max-w-2xl mx-auto">
          <div class="bg-gray-50 rounded-lg p-6">
            <div class="flex items-center justify-center mb-4">
              <svg
                class="h-6 w-6 text-gray-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <h4 class="text-lg font-medium text-gray-900">
                Secure & Trusted
              </h4>
            </div>
            <p class="text-gray-600 text-center">
              Your payment information is encrypted and secure. We use Stripe
              for payment processing and never store your credit card details.
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
