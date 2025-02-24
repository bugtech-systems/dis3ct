"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GalleryVerticalEnd } from "lucide-react";
import axios from "axios";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ className, ...props }: any) {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [user, setUser] = useState<any>(null);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const validatePhone = () => {
    if (!phone) {
      setPhoneError("Phone number is required.");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const validateOtp = () => {
    if (!otp) {
      setOtpError("OTP is required.");
      return false;
    }
    setOtpError("");
    return true;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {

      if (!username && !phone) {
        setPhoneError("Username or Phone is required");
        return
      }

      if (username) {
        const res = await signIn("credentials", {
          redirect: false,
          username,
          otp,
          // userId: user?._id
        });

        console.log(res, 'RESS')
        if (res?.error) {
          setPhoneError(res?.error);
        } else {
          router.push("/");
          return;
        }
      } else if (phone) {
        if (!validatePhone()) return;

        setOtp("")
        const response = await axios.post("/api/generate-otp", { phone, system: localStorage.getItem('system') });
        if (response.data) {
          setStep(2);
          startTimer(600);
          setUser(response.data.data)
        } else {
          setPhoneError("Failed to send OTP. Please try again.");
        }
      }
    } catch (error: any) {
      console.log(error.response, 'ERR')
      setPhoneError(error.response ? error.response.data : "An error occurred while sending OTP.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOtp()) return;

    try {
      const res = await signIn("credentials", {
        redirect: false,
        phone,
        otp,
        userId: user?._id
      });
      if (res?.error) {
        setOtpError("Invalid OTP. Please try again.");
      } else {
        router.push("/");
      }
    } catch (error) {
      setOtpError("An error occurred during verification.");
    }
  };

  const startTimer = (duration: number) => {
    setTimer(duration);
    setIsTimerActive(true);
    setIsResendDisabled(true);
  };

  const handleResendOtp = async () => {
    if (!validatePhone()) return;

    try {
      setIsResendDisabled(true);
      const response = await axios.post("/api/generate-otp", { phone, system: localStorage.getItem('system') });

      console.log(response, 'RESPP')
      if (response.data) {
        startTimer(600); // Restart 10-minute timer
        setUser(response.data.data)
      } else {
        setPhoneError("Failed to resend OTP. Please try again.");
      }
    } catch (error) {
      setPhoneError("An error occurred while resending OTP.");
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };


  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <a href="#" className="flex flex-col items-center gap-2 font-medium">
            <div className="flex h-8 w-8 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-6" />
            </div>
            <span className="sr-only">Bugtech Inc.</span>
          </a>
          <h1 className="text-xl font-bold">Welcome to Dis3ct App.</h1>
        </div>
        {step == 1 &&
          <form onSubmit={handleSendOtp}>

            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
            </div>
            {/* <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="09774461641"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
       
            </div> */}
            {phoneError && (
              <p className="text-red-500 text-sm mt-1">{phoneError}</p>
            )}
            <br />
            <Button
              type="submit"
              className="w-full"
            >
              Login
            </Button>
          </form>
        }

      </div>
      {/*  {step == 2 &&
        <form onSubmit={handleVerifyOtp}>
          {step === 2 && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="otp">One Time Password</Label>
                <Input
                  id="otp"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                {otpError && (
                  <p className="text-red-500 text-sm mt-1">{otpError}</p>
                )}
              </div>
              {isTimerActive && (
                <p className="text-center text-sm text-muted-foreground">
                  Time remaining: {formatTime(timer)}
                </p>
              )}
            </>
          )}
          {step === 2 && !isTimerActive && (
            <div className="text-center text-xs text-muted-foreground">
              <button
                onClick={handleResendOtp}
                className="underline"
                disabled={isResendDisabled}
              >
                {isResendDisabled ? "Please wait..." : "Resend OTP"}
              </button>
            </div>
          )}
          <br />
          <Button
            type="submit"
            className="w-full"
            disabled={!isTimerActive}
          >
            Login
          </Button>
        </form>
      } */}
      <div className="text-center text-xs text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline">
          Privacy Policy
        </a>
        .
      </div>
    </div>
  );
}
