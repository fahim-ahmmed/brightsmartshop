"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    const result = await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
    });

    if (result?.data) {
      router.push("/");
      router.refresh();
    }
  };

  return null;
}