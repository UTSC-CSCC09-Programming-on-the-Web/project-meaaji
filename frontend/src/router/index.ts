import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import Dashboard from "../views/Dashboard.vue";
import Subscribe from "../views/Subscribe.vue";
import AuthCallback from "../views/AuthCallback.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/login",
      name: "Login",
      component: Login,
      meta: { requiresGuest: true },
    },
    {
      path: "/subscribe",
      name: "Subscribe",
      component: Subscribe,
      meta: { requiresAuth: true },
    },
    {
      path: "/dashboard",
      name: "Dashboard",
      component: Dashboard,
      meta: { requiresAuth: true, requiresSubscription: true },
    },
    {
      path: "/auth/callback",
      name: "AuthCallback",
      component: AuthCallback,
    },
  ],
});

// Navigation guard for authentication and subscription
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem("auth_token");
  const isAuthenticated = !!token;

  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/login");
    return;
  }

  // Check if route requires guest (not authenticated)
  if (to.meta.requiresGuest && isAuthenticated) {
    // Check subscription status to determine where to redirect
    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:3000";
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
        if (data.hasActiveSubscription) {
          next("/dashboard");
        } else {
          next("/subscribe");
        }
      } else {
        // Token might be invalid, let them stay on login
        next();
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
      next("/subscribe");
    }
    return;
  }

  // For routes that require subscription, the component will handle the check
  // This allows for better UX with loading states
  next();
});

export default router;
