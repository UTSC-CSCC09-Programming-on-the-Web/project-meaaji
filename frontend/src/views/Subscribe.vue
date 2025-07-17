<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAuth } from "../composables/useAuth";
import { useStripe } from "../composables/useStripe";
import { useRoute, useRouter } from "vue-router";
import LoadingSpinner from "../components/LoadingSpinner.vue"; // Assuming this component exists and is styled

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
    class="min-h-screen bg-gradient-to-br from-primary-100 via-primary-50 to-secondary-50 font-sans"
  >
    <!-- Navigation -->
    <nav class="bg-white shadow-md border-b-4 border-primary-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-20">
          <div class="flex items-center">
            <div
              class="h-12 w-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg animate-pop-in"
            >
              <!-- Friendly app icon -->
              <svg class="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2c-3.31 0-6 2.69-6 6 0 2.45 1.76 4.47 4.08 4.92L12 22l1.92-9.08C16.24 12.47 18 10.45 18 8c0-3.31-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
              </svg>
            </div>
            <span class="ml-3 text-3xl font-bold text-primary-700"
              >Draw2Play!</span
            >
          </div>

          <div class="flex items-center space-x-4">
            <div v-if="user" class="flex items-center space-x-3">
              <img
                :src="user.picture"
                :alt="user.name"
                class="h-10 w-10 rounded-full border-2 border-primary-300 shadow-md"
              />
              <span class="text-lg font-semibold text-neutral-700">{{
                user.name
              }}</span>
            </div>

            <button
              @click="signOut"
              class="text-base text-neutral-600 hover:text-primary-700 transition-colors font-semibold"
            >
              Fly Away!
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
          class="mb-8 p-4 bg-secondary-100 border-2 border-secondary-300 rounded-xl shadow-md"
        >
          <div class="flex items-center justify-center">
            <svg
              class="h-6 w-6 text-secondary-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <p class="text-secondary-800 font-semibold text-lg">
              Oh no! Your adventure pass was canceled. You can try again anytime!
            </p>
          </div>
        </div>

        <!-- Header -->
        <div class="mb-12">
          <div
            class="mx-auto h-28 w-28 bg-accent-300 rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse-grow"
          >
            <!-- A friendly lock/key icon -->
            <svg
              class="h-14 w-14 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
            </svg>
          </div>
          <h1 class="text-5xl font-bold text-primary-800 mb-4">
            Unlock the Magic!
          </h1>
          <p class="text-2xl text-neutral-600 max-w-2xl mx-auto">
            Get your special adventure pass to explore all the amazing stories and create your own!
          </p>
        </div>

        <!-- Pricing Card -->
        <div class="max-w-md mx-auto">
          <div class="card p-10 animate-slide-up">
            <div class="text-center mb-8">
              <div class="flex items-center justify-center mb-4">
                <span class="text-6xl font-bold text-primary-800">$9</span>
                <span class="text-neutral-600 ml-3 text-2xl">/month</span>
              </div>
              <h3 class="text-3xl font-bold text-primary-700 mb-3">
                Adventure Pass
              </h3>
              <p class="text-neutral-600 text-lg">Your ticket to endless fun!</p>
            </div>

            <!-- Features -->
            <div class="space-y-4 mb-8 text-left">
              <div class="flex items-center">
                <svg
                  class="h-7 w-7 text-accent-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-neutral-700 text-lg font-semibold">Full access to all stories!</span>
              </div>
              <div class="flex items-center">
                <svg
                  class="h-7 w-7 text-accent-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-neutral-700 text-lg font-semibold">Create your own magical tales!</span>
              </div>
              <div class="flex items-center">
                <svg
                  class="h-7 w-7 text-accent-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-neutral-700 text-lg font-semibold">Friendly support always!</span>
              </div>
              <div class="flex items-center">
                <svg
                  class="h-7 w-7 text-accent-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-neutral-700 text-lg font-semibold">No long-term commitments!</span>
              </div>
            </div>

            <!-- Subscribe Button -->
            <button
              @click="handleSubscribe"
              :disabled="isLoading"
              class="btn-primary w-full relative text-2xl py-4"
            >
              <div
                v-if="isLoading"
                class="absolute inset-0 flex items-center justify-center"
              >
                <!-- Assuming LoadingSpinner is properly styled for this context -->
                <LoadingSpinner size="sm" color="border-white" />
              </div>

              <span :class="{ 'opacity-0': isLoading }"> Get Your Pass Now! </span>
            </button>

            <p class="text-sm text-neutral-500 mt-4 text-center">
              Safe & sound payments by Stripe • 30-day magic guarantee!
            </p>
          </div>
        </div>

        <!-- Security Notice -->
        <div class="mt-12 max-w-2xl mx-auto">
          <div class="bg-primary-100 rounded-2xl p-6 shadow-md border-2 border-primary-200">
            <div class="flex items-center justify-center mb-4">
              <svg
                class="h-8 w-8 text-primary-600 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
              </svg>
              <h4 class="text-2xl font-bold text-primary-800">
                Super Safe & Trusted!
              </h4>
            </div>
            <p class="text-neutral-600 text-center text-lg">
              Your secret payment info is super safe! We use Stripe for all payments and never peek at your card details.
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
