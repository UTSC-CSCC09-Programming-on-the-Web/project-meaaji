<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import LoadingSpinner from "../components/LoadingSpinner.vue";

const route = useRoute();
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

onMounted(async () => {
  try {
    const code = route.query.code as string;
    const state = route.query.state as string;
    const error = route.query.error as string;

    if (error) {
      throw new Error(error);
    }

    if (!code) {
      throw new Error("No authorization code received");
    }

    // Exchange code for token
    const response = await fetch(`${API_BASE_URL}/auth/google/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ code, state }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Authentication failed");
    }

    // Send success message to parent window
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "OAUTH_SUCCESS",
          payload: data,
        },
        window.location.origin,
      );
      window.close();
    } else {
      // Fallback for direct navigation
      localStorage.setItem("auth_token", data.token);
      window.location.href = "/dashboard";
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
