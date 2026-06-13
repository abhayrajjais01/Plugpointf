import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useApp } from "../context/AppContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/firebase";

/**
 * --- THE AUTH PAGE ---
 * This page handles both "Login" and "Sign Up".
 * It uses a single boolean (isLogin) to switch the UI between the two modes.
 */
export function AuthPage() {
  const navigate = useNavigate();
  
  // We pull our authentication "Powers" from the global AppContext
  const { login, signup, loginWithGoogle, isAuthenticated, authLoading } = useApp();
  
  // --- FORM STATE ---
  const [isLogin, setIsLogin] = useState(true); // true = Login mode, false = Signup mode
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Controls the Eye icon
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // If the user somehow gets here while already logged in, send them home!
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  // This function runs when the user clicks the "Sign In" or "Create Account" button
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the browser from refreshing the page
    setError("");

    // Simple validation: make sure fields aren't empty
    if (!email || !password) {
      setError("Please fill in all required fields");
      return;
    }

    if (!isLogin && !name) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Run the login function from AppContext
        await login(email, password);
      } else {
        // Run the signup function from AppContext
        await signup(name, email, password);
      }
      // If successful, take them to the home page
      navigate("/");
    } catch (err: any) {
      // If Firebase returns an error (like "Wrong Password"), show it here
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/");
    } catch (err: any) {
      setError(err.message || "An error occurred with Google sign-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    // min-h-full: makes the page take up at least the full height of the screen
    <div className="min-h-full flex flex-col bg-white">
      
      {/* ─── BACK BUTTON ─── */}
      <div className="px-4 pt-3">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-muted-foreground text-[0.875rem]">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        
        {/* ─── LOGO & TITLE ─── */}
        {/* bg-primary: our main brand green color */}
        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
          <Zap className="w-7 h-7 text-white" />
        </div>
        
        <h1 className="text-[1.5rem]" style={{ fontWeight: 700 }}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>
        
        <p className="text-[0.875rem] text-muted-foreground mt-1">
          {isLogin
            ? "Sign in to continue to PlugPoint"
            : "Join the EV charging community"}
        </p>

        {/* ─── THE FORM ─── */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm mt-8 space-y-4">
          
          {/* ONLY show the Name field if we are signing up */}
          {!isLogin && (
            <div className="relative">
              {/* absolute: place the icon inside the input box */}
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                // pl-10: padding-left to make room for the absolute icon
                className="w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-slate-50 text-[0.875rem] outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-slate-50 text-[0.875rem] outline-none focus:border-primary focus:bg-white transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-border rounded-xl bg-slate-50 text-[0.875rem] outline-none focus:border-primary focus:bg-white transition-all"
            />
            {/* Show/Hide Password Toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-md transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Display Error Message */}
          {error && (
            <p className="text-[0.75rem] text-red-500 text-center font-medium animate-in fade-in zoom-in-95">
              {error}
            </p>
          )}

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  if (!email.trim()) {
                    setError("Please enter your email address first");
                    return;
                  }
                  try {
                    setError("");
                    await sendPasswordResetEmail(auth, email.trim());
                    setResetSent(true);
                    setTimeout(() => setResetSent(false), 5000);
                  } catch (err: any) {
                    setError(err.message || "Failed to send reset email");
                  }
                }}
                className="text-[0.75rem] text-primary font-semibold hover:underline disabled:opacity-50"
              >
                Forgot password?
              </button>
              {resetSent && (
                <p className="text-[0.7rem] text-emerald-600 mt-1 font-medium animate-in fade-in">
                  ✓ Reset link sent to {email}
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            // disables the button while the API is thinking (prevents double-clicks)
            disabled={loading || authLoading}
            className="w-full py-3 bg-primary text-white rounded-xl text-[0.9375rem] font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Get Started"}
          </button>
        </form>

        {/* ─── SOCIAL LOGIN ─── */}
        <div className="flex items-center gap-3 w-full max-w-sm mt-6">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[0.75rem] text-slate-400 font-medium">OR CONTINUE WITH</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        <div className="w-full max-w-sm mt-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading || authLoading}
            className="w-full py-3 border border-slate-200 rounded-xl text-[0.875rem] font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>
        </div>

        {/* ─── SWITCHER ─── */}
        <p className="text-[0.8125rem] text-muted-foreground mt-8">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin); // Toggle between Login and Signup modes
              setError(""); // Clear any old error messages
            }}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? "Join Now" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
