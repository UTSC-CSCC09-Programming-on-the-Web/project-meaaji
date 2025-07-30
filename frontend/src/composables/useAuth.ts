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
    console.log("🔐 Starting Google sign-in process...");
    isLoading.value = true;

    try {
      console.log("🔐 Fetching OAuth URL from:", `${API_BASE_URL}/auth/google?isSignup=${isSignup}`);
      // Get OAuth URL from backend
      const response = await fetch(
        `${API_BASE_URL}/auth/google?isSignup=${isSignup}`,
      );
      const data = await response.json();
      console.log("🔐 Received OAuth URL response:", data);

      if (!data.authUrl) {
        throw new Error("Failed to get OAuth URL");
      }

      console.log("🔐 Opening OAuth popup with URL:", data.authUrl);
      // Open OAuth popup
      const popup = window.open(
        data.authUrl,
        "google-oauth",
        "width=500,height=600,scrollbars=yes,resizable=yes",
      );

      if (!popup) {
        throw new Error("Popup blocked! Please allow popups for this site.");
      }

      console.log("🔐 OAuth popup opened successfully, waiting for callback...");

      // Listen for OAuth callback
      const handleCallback = (event: MessageEvent) => {
        console.log("🔐 Received message:", event.origin, event.data);
        
        if (event.data && event.data.type === 'OAUTH_SUCCESS') {
          console.log("🔐 OAuth success message received!");
          console.log("🔐 Auth data:", event.data.payload);
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
        } else {
          console.log("🔐 Received non-OAuth message:", event.data);
        }
      };

      window.addEventListener("message", handleCallback);

      // Check if popup was closed manually and also check localStorage periodically
      const checkClosed = setInterval(() => {
        console.log("🔐 Checking popup status:", { closed: popup?.closed, exists: !!popup });
        
        // Check localStorage and sessionStorage for OAuth result (even if popup is still open)
        try {
          let oauthResult = localStorage.getItem('oauth_result');
          if (!oauthResult) {
            oauthResult = sessionStorage.getItem('oauth_result');
            console.log("🔐 Checking sessionStorage for OAuth result...");
          } else {
            console.log("🔐 Checking localStorage for OAuth result...");
          }
          
          if (oauthResult) {
            console.log("🔐 Found OAuth result in storage!");
            console.log("🔐 OAuth result:", oauthResult);
            const data = JSON.parse(oauthResult);
            localStorage.removeItem('oauth_result'); // Clean up
            sessionStorage.removeItem('oauth_result'); // Clean up
            clearInterval(checkClosed);
            window.removeEventListener("message", handleCallback);
            popup?.close();
            handleAuthSuccess(data.payload, isSignup);
            return;
          }
        } catch (error) {
          console.error("🔐 Error checking storage:", error);
        }
        
        if (popup?.closed) {
          console.log("🔐 Popup was closed, checking for OAuth result...");
          clearInterval(checkClosed);
          window.removeEventListener("message", handleCallback);
          
          // Final check for localStorage
          try {
            const oauthResult = localStorage.getItem('oauth_result');
            console.log("🔐 localStorage oauth_result:", oauthResult);
            if (oauthResult) {
              console.log("🔐 Found OAuth result in localStorage");
              const data = JSON.parse(oauthResult);
              localStorage.removeItem('oauth_result'); // Clean up
              handleAuthSuccess(data.payload, isSignup);
              return;
            } else {
              console.log("🔐 No OAuth result found in localStorage");
            }
          } catch (error) {
            console.error("🔐 Error checking localStorage:", error);
          }
          
          console.log("🔐 No OAuth result found, setting loading to false");
          isLoading.value = false;
        }
      }, 500); // Check more frequently (every 500ms instead of 1000ms)
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
    console.log("🔐 handleAuthSuccess called with:", { authData, wasSignup });
    try {
      // Store token and user data
      localStorage.setItem("auth_token", authData.token);
      user.value = authData.user;
      console.log("🔐 Token and user data stored");

      // Check subscription status and redirect accordingly
      console.log("🔐 User subscription status:", authData.user.subscriptionStatus);
      if (authData.user.subscriptionStatus === "active") {
        // User has active subscription, go to dashboard
        console.log("🔐 Redirecting to dashboard...");
        await router.push("/dashboard");

        if (authData.isSignup || wasSignup) {
          console.log("Welcome! Account created successfully.");
        } else {
          console.log("Welcome back!");
        }
      } else {
        // User needs to subscribe
        console.log("🔐 Redirecting to subscribe page...");
        await router.push("/subscribe");
        console.log("Please complete your subscription to continue.");
      }
    } catch (error) {
      console.error("🔐 Error handling auth success:", error);
      alert(
        "Authentication completed but failed to process. Please try again.",
      );
    } finally {
      console.log("🔐 Setting loading to false");
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
