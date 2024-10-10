import React, { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import CryptoJS from "crypto-js";
import {jwtDecode} from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRound, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Picture3 from "../assets/logo.jpeg";
import { Toaster } from "@/components/ui/toaster";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "../App";
import API from "@/services/API";
import { getToken } from "@/services/API";

const VITE_HUBBLE_KEY = import.meta.env.VITE_HUBBLE_KEY;

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

const encryptValue = (value) => {
  const key = CryptoJS.enc.Utf8.parse(VITE_HUBBLE_KEY);
  const iv = CryptoJS.enc.Utf8.parse(VITE_HUBBLE_KEY);
  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(value), key, {
    keySize: 128 / 8,
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString();
};

export default function LoginForm({ setAuthenticated }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useContext(AuthContext);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        "https://uat-hubble-api.miraclesoft.com/v2/employee/login",
        {
          loginId: encryptValue(data.username),
          password: encryptValue(data.password),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      // console.log(encryptValue(data.username), "ksjfndskjfbd")
      // console.log(response, "jhfbsdfbsdjkhf")
      if (
        response.status === 200 &&
        response.data.message === "Successfully logged in!"
      ) {
        const decodedToken = jwtDecode(response.data.token);
        const firstName = decodedToken.firstName || data.username;
        const jwtToken = await getToken();
        // console.log(jwtToken);
        localStorage.setItem("token", jwtToken.token)
        toast({
          title: "Login successful!",
          description: "You have been successfully logged in.",
          duration: 2000,
        });
        localStorage.setItem("userId", data.username);
        localStorage.setItem("userName", firstName)
        login();
        navigate("/");
      } else {
        toast({
          title: "Login failed",
          description: "Please check your username and password.",
          variant: "destructive",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error during login:", error);
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-[90%] sm:max-w-md">
      <div className="flex justify-center mb-4">
        <img
          src={Picture3}
          alt="Logo"
          className="w-[200px] sm:w-[250px] h-auto object-contain"
        />
      </div>
      <hr className="border-b border-[#B7B2B3] mb-6 sm:mb-8" />

      <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-4">
        SIGN IN
      </h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 sm:space-y-6"
      >
        <div className="space-y-2 relative">
          <Label htmlFor="username" className="text-sm sm:text-base">
            Username
          </Label>
          <div className="relative">
            <UserRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              id="username"
              placeholder="Username"
              className="pl-10 text-sm sm:text-base"
              {...register("username")}
            />
          </div>
          {errors.username && (
            <p className="text-red-500 text-xs mt-1">
              {errors.username.message}
            </p>
          )}
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="password" className="text-sm sm:text-base">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="pl-10 pr-10 text-sm sm:text-base"
              {...register("password")}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-[#2368A0] hover:bg-[#2368A0]/90 text-sm sm:text-base py-2 sm:py-3"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>

        <div className="flex flex-row items-center justify-between space-x-2 text-[10px] xs:text-xs sm:text-sm">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Checkbox
              id="rememberMe"
              className="w-3 h-3 sm:w-4 sm:h-4"
              {...register("rememberMe")}
            />
            <label
              htmlFor="rememberMe"
              className="text-[10px] xs:text-xs sm:text-sm"
            >
              Remember me
            </label>
          </div>
          <a
            href="#"
            className="text-[10px] xs:text-xs sm:text-sm hover:underline"
          >
            Forgot Password?
          </a>
        </div>
      </form>
      <div className="mt-6 sm:mt-8 text-center text-[10px] xs:text-xs sm:text-sm text-gray-600">
        © 2024 Miracle Software Systems, Inc.
      </div>
    </div>
  );
}