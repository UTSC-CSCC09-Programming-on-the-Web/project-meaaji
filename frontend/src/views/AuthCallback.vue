<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import LoadingSpinner from "../components/LoadingSpinner.vue";

const route = useRoute();
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

onMounted(async () => {
  try {
    const data = route.query.data as string;
    const code = route.query.code as string;
    const error = route.query.error as string;

    if (error) {
      throw new Error(error);
    }

    // If we have a code but no data, we need to process the OAuth code
    if (code && !data) {
      console.log("🔐 Auth callback: Received OAuth code, processing...");
      
      // Call the backend to exchange the code for auth data
      const response = await fetch(`${API_BASE_URL}/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          state: route.query.state || ''
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🔐 Auth callback: Backend error response:", errorText);
        throw new Error(`Failed to exchange OAuth code: ${response.statusText}`);
      }

      const authData = await response.json();
      console.log("🔐 Auth callback: Received auth data from backend", authData);

      // Store token and user data
      localStorage.setItem("auth_token", authData.token);
      
      // Store the OAuth result in localStorage for parent window to pick up
      console.log("🔐 Storing OAuth result in localStorage");
      localStorage.setItem('oauth_result', JSON.stringify({
        type: 'OAUTH_SUCCESS',
        payload: authData,
        timestamp: Date.now()
      }));
      
      // Try to send message to parent window if possible
      console.log("🔐 Window opener check:", !!window.opener);
      console.log("🔐 Window opener:", window.opener);
      
      if (window.opener) {
        console.log("🔐 Sending OAUTH_SUCCESS message to parent window");
        try {
          window.opener.postMessage(
            {
              type: "OAUTH_SUCCESS",
              payload: authData,
            },
            "*",
          );
          console.log("🔐 Message sent successfully");
        } catch (error) {
          console.log("🔐 Failed to send message to parent:", error);
        }
        
        console.log("🔐 Waiting 2 seconds before closing popup...");
        setTimeout(() => {
          console.log("🔐 Closing popup window");
          window.close();
        }, 2000);
      } else {
        // Fallback for direct navigation
        console.log("🔐 No opener window, redirecting directly");
        console.log("🔐 Waiting 3 seconds before redirect...");
        setTimeout(() => {
          if (authData.user.subscriptionStatus === "active") {
            window.location.href = "/dashboard";
          } else {
            window.location.href = "/subscribe";
          }
        }, 3000);
      }
      return;
    }

    if (!data) {
      throw new Error("No auth data or OAuth code received");
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
