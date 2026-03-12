import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Eye, EyeOff, FileText, ClipboardCheck, Search, Settings, Bell } from "lucide-react";
import logo from "../images/output-onlinepngtools.png";
import bgImage from "../images/login_bg.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth, User } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const ProcessStep = ({ icon: Icon, title, step }: { icon: any, title: string, step: number }) => (
  <div className="flex flex-col items-center justify-center space-y-2 relative shrink-0">
    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-[#1E8E3E] bg-[#E6F4EA] shadow-sm">
      <Icon className="w-6 h-6 md:w-7 md:h-7" />
    </div>
    <span className="text-xs md:text-sm font-semibold text-gray-800 text-center whitespace-nowrap">
      {step}. {title}
    </span>
  </div>
);

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || "/";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Use the real API endpoint /auth/login
      const response = await api.post<{ access_token: string }>("/auth/login", data);

      const token = response.data.access_token;

      // Fetch user profile immediately after login
      const profileRes = await api.get<User>("/auth/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });

      login(token, profileRes.data);

      toast({
        title: "Login successful",
        description: `Welcome back!`,
      });

      navigate(from, { replace: true });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col font-sans"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Header */}
      <header className="w-full backdrop-blur-sm py-2 px-6 md:px-12 flex flex-col md:flex-row items-center md:justify-start shadow-sm z-10 border-t-4 border-t-[#0056b3] shrink-0">
        <div className="flex items-center justify-center md:justify-center w-full gap-4">
          <img
            src={logo}
            alt="Haryana Gramin Bank Logo"
            className="h-10 md:h-20 w-auto object-contain"
          />
          {/* <div className="h-8 w-px bg-gray-300 hidden md:block"></div>
          <h1 className="text-lg md:text-xl font-bold text-[#003366] tracking-tight text-center md:text-left">
            Complaint Resolution Portal
          </h1> */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-evenly p-2 relative z-10 w-full overflow-y-auto">
        
        <Card className="w-full max-w-[500px] shadow-2xl border-0 bg-white/50 backdrop-blur-md rounded-xl overflow-hidden shrink-0">
          <div className="p-6">
            <h2 className="text-xl font-bold text-center text-[#003366] mb-6 pb-3 border-b border-gray-100 uppercase tracking-wide">
              Complaint Resolution Portal
            </h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-gray-700 font-semibold text-xs">Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your username"
                          className="h-10 text-sm border-gray-300 focus-visible:ring-[#0056b3] bg-gray-50/50"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1 pt-1">
                      <FormLabel className="text-gray-700 font-semibold text-xs">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="h-10 text-sm border-gray-300 focus-visible:ring-[#0056b3] bg-gray-50/50 pr-10 hover:border-blue-400"
                            {...field}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <div className="flex justify-end pt-1 mb-1">
                        <Link to="#" className="text-[12px] text-[#0056b3] hover:text-[#003366] font-semibold hover:underline">
                          Forgot Password?
                        </Link>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-10 bg-[#0056b3] hover:bg-[#004494] text-white text-[14px] font-semibold rounded-lg shadow-md transition-all mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "LOGIN"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </Card>

        {/* Bottom Process Panel */}
        <div className="w-[45%] max-w-4xl mx-auto bg-white/50 backdrop-blur-md rounded-xl shadow-lg p-4 md:p-5 flex flex-wrap lg:flex-nowrap justify-center lg:justify-between items-center gap-4 z-10 border border-gray-100 shrink-0">
          <ProcessStep icon={FileText} title="File Complaint" step={1} />
          <div className="hidden lg:block flex-1 h-[2px] bg-gray-200 mx-2"></div>
          <ProcessStep icon={Search} title="Investigation" step={2} />
          <div className="hidden lg:block flex-1 h-[2px] bg-gray-200 mx-2"></div>
          <ProcessStep icon={Settings} title="Resolution" step={3} />
          <div className="hidden lg:block flex-1 h-[2px] bg-gray-200 mx-2"></div>
          <ProcessStep icon={Bell} title="Status Updated" step={4} />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-3 bg-white/60 backdrop-blur-sm shrink-0">
        <div className="flex flex-wrap justify-center gap-4 mb-1 text-[#0056b3] font-semibold text-xs">
          <Link to="#" className="hover:underline hover:text-[#003366] transition-colors">Help</Link>
          <Link to="#" className="hover:underline hover:text-[#003366] transition-colors">FAQ</Link>
          <Link to="#" className="hover:underline hover:text-[#003366] transition-colors">Contact Us</Link>
          <Link to="#" className="hover:underline hover:text-[#003366] transition-colors">Terms & Conditions</Link>
        </div>
        <p className="text-gray-500 text-xs font-medium">
          © {new Date().getFullYear()} Haryana Gramin Bank. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
