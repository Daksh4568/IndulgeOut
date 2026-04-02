import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../config/api";
import { useAuth } from "../contexts/AuthContext";

const B2CSignup = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleRegister = async (e) => {
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
      // Register new user directly (no OTP required on first signup)
      const response = await axios.post(`${API_URL}/api/auth/otp/register`, {
        name: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
      });

      // Store token
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Refresh auth context to update navbar
      await refreshUser();

      // Check if there's a redirect URL stored (e.g., from billing page)
      const redirectUrl = sessionStorage.getItem('redirectAfterSignup');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterSignup');
        navigate(redirectUrl);
      } else {
        // Redirect to Explore page so users can browse and register for events
        navigate("/explore");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register");
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
          className="rounded-3xl px-5 py-6 sm:p-8 border w-full overflow-hidden"
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
          
          {/* Registration Form */}
          <h1
            className="text-2xl md:text-3xl font-bold text-white text-center mb-1.5"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            Join Us
          </h1>
          <p className="text-gray-300 text-center mb-4 text-sm">
            Create your account to get started
          </p>

          <form onSubmit={handleRegister} className="space-y-3.5">
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
                  <div className="flex gap-2 min-w-0">
                    <select
                      className="flex-shrink-0 px-2 sm:px-3 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ "--tw-ring-color": "#7878E9" }}
                    >
                      <option value="+91">IN +91</option>
                    </select>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="Enter mobile number"
                      className="flex-1 min-w-0 px-3 sm:px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
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

            {/* Register Button */}
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
              {isLoading ? "REGISTERING..." : "REGISTER"}
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
        </div>
      </div>
    </div>
  );
};

export default B2CSignup;
