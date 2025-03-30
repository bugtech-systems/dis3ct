"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizePhoneNumber } from "@/lib/helpers";

export function LoginForm({ className, ...props }: any) {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        username: username || sanitizePhoneNumber(phone),
        password,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        localStorage.clear()
        router.push("/");
      }
    } catch (error) {
      setError("An error occurred while logging in.");
    }
  };

  const handleSendOtp = async () => {
    setError("");

    if (!phone) {
      setError("Phone number is required.");
      return;
    }


    try {
      setLoading(true)
      await axios.post("/api/users", { action: "generate-otp", phone });
      setStep(3);
      setLoading(false)
    } catch (error) {
      setError("Failed to send OTP. Please try again.");
      setLoading(false)
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (!otp) {
      setError("OTP is required.");
      return;
    }

    try {
      setLoading(true)
      const res = await signIn("credentials", {
        redirect: false,
        username: phone,
        password: otp,
      });

      if (res?.error) {
        setLoading(false)
        setError("Invalid OTP. Please try again.");
      } else {
        setLoading(false)
        localStorage.clear()
        router.push("/");
      }
    } catch (error) {
      setLoading(false)
      setError("An error occurred during verification.");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-bold text-center">Welcome</h1>
        {step === 1 && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Label>Username</Label>
            <Input
              type="text"
              placeholder="Enter username or phone"
              value={username || phone}
              onChange={(e) => setUsername(e.target.value) || setPhone(e.target.value)}
            />

            <Label>Password</Label>
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" className="w-full">Login</Button>
              <Button variant="outline" onClick={() => setStep(2)} className="w-full">Login with OTP</Button>
            </div>

          </form>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <Label>Phone Number</Label>
            <Input
              type="text"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="flex gap-2">
              <Button disabled={loading} onClick={handleSendOtp} className="w-full">Send OTP</Button>
              <Button variant="outline" onClick={() => setStep(1)} className="w-full">Go Back</Button>
            </div>
            {/* <Button variant="ghost" onClick={() => setStep(2)} className="w-full">Login with OTP</Button> */}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <Label>Phone Number</Label>
            <Input
              type="text"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Label>OTP Code</Label>
            <Input
              type="text"
              placeholder="Enter otp number"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <div className="flex gap-2">
              <Button disabled={loading} onClick={handleVerifyOtp} className="w-full">Login with OTP</Button>
              <Button variant="outline" onClick={() => setStep(1)} className="w-full">Go Back</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}