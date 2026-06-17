/**
 * Utility functions for the PlugPoint application.
 */

/**
 * Ensures that the Razorpay SDK script is loaded and window.Razorpay is available.
 */
export function ensureRazorpayLoaded(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) {
      resolve();
      return;
    }

    // Find the script tag in the DOM
    const script = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (!script) {
      // If it doesn't exist, create it
      const newScript = document.createElement("script");
      newScript.src = "https://checkout.razorpay.com/v1/checkout.js";
      newScript.async = true;
      newScript.onload = () => resolve();
      newScript.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
      document.body.appendChild(newScript);
      return;
    }

    // If it exists but isn't loaded yet, attach event listeners
    let interval: any = null;

    const handleLoad = () => {
      if (interval) clearInterval(interval);
      resolve();
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };

    const handleError = () => {
      if (interval) clearInterval(interval);
      reject(new Error("Failed to load Razorpay SDK"));
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    // Fallback: in case onload already fired but window.Razorpay wasn't checked yet
    let attempts = 0;
    interval = setInterval(() => {
      if ((window as any).Razorpay) {
        clearInterval(interval);
        resolve();
      } else if (attempts > 50) { // 5 seconds timeout
        clearInterval(interval);
        reject(new Error("Timeout loading Razorpay SDK"));
      }
      attempts++;
    }, 100);
  });
}
