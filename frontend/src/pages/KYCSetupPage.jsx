import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "../config/api";

const KYCSetupPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1); // 1 = ID Proof, 2 = Bank Details
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form data
  const [idProof, setIdProof] = useState(null);
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    accountType: "savings",
    panNumber: "",
    gstNumber: "",
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        setError("File size should be less than 50MB");
        return;
      }
      setIdProof(file);
      setError("");
    }
  };

  const handleBankDetailsChange = (field, value) => {
    setBankDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();

    if (!idProof) {
      setError("Please upload your ID proof");
      return;
    }

    setError("");
    setActiveStep(2);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (
      !bankDetails.accountHolderName ||
      !bankDetails.accountNumber ||
      !bankDetails.ifscCode ||
      !bankDetails.bankName ||
      !bankDetails.panNumber
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // Append ID proof file
      if (idProof) {
        formData.append("idProof", idProof);
      }

      // Append bank details
      Object.keys(bankDetails).forEach((key) => {
        formData.append(key, bankDetails[key]);
      });

      await api.put("/users/profile/payout", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/profile");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save KYC details. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden p-4">
        {/* Background Image */}
        <div
          className="fixed inset-0 bg-cover bg-center opacity-20 blur-sm"
          style={{
            backgroundImage: "url(/images/BackgroundLogin.jpg)",
            zIndex: 0,
          }}
        />

        {/* Success Content */}
        <div className="relative z-10 w-full max-w-md">
          <div
            className="rounded-3xl p-8 border text-center"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(10px)",
              borderColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <h2
              className="text-2xl font-bold text-white mb-3"
              style={{ fontFamily: "Oswald, sans-serif" }}
            >
              KYC Submitted Successfully!
            </h2>
            <p className="text-gray-400">
              Your KYC details have been saved. Redirecting to profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Glass Morphism Card */}
        <div
          className="rounded-3xl p-8 border"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(10px)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/images/LogoOrbital.png"
              alt="IndulgeOut"
              className="h-20 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
            />
          </div>

          {/* Heading */}
          <h1
            className="text-2xl font-bold text-white text-center mb-2"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            Please Submit your details
          </h1>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div
              className={`flex items-center gap-2 ${activeStep === 1 ? "opacity-100" : "opacity-50"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  activeStep === 1
                    ? "bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white"
                    : "bg-white/10 text-gray-400"
                }`}
              >
                1
              </div>
              <span className="text-sm text-white">ID Proof</span>
            </div>
            <div className="w-8 h-px bg-white/20"></div>
            <div
              className={`flex items-center gap-2 ${activeStep === 2 ? "opacity-100" : "opacity-50"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  activeStep === 2
                    ? "bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white"
                    : "bg-white/10 text-gray-400"
                }`}
              >
                2
              </div>
              <span className="text-sm text-white">Bank Details</span>
            </div>
          </div>

          {/* Step 1: ID Proof Upload */}
          {activeStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-xl p-8 hover:border-[#7878E9] transition-all">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="id-proof-upload"
                />
                <label
                  htmlFor="id-proof-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-white font-medium mb-2">
                    {idProof
                      ? idProof.name
                      : "Choose a file or drag & drop it here"}
                  </p>
                  <p className="text-gray-500 text-sm">
                    JPEG, PNG, PDF, and MP4 formats, up to 50MB
                  </p>
                </label>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3 text-sm">
                  Upload your Government ID proof
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Aadhaar card / PAN card / Passport / Voter ID card / Driving
                  Licence
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!idProof}
                className="w-full text-white font-bold py-3.5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background:
                    "linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)",
                  fontFamily: "Oswald, sans-serif",
                }}
              >
                NEXT
              </button>
            </form>
          )}

          {/* Step 2: Bank Details */}
          {activeStep === 2 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankDetails.accountHolderName}
                  onChange={(e) =>
                    handleBankDetailsChange("accountHolderName", e.target.value)
                  }
                  placeholder="e.g. Mukesh Ganpade"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) =>
                    handleBankDetailsChange("accountNumber", e.target.value)
                  }
                  placeholder="e.g. Mukesh Ganpade"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  IFSC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankDetails.ifscCode}
                  onChange={(e) =>
                    handleBankDetailsChange(
                      "ifscCode",
                      e.target.value.toUpperCase(),
                    )
                  }
                  placeholder="e.g. Mukesh Ganpade"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Billing Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) =>
                    handleBankDetailsChange("bankName", e.target.value)
                  }
                  placeholder="e.g. Mukesh Ganpade"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  GSTIN (optional) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankDetails.gstNumber}
                  onChange={(e) =>
                    handleBankDetailsChange(
                      "gstNumber",
                      e.target.value.toUpperCase(),
                    )
                  }
                  placeholder="e.g. Mukesh Ganpade"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  UPI ID (optional) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankDetails.panNumber}
                  onChange={(e) =>
                    handleBankDetailsChange(
                      "panNumber",
                      e.target.value.toUpperCase(),
                    )
                  }
                  placeholder="e.g. Mukesh Ganpade"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent transition-all"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 text-white font-bold py-3.5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)",
                    fontFamily: "Oswald, sans-serif",
                  }}
                >
                  {loading ? "SUBMITTING..." : "SUBMIT"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCSetupPage;
