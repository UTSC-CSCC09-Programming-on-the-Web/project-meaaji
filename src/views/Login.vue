<script setup lang="ts">
import { useAuth } from '../composables/useAuth'

const { signInWithGoogle, isLoading } = useAuth()

const handleGoogleSignIn = () => {
  signInWithGoogle(false) // Sign in flow
}

const handleGoogleSignUp = () => {
  signInWithGoogle(true) // Sign up flow
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8 animate-fade-in">
      <!-- Header -->
      <div class="text-center">
        <div class="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
          <svg class="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h2 class="text-3xl font-bold text-gray-900 tracking-tight">
          Welcome to Premium App
        </h2>
        <p class="mt-2 text-gray-600">
          Sign in with Google to access your premium features
        </p>
        <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p class="text-sm text-blue-800">
            <svg class="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            Active subscription required to access the app
          </p>
        </div>
      </div>

      <!-- Login Card -->
      <div class="card p-8 animate-slide-up">
        <div class="space-y-6">
          <!-- Google Sign In -->
          <button
            @click="handleGoogleSignIn"
            :disabled="isLoading"
            class="btn-google w-full relative"
          >
            <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
            </div>
            
            <div :class="{ 'opacity-0': isLoading }" class="flex items-center justify-center gap-3">
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Sign in with Google</span>
            </div>
          </button>
          
          <!-- Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-gray-500">New to our platform?</span>
            </div>
          </div>
          
          <!-- Google Sign Up -->
          <button
            @click="handleGoogleSignUp"
            :disabled="isLoading"
            class="btn-google w-full relative border-2 border-primary-200 hover:border-primary-300"
          >
            <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
            </div>
            
            <div :class="{ 'opacity-0': isLoading }" class="flex items-center justify-center gap-3">
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Create account with Google</span>
            </div>
          </button>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="text-center text-xs text-gray-500">
        <p>
          By continuing, you agree to our 
          <a href="#" class="text-primary-600 hover:text-primary-500">Terms of Service</a>
          and 
          <a href="#" class="text-primary-600 hover:text-primary-500">Privacy Policy</a>
        </p>
        <p class="mt-2">
          Monthly subscription required • Cancel anytime
        </p>
      </div>
    </div>
  </div>
</template>