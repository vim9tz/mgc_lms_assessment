"use client";

import { useEffect, useState } from "react";
import { useSearchParams, redirect, usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import AuthStatusModal from "./AuthStatusModal";
import type {} from "next-auth";

export default function AuthRedirect() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const token = searchParams.get("token");
  const auth = searchParams.get("auth") || "";
  const isGuest = auth === "guest";
  const lmsurl = process.env.NEXT_PUBLIC_LMS_URL!;

  const [unauthorized, setUnauthorized] = useState(false);
  const [loading, setLoading] = useState(true);

 

  useEffect(() => {
    if (status === "authenticated") {
      console.log("✅ User is authenticated. Reloading page...");
      window.location.reload();
      return;
    }
    // 🔁 Case 1: Guest with token → redirect to login with token
    if (isGuest && token) {
      console.log("🔁 Guest with token — redirecting to login...");
      redirect(`/login?token=${token}`);
      return;
    }

    // ❌ Case 2: Non-guest without token → logout and redirect to login
    if (!isGuest && !token) {
      console.warn("❌ Non-guest without token — logging out and redirecting...");
      signOut({ redirect: false });
      setUnauthorized(true);
      setLoading(false);
      redirect(`/login`);
      return;
    }

    // ✅ Case 3: Guest with valid guest session → allow through
    if (isGuest && (session as any)?.user?.role === "guest") {
      console.log("✅ Guest session active — proceeding...");
      setLoading(false);
      return;
    }

    // 🔓 Case 4: Guest without valid session → logout and redirect to login
    if (isGuest && (!session || (session as any)?.user?.role !== "guest")) {
      console.warn("🔓 Guest without valid session — logging out and redirecting...");
      signOut({ redirect: false });
      redirect(`/login?token=${token}`);
      return;
    }

    // 🔐 Case 5: Non-guest with token and no session → attempt login
    if (!isGuest && token && !session) {
      signIn("credentials", { Temptoken: token, redirect: false }).then((result) => {
        if (result?.error) {
          console.error("❌ Auth failed:", result.error);
          setUnauthorized(true);
        }
        setLoading(false);
      });
      return;
    }

    setLoading(false);
  }, [token, auth, session]);

  return (
    <AuthStatusModal
      open={loading || unauthorized}
      unauthorized={unauthorized}
      onClose={() => redirect(lmsurl)}
    />
  );
}
