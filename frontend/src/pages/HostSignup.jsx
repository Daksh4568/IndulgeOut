import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, ChevronDown, X } from "lucide-react";
import axios from "axios";
import API_URL from "../config/api";
import { useAuth } from "../contexts/AuthContext";

const HostSignup = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    communityName: "",
    category: [],
    contactPersonName: "",
    phoneNumber: "",
    workEmail: "",
    city: "",
    instagramLink: "",
  });
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  const categoryOptions = [
    "Social Mixers",
    "Wellness, Fitness & Sports",
    "Art, Music & Dance",
    "Immersive",
    "Food & Beverage",
    "Games"
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError("");
  };

  const toggleCategory = (category) => {
    const currentCategories = formData.category;
    let updatedCategories;
    
    if (currentCategories.includes(category)) {
      // Remove category if already selected
      updatedCategories = currentCategories.filter(cat => cat !== category);
    } else {
      // Add category if not selected
      updatedCategories = [...currentCategories, category];
    }
    
    setFormData({
      ...formData,
      category: updatedCategories,
    });
    
    // Close dropdown after selection
    setIsCategoryDropdownOpen(false);
    setError("");
  };

  const removeCategory = (categoryToRemove) => {
    setFormData({
      ...formData,
      category: formData.category.filter(cat => cat !== categoryToRemove),
    });
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

    // Validation
    if (!formData.communityName.trim()) {
      setError("Please enter community name");
      return;
    }
    if (!formData.category || formData.category.length === 0) {
      setError("Please select at least one category");
      return;
    }
    if (!formData.contactPersonName.trim()) {
      setError("Please enter contact person name");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setError("Please enter phone number");
      return;
    }
    if (!formData.workEmail.trim()) {
      setError("Please enter work email");
      return;
    }
    if (!formData.city.trim()) {
      setError("Please select city");
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for multipart/form-data request
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.contactPersonName);
      formDataToSend.append("email", formData.workEmail);
      formDataToSend.append("phoneNumber", formData.phoneNumber);
      formDataToSend.append("role", "host_partner");
      formDataToSend.append("hostPartnerType", "community_organizer");
      formDataToSend.append("communityName", formData.communityName);
      
      // Append multiple categories
      if (Array.isArray(formData.category)) {
        formData.category.forEach((cat) => {
          formDataToSend.append("category", cat);
        });
      } else {
        formDataToSend.append("category", formData.category);
      }
      
      formDataToSend.append("city", formData.city);
      if (formData.instagramLink) {
        formDataToSend.append("instagramLink", formData.instagramLink);
      }
      
      // Append photos
      photos.forEach((photo) => {
        formDataToSend.append("photos", photo);
      });

      // Direct B2B registration - no OTP required
      const response = await axios.post(`${API_URL}/api/auth/register`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Store token
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Refresh auth context
      await refreshUser();

      // Redirect to organizer dashboard
      navigate("/organizer/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
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
          className="rounded-3xl p-8 border w-full max-h-[80vh] overflow-y-auto scrollbar-hide"
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
            /* Hide scrollbar in dropdown */
            .overflow-y-auto::-webkit-scrollbar {
              width: 6px;
            }
            .overflow-y-auto::-webkit-scrollbar-track {
              background: transparent;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb {
              background: rgba(120, 120, 233, 0.3);
              border-radius: 3px;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb:hover {
              background: rgba(120, 120, 233, 0.5);
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
            Host
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Community Name */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Community Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="communityName"
                value={formData.communityName}
                onChange={handleChange}
                placeholder="e.g. The Blue Note Jazz Club"
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ "--tw-ring-color": "#7878E9" }}
              />
            </div>

            {/* Category - Custom Dropdown */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              
              {/* Selected Categories Display */}
              {formData.category.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.category.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-sm rounded-full"
                      style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => removeCategory(cat)}
                        className="hover:bg-black/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Custom Dropdown */}
              <div ref={categoryDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all flex items-center justify-between"
                  style={{ "--tw-ring-color": "#7878E9" }}
                >
                  <span className={formData.category.length === 0 ? "text-gray-500" : "text-white"}>
                    {formData.category.length === 0 
                      ? "Choose your category" 
                      : `${formData.category.length} categor${formData.category.length === 1 ? 'y' : 'ies'} selected`}
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isCategoryDropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-zinc-900 border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {categoryOptions.map((option) => {
                      const isSelected = formData.category.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleCategory(option)}
                          className={`w-full px-4 py-3 text-left text-white hover:bg-[#7878E9]/20 transition-colors flex items-center gap-3 ${
                            isSelected ? 'bg-[#7878E9]/30' : ''
                          }`}
                        >
                          <div 
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected ? 'border-transparent' : 'border-white/30'
                            }`}
                            style={isSelected ? { background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' } : {}}
                          >
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
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
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ "--tw-ring-color": "#7878E9" }}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Phone Number <span className="text-red-500">*</span>
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
                  placeholder="e.g. Enter ISD / STD / Mobile Number"
                  className="flex-1 px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ "--tw-ring-color": "#7878E9" }}
                />
              </div>
            </div>

            {/* Work Email */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Work email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="workEmail"
                value={formData.workEmail}
                onChange={handleChange}
                placeholder="e.g. sample@xyz.abc"
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ "--tw-ring-color": "#7878E9" }}
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ "--tw-ring-color": "#7878E9" }}
              >
                <option value="" >
                  Select city
                </option>
                <option
                  value="Mumbai"
                  >
                  Mumbai
                </option>
                <option
                  value="Delhi"
                  >
                  Delhi
                </option>
                <option
                  value="Bangalore"
                  >
                  Bangalore
                </option>
                <option
                  value="Hyderabad"
                  >
                  Hyderabad
                </option>
                <option
                  value="Chennai"
                  >
                  Chennai
                </option>
                <option
                  value="Kolkata"
                  >
                  Kolkata
                </option>
                <option
                  value="Pune"
                  >
                  Pune
                </option>
                <option
                  value="Ahmedabad"
                  >
                  Ahmedabad
                </option>
                <option
                  value="Jaipur"
                  >
                  Jaipur
                </option>
                <option
                  value="Other"
                  >
                  Other
                </option>
              </select>
            </div>

            {/* Instagram Link */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Instagram Link / social link{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="instagramLink"
                value={formData.instagramLink}
                onChange={handleChange}
                placeholder="e.g. https://www.instagram.com/your_community"
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
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
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2.5 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Continue Button */}
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
              {isLoading ? "SUBMITTING..." : "CONTINUE"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HostSignup;

