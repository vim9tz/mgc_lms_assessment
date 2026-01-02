"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Marquee3D } from "@/views/login/Marquee3D";
import { motion, AnimatePresence } from "framer-motion";
import { Particles } from "@/components/magicui/particles";
import Image from "next/image";
import { WarpBackground } from "@/components/magicui/warp-background";
import { useRouter, useSearchParams } from "next/navigation";
import useApi from "@/hooks/useApi";
import { guestFormSchema, otpSchema } from '@/utils/validation';
import { object, safeParse } from "valibot";
import { signIn, useSession } from "next-auth/react";

export default function Page() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const { status } = useSession()
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const isGuest = true;

  const { fetchFromBackend } = useApi(isGuest);

  const [form, setForm] = useState({ name: "", email: "", otp: "", phoneNumber: "", gender: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const sendOtp = async () => {
    setLoading(true);

    const payload = isLogin
      ? {
        email: form.email,
        type: "login",
      }
      : {
        type: token ? "link" : "signUp",
        test_id: token,
        email: form.email,
        name: form.name,
        phoneNumber: Number(form.phoneNumber),
        gender: form.gender,
        active: 1,
      };

    const schema = isLogin
      ? object({ email: guestFormSchema.entries.email })
      : guestFormSchema;

    const result = safeParse(schema, payload);
    // console.log(result);
    if (!result.success) {
      setError(result.issues[0]?.message || "Invalid input");
      setLoading(false);
      return;
    }

    try {
      const res = await fetchFromBackend("/getOTP", "POST", payload);

      if (res?.error) {
        setError(res?.details?.error?.message || "Failed to send OTP");
        setLoading(false);
        return;
      }
      else if (res?.message) {
        setOtpSent(true);
        setError(null);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    const result = safeParse(otpSchema, {
      email: form.email,
      otp: form.otp,
    });

    if (!result.success) {
      setError(result.issues[0]?.message || "Invalid OTP");
      setLoading(false);
      return;
    }

    try {
      const res = await fetchFromBackend("/verifyOTP", "POST", {
        email: form.email,
        otp: form.otp,
        test_id: token,
        full_name: form.name,
      });

      if (res?.test_token) {
        await signIn('credentials', {
          redirect: false,
          Token: res.test_token,
        })
        router.push(`${token ? `/?token=${token}` : "/dashboard"}`);
      } else {
        setError("Invalid OTP.");
      }
    } catch {
      setError("Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => setIsLogin(!isLogin);

  const [color, setColor] = useState("#ffffff");
  useEffect(() => {
    setColor(resolvedTheme === "dark" ? "#ffffff" : "#000000");
  }, [resolvedTheme]);

  useEffect(() => {
  if (status === 'authenticated') {
    if (token) {
      // 🔗 Token-based login → go to test entry
      router.replace(`/?token=${token}`);
    } else {
      // 👤 Normal login → dashboard
      router.replace('/dashboard');
    }
  }
}, [status, token, router]);

  // While checking session, you might want to avoid rendering the form
  if (status === 'authenticated') {
    return null; // or <LoadingSpinner />
  }

  return (
    <WarpBackground className="is-full h-full flex justify-center items-center ">
      <Card className="w-full md:w-[95%] lg:w-[70%]  xl:w-3/4 h-fit z-10 p-4 md:p-6 shadow-sm rounded-none flex flex-col md:flex-row justify-center items-center overflow-hidden gap-6 ">
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full md:w-1/2"
            >
              <Card className="w-full p-4 md:p-6 border-none shadow-none">
                <div className="flex flex-col items-center mb-2">
                  <Image src="/images/logos/Dark.png" alt="Logo" width={100} height={50} className="mb-2" />
                </div>
                <CardHeader className="space-y-2">
                  <CardTitle className="text-xl text-center md:text-left">Login to your account</CardTitle>
                  <CardDescription className="text-center md:text-left">
                    Enter your email below to login to your account
                  </CardDescription>
                  <CardAction>
                    <Button variant="link" onClick={toggleForm}>Sign Up</Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div className="flex flex-col gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          required
                        />
                      </div>
                      {otpSent && (
                        <div className="grid gap-2">
                          <Label htmlFor="otp">OTP</Label>
                          <Input
                            id="otp"
                            type="text"
                            placeholder="Enter OTP"
                            value={form.otp}
                            onChange={(e) => handleChange("otp", e.target.value)}
                            required
                          />
                        </div>
                      )}
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  <Button
                    onClick={otpSent ? verifyOtp : sendOtp}
                    className="w-full !bg-[#7266ef]"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : otpSent ? "Verify OTP" : "Send OTP"}
                  </Button>
                  {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </CardFooter>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full md:w-1/2"
            >
              <Card className="w-full p-4 md:p-6 border-none shadow-none">
                <div className="flex flex-col items-center mb-2">
                  <Image src="/images/logos/Dark.png" alt="Logo" width={100} height={50} className="mb-2" />
                </div>
                <CardHeader className="space-y-2">
                  <CardTitle className="text-xl text-center md:text-left">Create an account</CardTitle>
                  <CardDescription className="text-center md:text-left">
                    Enter your details below to create your account
                  </CardDescription>
                  <CardAction>
                    <Button variant="link" onClick={toggleForm}>Back to Login</Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="flex flex-col gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          value={form.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="m@example.com"
                          value={form.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="9984577612"
                          value={form.phoneNumber}
                          onChange={(e) => handleChange("phoneNumber", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="gender">Gender (M/F)</Label>
                        <Input
                          id="gender"
                          type="text"
                          placeholder="M"
                          value={form.gender}
                          onChange={(e) => handleChange("gender", e.target.value)}
                        />
                      </div>
                      {otpSent && (
                        <div className="grid gap-2">
                          <Label htmlFor="otp">OTP</Label>
                          <Input
                            id="otp"
                            type="text"
                            placeholder="Enter OTP"
                            value={form.otp}
                            onChange={(e) => handleChange("otp", e.target.value)}
                            required
                          />
                        </div>
                      )}
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  <Button onClick={otpSent ? verifyOtp : sendOtp} className="w-full !bg-[#7266ef]" disabled={loading}>
                    {loading ? "Sending OTP..." : "Sign Up with OTP"}
                  </Button>
                  {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="hidden md:block md:w-1/2">
          <Marquee3D />
        </div>
      </Card>

    </WarpBackground>
  );
}
