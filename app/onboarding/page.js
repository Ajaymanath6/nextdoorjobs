"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { WatsonHealthRotate_360 } from "@carbon/icons-react";
import ChatInterface from "../components/Onboarding/ChatInterface";
import EmailAuthForm from "../components/Onboarding/EmailAuthForm";
import CompanyForm from "../components/Onboarding/CompanyForm";
import JobPositionForm from "../components/Onboarding/JobPositionForm";
import ReviewStep from "../components/Onboarding/ReviewStep";

const STEPS = {
  CHAT: "chat",
  USER_INFO: "user_info",
  COMPANY: "company",
  JOB: "job",
  REVIEW: "review",
  SUCCESS: "success",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(true);
  const [currentStep, setCurrentStep] = useState(STEPS.CHAT);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const languageDropdownRef = useRef(null);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    if (showLanguageDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLanguageDropdown]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [jobData, setJobData] = useState(null);

  // Handle email authentication
  const handleEmailAuth = async ({ email, name, password }) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/onboarding/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const result = await response.json();
      if (result.success) {
        setUserData(result.user);
        // Initialize chat with welcome message
        setChatMessages([
          {
            type: "ai",
            text: `Hi ${result.user.name || "there"}! 👋 Welcome to JobsonMap. I'll help you post a job opening. Let's get started with your company information.`,
          },
        ]);
        setShowAuth(false);
        setCurrentStep(STEPS.CHAT);
      } else {
        alert(result.error || "Failed to authenticate. Please try again.");
      }
    } catch (error) {
      console.error("Auth error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset chat function
  const handleResetChat = () => {
    if (userData) {
      setChatMessages([
        {
          type: "ai",
          text: `Hi ${userData.name || "there"}! 👋 Welcome to JobsonMap. I'll help you post a job opening. Let's get started with your company information.`,
        },
      ]);
    } else {
      setChatMessages([]);
    }
    setCompanyData(null);
    setJobData(null);
    setCurrentStep(STEPS.CHAT);
  };

  // Handle chat messages
  const handleChatMessage = async (message) => {
    const userMessage = { type: "user", text: message };
    setChatMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simple response and transition to company form
    if (currentStep === STEPS.CHAT) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: "Great! Let's start by adding your company information. I'll show you a form to fill out.",
          },
        ]);
        setTimeout(() => {
          setCurrentStep(STEPS.COMPANY);
        }, 1000);
      }, 500);
    }

    setIsLoading(false);
  };

  // Handle company form submission
  const handleCompanySubmit = (data) => {
    setCompanyData(data);
    setCurrentStep(STEPS.JOB);
  };

  // Handle job form submission
  const handleJobSubmit = (data) => {
    setJobData(data);
    setCurrentStep(STEPS.REVIEW);
  };

  // Handle final submission
  const handleFinalSubmit = async () => {
    if (!userData || !companyData || !jobData) {
      alert("Missing required data. Please go back and complete all steps.");
      return;
    }

    setIsLoading(true);

    try {
      // Submit company first
      const companyFormData = new FormData();
      companyFormData.append("name", companyData.name);
      if (companyData.logo) {
        companyFormData.append("logo", companyData.logo);
      }
      if (companyData.fundingSeries) {
        companyFormData.append("fundingSeries", companyData.fundingSeries);
      }
      if (companyData.latitude) {
        companyFormData.append("latitude", companyData.latitude);
      }
      if (companyData.longitude) {
        companyFormData.append("longitude", companyData.longitude);
      }
      companyFormData.append("state", companyData.state);
      companyFormData.append("district", companyData.district);
      if (companyData.pincode) {
        companyFormData.append("pincode", companyData.pincode);
      }
      companyFormData.append("userId", userData.id.toString());

      const companyResponse = await fetch("/api/onboarding/company", {
        method: "POST",
        body: companyFormData,
      });

      const companyResult = await companyResponse.json();
      if (!companyResult.success) {
        throw new Error(companyResult.error || "Failed to create company");
      }

      // Submit job position
      const jobResponse = await fetch("/api/onboarding/job-position", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: jobData.title,
          category: jobData.category,
          yearsRequired: parseFloat(jobData.yearsRequired),
          salaryMin: jobData.salaryMin ? parseInt(jobData.salaryMin) : null,
          salaryMax: jobData.salaryMax ? parseInt(jobData.salaryMax) : null,
          jobDescription: jobData.jobDescription,
          companyId: companyResult.company.id,
        }),
      });

      const jobResult = await jobResponse.json();
      if (!jobResult.success) {
        throw new Error(jobResult.error || "Failed to create job position");
      }

      // Success!
      setCurrentStep(STEPS.SUCCESS);
    } catch (error) {
      console.error("Submission error:", error);
      alert(`Error submitting: ${error.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === STEPS.REVIEW) {
      setCurrentStep(STEPS.JOB);
    } else if (currentStep === STEPS.JOB) {
      setCurrentStep(STEPS.COMPANY);
    }
  };

  // Show email authentication overlay
  if (showAuth) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Blurry Map-like Background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 25%, #7dd3fc 50%, #38bdf8 75%, #0ea5e9 100%)",
            opacity: 0.3,
            filter: "blur(20px)",
          }}
        >
          {/* Map-like grid pattern */}
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px),
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)
              `,
            }}
          ></div>
        </div>
        
        {/* Overlay with blur */}
        <div
          className="absolute inset-0 z-10 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(3px)",
          }}
        >
          <EmailAuthForm onSubmit={handleEmailAuth} isLoading={isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="bg-white rounded-lg overflow-hidden border border-[#E5E5E5]">
          {/* Header */}
          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#E5E5E5]">
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetChat}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Restart chat"
              >
                <WatsonHealthRotate_360 size={20} style={{ color: "#575757" }} />
              </button>
            </div>
            <div className="relative" ref={languageDropdownRef}>
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                style={{ fontFamily: "Open Sans, sans-serif" }}
              >
                <span>{selectedLanguage}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showLanguageDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showLanguageDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      setSelectedLanguage("English");
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      selectedLanguage === "English" ? "bg-gray-50 font-medium" : ""
                    }`}
                    style={{ fontFamily: "Open Sans, sans-serif" }}
                  >
                    English
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLanguage("Malayalam");
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      selectedLanguage === "Malayalam" ? "bg-gray-50 font-medium" : ""
                    }`}
                    style={{ fontFamily: "Open Sans, sans-serif" }}
                  >
                    Malayalam
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLanguage("Hindi");
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      selectedLanguage === "Hindi" ? "bg-gray-50 font-medium" : ""
                    }`}
                    style={{ fontFamily: "Open Sans, sans-serif" }}
                  >
                    Hindi
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pb-0 min-h-[500px]">
            {currentStep === STEPS.CHAT && (
              <div className="h-[calc(100vh-200px)]">
                <ChatInterface
                  messages={chatMessages}
                  onSendMessage={handleChatMessage}
                  isLoading={isLoading}
                />
              </div>
            )}

            {currentStep === STEPS.COMPANY && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4" style={{ fontFamily: "Open Sans, sans-serif" }}>
                  Company Information
                </h2>
                <CompanyForm onSubmit={handleCompanySubmit} initialData={companyData} />
              </div>
            )}

            {currentStep === STEPS.JOB && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4" style={{ fontFamily: "Open Sans, sans-serif" }}>
                  Job Position Details
                </h2>
                <JobPositionForm onSubmit={handleJobSubmit} initialData={jobData} />
              </div>
            )}

            {currentStep === STEPS.REVIEW && (
              <ReviewStep
                companyData={companyData}
                jobData={jobData}
                onSubmit={handleFinalSubmit}
                onBack={handleBack}
              />
            )}

            {currentStep === STEPS.SUCCESS && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2" style={{ fontFamily: "Open Sans, sans-serif" }}>
                  Success!
                </h2>
                <p className="text-gray-600 mb-6" style={{ fontFamily: "Open Sans, sans-serif" }}>
                  Your job posting has been submitted successfully.
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-3 bg-[#7c00ff] text-white rounded-lg hover:bg-[#6a00e6] transition-colors"
                  style={{ fontFamily: "Open Sans, sans-serif", fontSize: "14px", fontWeight: 600 }}
                >
                  Go to Home
                </button>
              </div>
            )}

            {isLoading && currentStep !== STEPS.CHAT && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[#7c00ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600" style={{ fontFamily: "Open Sans, sans-serif" }}>
                    Submitting...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
