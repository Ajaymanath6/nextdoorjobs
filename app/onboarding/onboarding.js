"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { WatsonHealthRotate_360 } from "@carbon/icons-react";
import ChatInterface from "../components/Onboarding/ChatInterface";
import EmailAuthForm from "../components/Onboarding/EmailAuthForm";
import StateDistrictSelector from "../components/Onboarding/StateDistrictSelector";
import UrlInput from "../components/Onboarding/UrlInput";
import FundingSeriesBadges from "../components/Onboarding/FundingSeriesBadges";
import SalaryRangeBadges from "../components/Onboarding/SalaryRangeBadges";
import GetCoordinatesButton from "../components/Onboarding/GetCoordinatesButton";
import JobCategorySelector from "../components/Onboarding/JobCategorySelector";

// Field collection states
const COMPANY_FIELDS = {
  NAME: "company_name",
  STATE: "company_state",
  DISTRICT: "company_district",
  WEBSITE: "company_website",
  FUNDING: "company_funding",
  LOCATION: "company_location",
  PINCODE: "company_pincode",
};

const JOB_FIELDS = {
  TITLE: "job_title",
  CATEGORY: "job_category",
  YEARS: "job_years",
  SALARY: "job_salary",
  DESCRIPTION: "job_description",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(true);
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
  const [currentField, setCurrentField] = useState(COMPANY_FIELDS.NAME);
  const [collectingCompany, setCollectingCompany] = useState(true);
  const [inlineComponent, setInlineComponent] = useState(null);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollToInlineRef = useRef(null);

  // Handle email authentication
  const handleEmailAuth = async ({ email, name, password }) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/onboarding/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });

      const result = await response.json();
      if (result.success) {
        setUserData(result.user);
        // Initialize chat with welcome message
        setChatMessages([
          {
            type: "ai",
            text: `Hi ${result.user.name || "there"}! 👋 Welcome to JobsonMap. I'll help you post a job opening. What's your company name?`,
          },
        ]);
        setShowAuth(false);
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
          text: `Hi ${userData.name || "there"}! 👋 Welcome to JobsonMap. I'll help you post a job opening. What's your company name?`,
        },
      ]);
    } else {
      setChatMessages([]);
    }
    setCompanyData(null);
    setJobData(null);
    setCurrentField(COMPANY_FIELDS.NAME);
    setCollectingCompany(true);
  };

  // Extract value from message
  const extractValue = (message, fieldType) => {
    const trimmed = message.trim();
    // Remove quotes if present
    return trimmed.replace(/^["']|["']$/g, "");
  };

  // Add AI message with typing animation
  const addAIMessage = async (text) => {
    setIsTyping(true);
    setTypingText("");
    for (let i = 0; i < text.length; i++) {
      setTypingText(text.slice(0, i + 1));
      await new Promise(resolve => setTimeout(resolve, 20)); // 20ms per character
    }
    setIsTyping(false);
    setChatMessages((prev) => [
      ...prev,
      { type: "ai", text },
    ]);
    setTypingText("");
  };

  // Handle chat messages - conversational form collection
  const handleChatMessage = async (message) => {
    const userMessage = { type: "user", text: message };
    setChatMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(async () => {
      if (collectingCompany) {
        // Collecting company information
        const value = extractValue(message);

        switch (currentField) {
          case COMPANY_FIELDS.NAME:
            setCompanyData((prev) => ({ ...prev, name: value }));
            await addAIMessage(`Got it! Your company name is "${value}". What state is your company located in?`);
            setCurrentField(COMPANY_FIELDS.STATE);
            setInlineComponent(
              <StateDistrictSelector
                onStateSelect={(state) => {
                  setCompanyData((prev) => ({ ...prev, state }));
                  setInlineComponent(null);
                  handleStateSelected(state);
                }}
                selectedState={companyData?.state}
              />
            );
            break;

          case COMPANY_FIELDS.STATE:
            // This case is handled by StateDistrictSelector callback
            break;

          case COMPANY_FIELDS.DISTRICT:
            setCompanyData((prev) => ({ ...prev, district: value }));
            await addAIMessage(`Great! District: ${value}. Do you have a company website URL?`);
            setCurrentField(COMPANY_FIELDS.WEBSITE);
            setInlineComponent(
              <UrlInput
                onUrlSubmit={(url) => {
                  setCompanyData((prev) => ({ ...prev, websiteUrl: url }));
                  setInlineComponent(null);
                  handleWebsiteSubmitted(url);
                }}
                placeholder="Enter website URL or click skip..."
              />
            );
            break;

          case COMPANY_FIELDS.WEBSITE:
            // This case is handled by UrlInput callback
            break;

          case COMPANY_FIELDS.FUNDING:
            // This case is handled by FundingSeriesBadges callback
            break;

          case COMPANY_FIELDS.LOCATION:
            // This case is handled by GetCoordinatesButton callback
            // But also allow manual input
            if (value.toLowerCase() !== "skip" && value) {
              // Try to parse lat,lon or lat lon
              const coords = value.split(/[,\s]+/).map(v => v.trim()).filter(v => v);
              if (coords.length >= 2) {
                setCompanyData((prev) => ({
                  ...prev,
                  latitude: coords[0],
                  longitude: coords[1],
                }));
                await addAIMessage(`Coordinates saved! What's the pincode? (Type "skip" if not available)`);
                setCurrentField(COMPANY_FIELDS.PINCODE);
              } else {
                await addAIMessage(`Please provide both latitude and longitude separated by comma (e.g., 10.5276, 76.2144) or use the button above`);
                setIsLoading(false);
                return;
              }
            } else {
              await addAIMessage(`No problem! What's the pincode? (Type "skip" if not available)`);
              setCurrentField(COMPANY_FIELDS.PINCODE);
            }
            break;

          case COMPANY_FIELDS.PINCODE:
            if (value.toLowerCase() !== "skip" && value) {
              setCompanyData((prev) => ({ ...prev, pincode: value }));
            }
            // Move to job fields
            setCollectingCompany(false);
            setCurrentField(JOB_FIELDS.TITLE);
            await addAIMessage(`Excellent! Company information collected. Now let's add the job position details. What's the job title?`);
            break;
        }
      } else {
        // Collecting job information
        const value = extractValue(message);

        switch (currentField) {
          case JOB_FIELDS.TITLE:
            setJobData((prev) => ({ ...prev, title: value }));
            await addAIMessage(`Job title: ${value}. What category does this job belong to?`);
            setCurrentField(JOB_FIELDS.CATEGORY);
            setInlineComponent(
              <JobCategorySelector
                onCategorySelect={async (category) => {
                  setInlineComponent(null);
                  await handleCategorySelected(category);
                }}
                selectedCategory={jobData?.category}
                onDropdownOpen={() => {
                  // Scroll to inline component when dropdown opens
                  if (scrollToInlineRef.current) {
                    scrollToInlineRef.current();
                  }
                }}
              />
            );
            break;

          case JOB_FIELDS.CATEGORY:
            // This case is handled by JobCategorySelector callback
            break;

          case JOB_FIELDS.YEARS:
            const years = parseFloat(value) || 0;
            setJobData((prev) => ({ ...prev, yearsRequired: years }));
            await addAIMessage(`Experience required: ${years} years. What's the salary range?`);
            setCurrentField(JOB_FIELDS.SALARY);
            setInlineComponent(
              <SalaryRangeBadges
                onSelect={(min, max) => {
                  setInlineComponent(null);
                  handleSalarySelected(min, max);
                }}
                onSkip={() => {
                  setInlineComponent(null);
                  handleSalarySelected(null, null);
                }}
                selectedMin={jobData?.salaryMin}
                selectedMax={jobData?.salaryMax}
              />
            );
            break;

          case JOB_FIELDS.SALARY:
            // This case is handled by SalaryRangeBadges callback
            break;

          case JOB_FIELDS.DESCRIPTION:
            setJobData((prev) => ({ ...prev, jobDescription: value }));
            await addAIMessage(`Perfect! I have all the information. Let me submit your job posting...`);
            // Submit everything
            await handleFinalSubmit();
            break;
        }
      }

      setIsLoading(false);
    }, 500);
  };

  // Handle state selection
  const handleStateSelected = async (state) => {
    setIsLoading(true);
    await addAIMessage(`Perfect! State: ${state}. Which district?`);
    setCurrentField(COMPANY_FIELDS.DISTRICT);
    setInlineComponent(
      <StateDistrictSelector
        onDistrictSelect={(district) => {
          setCompanyData((prev) => ({ ...prev, district }));
          setInlineComponent(null);
          handleDistrictSelected(district);
        }}
        selectedDistrict={companyData?.district}
        showDistrict={true}
      />
    );
    setIsLoading(false);
  };

  // Handle district selection
  const handleDistrictSelected = async (district) => {
    setIsLoading(true);
    await addAIMessage(`Great! District: ${district}. Do you have a company website URL?`);
    setCurrentField(COMPANY_FIELDS.WEBSITE);
            setInlineComponent(
              <UrlInput
                onUrlSubmit={(url) => {
                  if (url.toLowerCase() !== "skip") {
                    setCompanyData((prev) => ({ ...prev, websiteUrl: url }));
                  }
                  setInlineComponent(null);
                  handleWebsiteSubmitted(url);
                }}
                onSkip={() => {
                  setInlineComponent(null);
                  handleWebsiteSubmitted("skip");
                }}
                placeholder="Enter website URL..."
              />
            );
    setIsLoading(false);
  };

  // Handle website submission
  const handleWebsiteSubmitted = async (url) => {
    setIsLoading(true);
    if (url.toLowerCase() !== "skip") {
      await addAIMessage(`Website noted: ${url}. What's your funding series?`);
    } else {
      await addAIMessage(`No problem! What's your funding series?`);
    }
    setCurrentField(COMPANY_FIELDS.FUNDING);
    setInlineComponent(
      <FundingSeriesBadges
        onSelect={(series) => {
          setCompanyData((prev) => ({ ...prev, fundingSeries: series }));
          setInlineComponent(null);
          handleFundingSelected(series);
        }}
        onSkip={() => {
          setInlineComponent(null);
          handleFundingSelected("skip");
        }}
        selectedValue={companyData?.fundingSeries}
      />
    );
    setIsLoading(false);
  };

  // Handle funding selection
  const handleFundingSelected = async (series) => {
    setIsLoading(true);
    if (series.toLowerCase() !== "skip") {
      await addAIMessage(`Funding series: ${series}. Do you have latitude and longitude coordinates?`);
    } else {
      await addAIMessage(`No problem! Do you have latitude and longitude coordinates?`);
    }
    setCurrentField(COMPANY_FIELDS.LOCATION);
    setInlineComponent(
      <GetCoordinatesButton
        onCoordinatesReceived={(lat, lon) => {
          setCompanyData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lon,
          }));
          setInlineComponent(null);
          handleCoordinatesReceived(lat, lon);
        }}
        onSkip={() => {
          setInlineComponent(null);
          handleCoordinatesReceived(null, null);
        }}
      />
    );
    setIsLoading(false);
  };

  // Handle coordinates received
  const handleCoordinatesReceived = async (lat, lon) => {
    setIsLoading(true);
    if (lat && lon) {
      await addAIMessage(`Coordinates saved! What's the pincode? (Type "skip" if not available)`);
    } else {
      await addAIMessage(`No problem! What's the pincode? (Type "skip" if not available)`);
    }
    setCurrentField(COMPANY_FIELDS.PINCODE);
    setIsLoading(false);
  };

  // Handle category selection
  const handleCategorySelected = async (category) => {
    try {
      // Import JOB_CATEGORIES
      const { JOB_CATEGORIES } = await import("../../lib/constants/jobCategories");
      const categoryLabel = JOB_CATEGORIES.find(c => c.value === category)?.label || category;
      
      // Update job data first
      setJobData((prev) => ({ ...prev, category }));
      
      // Set the next field
      setCurrentField(JOB_FIELDS.YEARS);
      
      // Add the next question
      await addAIMessage(`Category: ${categoryLabel}. How many years of experience are required? (Enter a number)`);
    } catch (error) {
      console.error("Error in handleCategorySelected:", error);
      await addAIMessage(`Sorry, there was an error. Please try again.`);
    }
  };

  // Handle salary selection
  const handleSalarySelected = async (min, max) => {
    setIsLoading(true);
    if (min && max) {
      setJobData((prev) => ({
        ...prev,
        salaryMin: min,
        salaryMax: max,
      }));
      await addAIMessage(`Salary range: ₹${parseInt(min).toLocaleString('en-IN')} - ₹${parseInt(max).toLocaleString('en-IN')}. Now, please provide a detailed job description.`);
    } else {
      await addAIMessage(`Great! Now, please provide a detailed job description.`);
    }
    setCurrentField(JOB_FIELDS.DESCRIPTION);
    setIsLoading(false);
  };


  // Handle final submission
  const handleFinalSubmit = async () => {
    if (!userData || !companyData || !jobData) {
      alert("Missing required data. Please go back and complete all steps.");
      return;
    }

    // Additional null checks for required fields
    if (!companyData.name || !companyData.state || !companyData.district) {
      alert("Please complete all required company information.");
      return;
    }

    if (!jobData.title || !jobData.category || !jobData.jobDescription) {
      alert("Please complete all required job position information.");
      return;
    }

    setIsLoading(true);

    try {
      // Submit company first
      const companyFormData = new FormData();
      companyFormData.append("name", companyData.name || "");
      if (companyData.logo) {
        companyFormData.append("logo", companyData.logo);
      }
      if (companyData.websiteUrl) {
        companyFormData.append("websiteUrl", companyData.websiteUrl);
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
      companyFormData.append("state", companyData.state || "");
      companyFormData.append("district", companyData.district || "");
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
          title: jobData.title || "",
          category: jobData.category || "",
          yearsRequired: parseFloat(jobData.yearsRequired || 0),
          salaryMin: jobData.salaryMin ? parseInt(jobData.salaryMin) : null,
          salaryMax: jobData.salaryMax ? parseInt(jobData.salaryMax) : null,
          jobDescription: jobData.jobDescription || "",
          companyId: companyResult.company.id,
        }),
      });

      const jobResult = await jobResponse.json();
      if (!jobResult.success) {
        throw new Error(jobResult.error || "Failed to create job position");
      }

      // Success!
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: `🎉 Success! Your job posting has been submitted successfully. You can now view it on the home page.`,
        },
      ]);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Submission error:", error);
      alert(`Error submitting: ${error.message}. Please try again.`);
    } finally {
      setIsLoading(false);
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
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url(/map-background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#f5f5f5', // Fallback color
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-0"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg overflow-hidden border border-[#E5E5E5] shadow-lg relative">
          {/* Header */}
          <div className="bg-white/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between border-b border-[#E5E5E5] relative z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Back to home"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "#575757" }}
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetChat}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Restart chat"
              >
                <WatsonHealthRotate_360 size={20} style={{ color: "#575757" }} />
              </button>
              <div className="relative" ref={languageDropdownRef}>
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="px-4 py-2 border border-brand-stroke-weak rounded-lg text-sm font-medium transition-colors bg-white text-brand-text-placeholder hover:bg-gray-50 flex items-center gap-2"
                style={{ fontFamily: "Open Sans, sans-serif" }}
              >
                <span className="text-brand-text-strong">{selectedLanguage}</span>
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
                <div className="absolute right-0 mt-2 w-40 bg-white border border-brand-stroke-weak rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      setSelectedLanguage("English");
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm text-brand-text-strong hover:bg-gray-100 transition-colors ${
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
                    className={`w-full text-left px-4 py-2 text-sm text-brand-text-strong hover:bg-gray-100 transition-colors ${
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
                    className={`w-full text-left px-4 py-2 text-sm text-brand-text-strong hover:bg-gray-100 transition-colors ${
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
          </div>

          {/* Content - Always show chat interface */}
          <div className="h-[calc(100vh-200px)] relative z-10">
            <ChatInterface
              messages={chatMessages}
              onSendMessage={handleChatMessage}
              isLoading={isLoading}
              inlineComponent={inlineComponent}
              typingText={isTyping ? typingText : null}
              onScrollRequest={(scrollFn) => {
                scrollToInlineRef.current = scrollFn;
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
