import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../config/api";
import { useAuth } from "../contexts/AuthContext";

const B2CSignup = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1); // 1 = details form, 2 = OTP verification
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [contactMethod, setContactMethod] = useState("email"); // 'email' or 'phone'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.fullName.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setError("Please enter your phone number");
      return;
    }

    setIsLoading(true);

    try {
      // Send OTP
      const identifier =
        contactMethod === "email" ? formData.email : formData.phoneNumber;
      await axios.post(`${API_URL}/api/auth/otp/send`, {
        identifier,
        method: contactMethod,
      });

      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter complete OTP");
      return;
    }

    setIsLoading(true);

    try {
      const identifier =
        contactMethod === "email" ? formData.email : formData.phoneNumber;

      // Verify OTP and register
      const response = await axios.post(`${API_URL}/api/auth/otp/verify`, {
        identifier,
        otp: otpCode,
        method: contactMethod,
        name: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: "user",
      });

      // Store token
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Refresh auth context to update navbar
      await refreshUser();

      // Redirect to user dashboard
      navigate("/user/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setIsLoading(true);

    try {
      const identifier =
        contactMethod === "email" ? formData.email : formData.phoneNumber;
      await axios.post(`${API_URL}/api/auth/otp/resend`, {
        identifier,
        method: contactMethod,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Image with Opacity and Blur */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-20 blur-sm"
        style={{
          backgroundImage: "url(/images/BackgroundLogin.jpg)",
          zIndex: 0,
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo - Outside Card */}
        <div className="mb-6">
          <button onClick={() => navigate("/")} className="focus:outline-none">
            <img
              src="/images/LogoOrbital.png"
              alt="IndulgeOut"
              className="h-16 w-auto object-contain"
            />
          </button>
        </div>
        {/* Glass Morphism Card */}
        <div
          className="rounded-3xl p-8 border w-full"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(10px)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Tagline */}
          <p className="text-gray-300 text-center mb-8 text-sm">
            Find offline experiences, join communities and connect with people
          </p>
          {step === 1 ? (
            /* Step 1: Details Form */
            <>
              <h1
                className="text-2xl md:text-3xl font-bold text-white text-center mb-1.5"
                style={{ fontFamily: "Oswald, sans-serif" }}
              >
                Join Us
              </h1>
              <p className="text-gray-300 text-center mb-4 text-sm">
                Create your account to get started
              </p>

              <form onSubmit={handleSendOTP} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="px-3 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ "--tw-ring-color": "#7878E9" }}
                    >
                      <option value="+91">🇮🇳 +91</option>
                    </select>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="Enter mobile number"
                      className="flex-1 px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ "--tw-ring-color": "#7878E9" }}
                    />
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5"
                    style={{ accentColor: "#7878E9" }}
                  />
                  <label htmlFor="terms" className="text-sm text-gray-300">
                    I agree to the{" "}
                    <span
                      className="hover:underline cursor-pointer"
                      style={{ color: "#7878E9" }}
                    >
                      Terms & Conditions
                    </span>{" "}
                    and{" "}
                    <span
                      className="hover:underline cursor-pointer"
                      style={{ color: "#7878E9" }}
                    >
                      Privacy Policy
                    </span>
                  </label>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Send OTP Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white font-bold py-3.5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)",
                    fontFamily: "Oswald, sans-serif",
                  }}
                >
                  {isLoading ? "SENDING..." : "SEND OTP"}
                </button>

                {/* Login Link */}
                <div className="text-center pt-4 border-t border-white/10">
                  <p className="text-gray-400 text-sm">
                    Already have an Account?{" "}
                    <span
                      onClick={() => navigate("/login")}
                      className="cursor-pointer font-bold transition-colors"
                      style={{ color: "#7878E9" }}
                    >
                      Log In
                    </span>
                  </p>
                </div>
              </form>
            </>
          ) : (
            /* Step 2: OTP Verification */
            <>
              <h1
                className="text-2xl md:text-3xl font-bold text-white text-center mb-1.5"
                style={{ fontFamily: "Oswald, sans-serif" }}
              >
                Enter Your OTP here
              </h1>
              <p className="text-gray-300 text-center mb-6 text-sm">
                We have sent an OTP to your mobile number and email
              </p>

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                {/* OTP Input Boxes */}
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ "--tw-ring-color": "#7878E9" }}
                    />
                  ))}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Sign Up Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white font-bold py-3.5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)",
                    fontFamily: "Oswald, sans-serif",
                  }}
                >
                  {isLoading ? "VERIFYING..." : "SIGN UP"}
                </button>

                {/* Resend OTP */}
                <div className="text-center pt-4">
                  <p className="text-gray-400 text-sm">
                    Didn't receive code?{" "}
                    <span
                      onClick={handleResendOTP}
                      className="cursor-pointer font-semibold transition-colors"
                      style={{ color: "#7878E9" }}
                    >
                      Resend OTP
                    </span>
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default B2CSignup;
