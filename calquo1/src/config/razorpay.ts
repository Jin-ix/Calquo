/**
 * Razorpay Configuration
 *
 * IMPORTANT: Set VITE_RAZORPAY_KEY_ID in your environment variables.
 *
 * For Test Mode: Use keys starting with 'rzp_test_'
 * For Live Mode: Use keys starting with 'rzp_live_'
 *
 * You can get your API keys from: https://dashboard.razorpay.com/app/keys
 */

// Safely resolve the Razorpay Key ID
const resolveKeyId = (): string => {
  const fallback = "rzp_test_SBKiv1M8f9SbKs"; // Removed demo key fallback

  try {
    // Check if we are in a browser environment with import.meta.env
    if (typeof import.meta !== "undefined") {
      const meta = import.meta as any;
      if (meta && meta.env) {
        const envVar = meta.env.VITE_RAZORPAY_KEY_ID;
        if (envVar && envVar !== "rzp_test_YOUR_KEY_ID")
          return envVar;
      }
    }

    // Fallback to window object for some environments
    if (
      typeof window !== "undefined" &&
      (window as any).VITE_RAZORPAY_KEY_ID
    ) {
      const windowVar = (window as any).VITE_RAZORPAY_KEY_ID;
      if (windowVar && windowVar !== "rzp_test_YOUR_KEY_ID")
        return windowVar;
    }
  } catch (error) {
    console.warn("Razorpay Config: Error resolving Key ID");
  }

  return fallback;
};

export const RAZORPAY_CONFIG = {
  // DEMO MODE: Set to false to force real Razorpay integration
  demoMode: false,

  // Resolve Key ID safely
  keyId: resolveKeyId(),

  // Company details shown in payment popup
  companyName: "CALIQUO",

  // Currency (INR for Indian Rupees)
  currency: "INR",

  // Theme color for payment popup (hex color) - CALIQUO Teal/Slate
  themeColor: "#0f172a",

  // Company logo URL (optional)
  logoUrl: "/logo.png",
};