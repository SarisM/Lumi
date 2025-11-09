import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Sparkles, Mail, Lock, User, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { supabase } from "../utils/supabase/client";
import { PWAInstallButton } from "../components/PWAInstallButton";
import { testSupabaseConnection, debugLog, debugError } from "../utils/debug";

interface AuthScreenProps {
  onAuthSuccess: (userId: string, accessToken: string, name: string, hasProfile: boolean) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    dayStartTime: "06:00",
    dayEndTime: "22:00",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  // Test connection on mount
  useEffect(() => {
    const runConnectionTest = async () => {
      debugLog('AuthScreen', 'Component mounted, testing connection...');
      const result = await testSupabaseConnection(projectId, publicAnonKey);
      
      if (result.success) {
        setDebugInfo("✅ Servidor conectado");
        debugLog('AuthScreen', 'Connection test passed');
      } else {
        setDebugInfo(`⚠️ ${result.message}`);
        debugError('AuthScreen', 'Connection test failed:', result.details);
      }
    };
    runConnectionTest();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in
        debugLog('AuthScreen', 'Attempting to sign in with email:', formData.email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          debugError('AuthScreen', 'Sign in error:', error);
          setError(`Error al iniciar sesión: ${error.message}`);
          setLoading(false);
          return;
        }

        if (!data.session) {
          debugError('AuthScreen', 'No session returned from sign in');
          setError("Error al iniciar sesión: No se pudo crear la sesión");
          setLoading(false);
          return;
        }

        debugLog('AuthScreen', 'Sign in successful, user ID:', data.user.id);
        const userName = data.user?.user_metadata?.name || "User";
        
        // Check if user has completed profile
        try {
          debugLog('AuthScreen', 'Checking user profile...');
          const profileResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-7e221a31/users/${data.user.id}`,
            {
              headers: {
                Authorization: `Bearer ${data.session.access_token}`,
              },
            }
          );
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            debugLog('AuthScreen', 'Profile data:', profileData);
            const hasProfile = profileData.user && 
                              profileData.user.weight && 
                              profileData.user.height && 
                              profileData.user.age;
            debugLog('AuthScreen', 'Has complete profile:', hasProfile);
            onAuthSuccess(data.user.id, data.session.access_token, userName, hasProfile);
          } else {
            debugLog('AuthScreen', 'Profile not found, needs onboarding');
            // No profile found, needs onboarding
            onAuthSuccess(data.user.id, data.session.access_token, userName, false);
          }
        } catch (err) {
          debugError('AuthScreen', 'Error checking profile:', err);
          // On error, assume no profile
          onAuthSuccess(data.user.id, data.session.access_token, userName, false);
        }
      } else {
        // Sign up
        if (!formData.name.trim()) {
          setError("Por favor ingresa tu nombre");
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError("La contraseña debe tener al menos 6 caracteres");
          setLoading(false);
          return;
        }

        debugLog('AuthScreen', 'Attempting to sign up with email:', formData.email);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-7e221a31/auth/signup`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
              name: formData.name,
              dayStartTime: formData.dayStartTime,
              dayEndTime: formData.dayEndTime,
            }),
          }
        );

        const result = await response.json();
        debugLog('AuthScreen', 'Signup response:', result);

        if (!response.ok) {
          debugError('AuthScreen', 'Signup failed:', result);
          setError(result.error || "No se pudo crear la cuenta");
          setLoading(false);
          return;
        }

        debugLog('AuthScreen', 'Account created, attempting auto-login...');

        // Auto-login after signup
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          debugError('AuthScreen', 'Auto-login error:', error);
          setError("Cuenta creada pero el inicio de sesión falló. Por favor intenta iniciar sesión.");
          setLoading(false);
          return;
        }

        if (!data.session) {
          debugError('AuthScreen', 'No session after auto-login');
          setError("Cuenta creada pero el inicio de sesión falló. Por favor intenta iniciar sesión.");
          setLoading(false);
          return;
        }

        debugLog('AuthScreen', 'Auto-login successful');
        // New users always need onboarding
        onAuthSuccess(data.user.id, data.session.access_token, formData.name, false);
      }
    } catch (err: any) {
      debugError('AuthScreen', 'Unexpected auth error:', err);
      setError(`Error inesperado: ${err.message || 'Por favor intenta nuevamente'}`);
      setLoading(false);
    }
  };

  return (
    <div className="relative h-full bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 overflow-hidden">
      {/* Animated background blobs */}
      <motion.div
        className="absolute top-20 right-10 w-72 h-72 bg-yellow-200/30 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -20, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
        }}
      />

      <div className="relative h-full overflow-y-auto p-6 pb-24 flex items-start [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="w-full max-w-md mx-auto pt-8">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full flex items-center justify-center shadow-xl"
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
            >
              <Sparkles className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-gray-800 mb-2">
              Welcome to Lumi
            </h1>
            <p className="text-sm text-gray-600">
              {isLogin ? "Sign in to continue your wellness journey" : "Create your account to get started"}
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            className="bg-white/65 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field - only for signup */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10 bg-white/80 border-yellow-200 focus:border-yellow-400 rounded-xl"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-white/80 border-yellow-200 focus:border-yellow-400 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 bg-white/80 border-yellow-200 focus:border-yellow-400 rounded-xl"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Day schedule - only for signup */}
              {!isLogin && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <Label className="text-sm">Horario de tu día</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="dayStartTime" className="text-xs text-gray-600">Comienza</Label>
                      <Input
                        id="dayStartTime"
                        type="time"
                        value={formData.dayStartTime}
                        onChange={(e) => setFormData({ ...formData, dayStartTime: e.target.value })}
                        className="bg-white/80 border-yellow-200 focus:border-yellow-400 rounded-xl text-sm"
                        required={!isLogin}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dayEndTime" className="text-xs text-gray-600">Termina</Label>
                      <Input
                        id="dayEndTime"
                        type="time"
                        value={formData.dayEndTime}
                        onChange={(e) => setFormData({ ...formData, dayEndTime: e.target.value })}
                        className="bg-white/80 border-yellow-200 focus:border-yellow-400 rounded-xl text-sm"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-yellow-600 mt-0.5">💡</span>
                    <span>Usaremos este horario para resetear tus hábitos diarios y enviarte recordatorios personalizados.</span>
                  </p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-800 rounded-xl h-12 shadow-lg disabled:opacity-50"
              >
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            {/* Toggle login/signup */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {isLogin ? (
                  <>
                    Don't have an account? <span className="text-yellow-600">Sign up</span>
                  </>
                ) : (
                  <>
                    Already have an account? <span className="text-yellow-600">Sign in</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* PWA Install Button */}
          <motion.div
            className="mt-6 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <PWAInstallButton />
          </motion.div>



          {/* Info card */}
          <motion.div
            className="mt-4 p-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-xs text-gray-600 text-center">
              🔒 Your data is encrypted and stored securely. Track your hydration, nutrition, and wellness journey with Lumi.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
