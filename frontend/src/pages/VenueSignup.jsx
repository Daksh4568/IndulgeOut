import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import axios from "axios";
import API_URL from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import CityDropdown from "../components/CityDropdown";
import { ToastContext } from "../App";

const VenueSignup = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const toast = useContext(ToastContext);
  const [formData, setFormData] = useState({
    venueName: "",
    venueType: "",
    contactPersonName: "",
    phoneNumber: "",
    email: "",
    city: "",
    locality: "",
    capacityRange: "",
    instagramLink: "",
  });
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const venueTypeOptions = [
    { value: "cafe", label: "Cafe" },
    { value: "bar", label: "Bar" },
    { value: "studio", label: "Studio" },
    { value: "club", label: "Club" },
    { value: "outdoor", label: "Outdoor Space" },
    { value: "restaurant", label: "Restaurant" },
    { value: "coworking", label: "Coworking Space" },
    { value: "other", label: "Other" },
  ];

  const capacityOptions = [
    { value: "0-20", label: "0-20 people" },
    { value: "20-40", label: "20-40 people" },
    { value: "40-80", label: "40-80 people" },
    { value: "80-150", label: "80-150 people" },
    { value: "150-300", label: "150-300 people" },
    { value: "300+", label: "300+ people" },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      setError("You can only upload up to 3 photos");
      return;
    }
    setPhotos(files);
    setError("");
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation with toast messages
    if (!formData.venueName.trim()) {
      toast?.error("Venue name is required");
      return;
    }
    if (formData.venueName.trim().length < 2) {
      toast?.error("Venue name must be at least 2 characters");
      return;
    }
    if (!formData.contactPersonName.trim()) {
      toast?.error("Contact person name is required");
      return;
    }
    if (formData.contactPersonName.trim().length < 2) {
      toast?.error("Contact person name must be at least 2 characters");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast?.error("Phone number is required");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.phoneNumber.trim())) {
      toast?.error("Please enter a valid 10-digit Indian phone number");
      return;
    }
    if (!formData.email.trim()) {
      toast?.error("Email address is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast?.error("Please enter a valid email address");
      return;
    }
    if (!formData.city.trim()) {
      toast?.error("Please select your city");
      return;
    }
    if (!formData.venueType) {
      toast?.error("Please select your venue type");
      return;
    }
    if (!formData.capacityRange) {
      toast?.error("Please select venue capacity range");
      return;
    }
    if (!formData.instagramLink || !formData.instagramLink.trim()) {
      toast?.error("Instagram / social media link is required");
      return;
    }
    if (!/^https?:\/\/(www\.)?instagram\.com\/.+/.test(formData.instagramLink.trim())) {
      toast?.error("Please enter a valid Instagram URL (e.g., https://instagram.com/yourprofile)");
      return;
    }
    // Validate photo sizes
    if (photos.length > 0) {
      const totalSize = photos.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > 5 * 1024 * 1024) {
        toast?.error("Total photo size should not exceed 5MB");
        return;
      }
      for (const photo of photos) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type)) {
          toast?.error("Only JPEG, PNG and WebP images are allowed");
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.contactPersonName);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phoneNumber", formData.phoneNumber);
      formDataToSend.append("role", "host_partner");
      formDataToSend.append("hostPartnerType", "venue");
      formDataToSend.append("venueName", formData.venueName);
      formDataToSend.append("venueType", formData.venueType);
      formDataToSend.append("capacityRange", formData.capacityRange);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("locality", formData.locality);
      if (formData.instagramLink) {
        formDataToSend.append("instagramLink", formData.instagramLink);
      }
      
      // Append photos
      photos.forEach((photo) => {
        formDataToSend.append("photos", photo);
      });

      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      // Store token
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      // Refresh auth context to update navbar
      await refreshUser();
      // Clear any stored redirect URLs (in case user came from billing page)
      sessionStorage.removeItem('redirectAfterSignup');
      sessionStorage.removeItem('ticketSelection');
      // Redirect to venue dashboard
      navigate("/venue/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      setError(msg);
      toast?.error(msg);
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
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        {/* Logo - Outside Card */}
        <div className="mb-6">
          <button onClick={() => navigate("/")} className="focus:outline-none">
            <img
              src="/images/LogoOrbital.png"
              alt="IndulgeOut"
              className="h-20 w-auto object-contain"
            />
          </button>
        </div>
        {/* Glass Morphism Card */}
        <div
          className="rounded-3xl px-5 py-6 sm:p-8 border w-full max-h-[80vh] overflow-y-auto overflow-x-hidden scrollbar-hide"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(10px)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          {/* Back Button */}
          <button
            onClick={() => navigate("/signup/b2b-type")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm">Back to Business Type</span>
          </button>

          {/* Title */}
          <h1
            className="text-3xl md:text-4xl font-bold text-white text-center mb-6"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            Tell Us About Your Venue
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Venue Name */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Venue Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="venueName"
                value={formData.venueName}
                onChange={handleChange}
                placeholder="e.g. The Blue Note Jazz Club"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ "--tw-ring-color": "#7878E9" }}
              />
            </div>

            {/* Venue Type */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Venue Type <span className="text-red-500">*</span>
              </label>
              <select
                name="venueType"
                value={formData.venueType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ "--tw-ring-color": "#7878E9" }}
              >
                <option value="">Select venue type</option>
                {venueTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Person Name */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Contact Person's Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="contactPersonName"
                value={formData.contactPersonName}
                onChange={handleChange}
                placeholder="e.g. Maneet Gambhir"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ "--tw-ring-color": "#7878E9" }}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 min-w-0">
                <select
                  className="flex-shrink-0 px-2 sm:px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ "--tw-ring-color": "#7878E9" }}
                >
                  <option value="+91">IN +91</option>
                </select>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g. Enter ISD / STD / Mobile Number"
                  className="flex-1 min-w-0 px-3 sm:px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ "--tw-ring-color": "#7878E9" }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. sample@xyz.abc"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ "--tw-ring-color": "#7878E9" }}
              />
            </div>

            {/* City and Locality */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <CityDropdown
                  value={formData.city}
                  onChange={(val) => setFormData({ ...formData, city: val })}
                  placeholder="Select city"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Locality <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="locality"
                  value={formData.locality}
                  onChange={handleChange}
                  placeholder="e.g. Bandra West"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ "--tw-ring-color": "#7878E9" }}
                />
              </div>
            </div>

            {/* Capacity Range */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Capacity Range <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {capacityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, capacityRange: option.value })
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.capacityRange === option.value
                        ? "text-white"
                        : "bg-white/5 text-gray-400 border border-white/10"
                    }`}
                    style={
                      formData.capacityRange === option.value
                        ? {
                            background:
                              "linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)",
                          }
                        : {}
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Instagram Link */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Instagram Link / social Link{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="instagramLink"
                value={formData.instagramLink}
                onChange={handleChange}
                placeholder="e.g. https://www.instagram.com/your_venue"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ "--tw-ring-color": "#7878E9" }}
              />
            </div>

            {/* Upload Photos */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Upload photos (up to 3)
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="photos"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="photos"
                  className="flex flex-col items-center justify-center w-full h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-lg cursor-pointer transition-colors hover:border-[#7878E9]"
                >
                  <Upload className="w-8 h-8 text-gray-500 mb-2" />
                  <p className="text-gray-400 text-sm">
                    {photos.length > 0
                      ? `${photos.length} photo${photos.length > 1 ? 's' : ''} selected`
                      : "Choose files or drag & drop them here"}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    JPEG, PNG, JPG formats, up to 3 photos
                  </p>
                </label>
              </div>
              {photos.length > 0 && (
                <div className="mt-3 space-y-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg">
                      <span className="text-white text-sm truncate">{photo.name}</span>
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="text-red-500 hover:text-red-400 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Continue Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white font-bold py-3.5 rounded-lg transition-all duration-300 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)",
                fontFamily: "Oswald, sans-serif",
              }}
            >
              {isLoading ? "SUBMITTING..." : "CONTINUE"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VenueSignup;
