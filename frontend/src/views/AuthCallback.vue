<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import LoadingSpinner from "../components/LoadingSpinner.vue";

const route = useRoute();
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

onMounted(async () => {
  try {
    const data = route.query.data as string;
    const error = route.query.error as string;

    if (error) {
      throw new Error(error);
    }

    if (!data) {
      throw new Error("No auth data received");
    }

    // Parse the auth data
    const authData = JSON.parse(decodeURIComponent(data));
    console.log("🔐 Auth callback: Received auth data", authData);

    // Store token and user data
    localStorage.setItem("auth_token", authData.token);
    
    // Send success message to parent window
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "OAUTH_SUCCESS",
          payload: authData,
        },
        "*",
      );
      window.close();
    } else {
      // Fallback for direct navigation
      if (authData.user.subscriptionStatus === "active") {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/subscribe";
      }
    }
  } catch (error) {
    console.error("OAuth callback error:", error);

    // Send error message to parent window
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "OAUTH_ERROR",
          error:
            error instanceof Error ? error.message : "Authentication failed",
        },
        window.location.origin,
      );
      window.close();
    } else {
      // Fallback for direct navigation
      alert(
        "Authentication failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
      window.location.href = "/login";
    }
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <LoadingSpinner size="lg" />
      <p class="mt-4 text-gray-600">Completing authentication...</p>
    </div>
  </div>
</template>
