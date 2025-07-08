import { ref } from "vue";
import { loadStripe } from "@stripe/stripe-js";

const isLoading = ref(false);
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function useStripe() {
  const createCheckoutSession = async () => {
    isLoading.value = true;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Create checkout session
      const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to load");
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Stripe checkout error:", error);
      alert("Failed to start checkout process. Please try again.");
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    createCheckoutSession,
  };
}
