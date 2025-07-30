import { ref, computed } from "vue";
import { useRouter } from "vue-router";

interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  subscriptionStatus: string;
}

interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  isSignup?: boolean;
}

const user = ref<User | null>(null);
const isLoading = ref(false);
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useAuth() {
  const router = useRouter();

  const isAuthenticated = computed(() => user.value !== null);
  const hasActiveSubscription = computed(
    () => user.value?.subscriptionStatus === "active",
  );

  const initializeAuth = async () => {
    try {
      // Check if user is already authenticated
      const token = localStorage.getItem("auth_token");
      if (token) {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          user.value = data.user;
        } else {
          // Token is invalid, remove it
          localStorage.removeItem("auth_token");
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      localStorage.removeItem("auth_token");
    }
  };

  const signInWithGoogle = async (isSignup = false) => {
    isLoading.value = true;

    try {
      // Get OAuth URL from backend
      const response = await fetch(
        `${API_BASE_URL}/auth/google?isSignup=${isSignup}`,
      );
      const data = await response.json();

      if (!data.authUrl) {
        throw new Error("Failed to get OAuth URL");
      }

      // Open OAuth popup
      const popup = window.open(
        data.authUrl,
        "google-oauth",
        "width=500,height=600,scrollbars=yes,resizable=yes",
      );

      // Listen for OAuth callback
      const handleCallback = (event: MessageEvent) => {
        console.log("🔐 Received message:", event.origin, event.data);
        // Check if this is our OAuth message
        if (event.data && event.data.type === 'OAUTH_SUCCESS') {
          console.log("🔐 OAuth success message received!");
          popup?.close();
          handleAuthSuccess(event.data.payload, isSignup);
          window.removeEventListener("message", handleCallback);
        } else if (event.data && event.data.type === 'OAUTH_ERROR') {
          console.log("🔐 OAuth error message received!");
          popup?.close();
          console.error("OAuth error:", event.data.error);
          alert("Authentication failed. Please try again.");
          isLoading.value = false;
          window.removeEventListener("message", handleCallback);
        }
      };

      window.addEventListener("message", handleCallback);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleCallback);
          isLoading.value = false;
        }
      }, 1000);
    } catch (error) {
      console.error("Google sign-in error:", error);
      alert("Failed to start authentication. Please try again.");
      isLoading.value = false;
    }
  };

  const handleAuthSuccess = async (
    authData: AuthResponse,
    wasSignup: boolean,
  ) => {
    try {
      // Store token and user data
      localStorage.setItem("auth_token", authData.token);
      user.value = authData.user;

      // Check subscription status and redirect accordingly
      if (authData.user.subscriptionStatus === "active") {
        // User has active subscription, go to dashboard
        await router.push("/dashboard");

        if (authData.isSignup || wasSignup) {
          console.log("Welcome! Account created successfully.");
        } else {
          console.log("Welcome back!");
        }
      } else {
        // User needs to subscribe
        await router.push("/subscribe");
        console.log("Please complete your subscription to continue.");
      }
    } catch (error) {
      console.error("Error handling auth success:", error);
      alert(
        "Authentication completed but failed to process. Please try again.",
      );
    } finally {
      isLoading.value = false;
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return null;

      const response = await fetch(
        `${API_BASE_URL}/check-subscription-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Update user subscription status
        if (user.value) {
          user.value.subscriptionStatus = data.subscriptionStatus;
        }
        return data;
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
    return null;
  };

  const signOut = async () => {
    try {
      // Call logout endpoint
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local state regardless of API call success
      user.value = null;
      localStorage.removeItem("auth_token");
      await router.push("/login");
    }
  };

  return {
    user: computed(() => user.value),
    isAuthenticated,
    hasActiveSubscription,
    isLoading: computed(() => isLoading.value),
    signInWithGoogle,
    signOut,
    initializeAuth,
    checkSubscriptionStatus,
  };
}
