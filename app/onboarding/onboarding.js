"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from '@clerk/nextjs';
import { WatsonHealthRotate_360, List } from "@carbon/icons-react";
import ChatInterface from "../components/Onboarding/ChatInterface";
import EmailAuthForm from "../components/Onboarding/EmailAuthForm";
import StateDistrictSelector from "../components/Onboarding/StateDistrictSelector";
import UrlInput from "../components/Onboarding/UrlInput";
import FundingSeriesBadges from "../components/Onboarding/FundingSeriesBadges";
import SalaryRangeBadges from "../components/Onboarding/SalaryRangeBadges";
import GetCoordinatesButton from "../components/Onboarding/GetCoordinatesButton";

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
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [showAuth, setShowAuth] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
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
  const [hasChosenPostGig, setHasChosenPostGig] = useState(false);
  const [onboardingSessionId, setOnboardingSessionId] = useState(null);
  const onboardingSessionIdRef = useRef(null);
  const conversationOrderRef = useRef(0);
  const lastAIMessageTextRef = useRef("");
  const scrollToInlineRef = useRef(null);

  useEffect(() => {
    onboardingSessionIdRef.current = onboardingSessionId;
  }, [onboardingSessionId]);

  const saveConversation = async (stepKey, questionText, answerText) => {
    const sessionId = onboardingSessionIdRef.current;
    if (!sessionId || !questionText) return;
    try {
      await fetch("/api/onboarding/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          stepKey,
          questionText,
          answerText: String(answerText),
          orderIndex: conversationOrderRef.current,
        }),
      });
      conversationOrderRef.current += 1;
    } catch (err) {
      console.error("Error saving conversation:", err);
    }
  };

  // Check if user is authenticated via Clerk on mount (and after OAuth redirect)
  useEffect(() => {
    if (!clerkLoaded) return;

    if (clerkUser) {
      setCheckingAuth(false);
      setShowAuth(false);
      const name = clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.firstName || clerkUser.username || "there";
      const email = clerkUser.emailAddresses[0]?.emailAddress;

      // Show welcome message and buttons immediately so the chat is never empty
      setUserData({
        id: null,
        email: email || "",
        name: name || "there",
        phone: null,
      });
      setChatMessages([
        { type: "ai", text: `Hi ${name || "there"}! 👋 Welcome to mapmyGig.` },
      ]);

      if (!email) return;

      (async () => {
        const setWelcome = (user) => {
          setUserData(user);
          setChatMessages([
            { type: "ai", text: `Hi ${user.name || "there"}! 👋 Welcome to mapmyGig.` },
          ]);
        };
        try {
          const params = new URLSearchParams({ email });
          if (clerkUser.id) params.set("clerkId", clerkUser.id);
          if (clerkUser.imageUrl) params.set("avatarUrl", clerkUser.imageUrl);
          const response = await fetch(`/api/onboarding/user?${params.toString()}`);
          const result = await response.json().catch(() => ({}));
          if (result.success && result.user) {
            setWelcome(result.user);
            return;
          }
        } catch (e) {
          console.error("Error fetching user:", e);
        }
        try {
          const createResponse = await fetch("/api/onboarding/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              name: name || "User",
              clerkId: clerkUser.id,
              avatarUrl: clerkUser.imageUrl || undefined,
            }),
          });
          const createResult = await createResponse.json().catch(() => ({}));
          if (createResult.success && createResult.user) {
            setWelcome(createResult.user);
          }
        } catch (error) {
          console.error("Error creating/fetching user:", error);
        }
      })();
      return;
    }

    const t = setTimeout(() => {
      setCheckingAuth(false);
      setShowAuth(true);
    }, 400);
    return () => clearTimeout(t);
  }, [clerkUser, clerkLoaded]);

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
            text: `Hi ${result.user.name || "there"}! 👋 Welcome to mapmyGig.`,
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
    setHasChosenPostGig(false);
    setOnboardingSessionId(null);
    conversationOrderRef.current = 0;
    if (userData) {
      setChatMessages([
        {
          type: "ai",
          text: `Hi ${userData.name || "there"}! 👋 Welcome to mapmyGig.`,
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

  // User chose "Find a job" → go to map view
  const handleFindJob = () => {
    router.push("/");
  };

  // User chose "Post a gig" → ensure user profile (Clerk linkage), create session, then continue chat
  const handlePostGig = async () => {
    if (!userData) return;
    if (userData.id == null && clerkUser && !clerkUser.emailAddresses?.[0]?.emailAddress) {
      alert("Please add an email to your account (Clerk settings) to post a gig.");
      return;
    }
    setHasChosenPostGig(true);

    try {
      if (clerkUser) {
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (email) {
          await fetch("/api/onboarding/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              name: clerkUser.firstName && clerkUser.lastName
                ? `${clerkUser.firstName} ${clerkUser.lastName}`
                : clerkUser.firstName || clerkUser.username || "User",
              clerkId: clerkUser.id,
              avatarUrl: clerkUser.imageUrl || undefined,
            }),
          });
        }
      }
      const sessionRes = await fetch("/api/onboarding/session", { method: "POST" });
      const sessionData = await sessionRes.json();
      if (sessionData.success && sessionData.sessionId) {
        setOnboardingSessionId(sessionData.sessionId);
        onboardingSessionIdRef.current = sessionData.sessionId;
        conversationOrderRef.current = 0;
      }
    } catch (err) {
      console.error("Error starting onboarding session:", err);
    }

    await addAIMessage("I'll help you post a job opening. What's your company name?");
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
    lastAIMessageTextRef.current = text;
    setChatMessages((prev) => [
      ...prev,
      { type: "ai", text },
    ]);
    setTypingText("");
  };

  // Handle chat messages - conversational form collection
  const handleChatMessage = async (message) => {
    const lastAIText = [...chatMessages].reverse().find((m) => m.type === "ai")?.text ?? "";
    const sessionId = onboardingSessionIdRef.current;
    const stepKey = currentField;
    const orderIndex = conversationOrderRef.current;

    const userMessage = { type: "user", text: message };
    setChatMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(async () => {
      // Ignore messages until user has chosen "Post a gig"
      if (!hasChosenPostGig) {
        setIsLoading(false);
        return;
      }

      if (sessionId && lastAIText) {
        await saveConversation(stepKey, lastAIText, message);
      }

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
            await addAIMessage(`Job title: ${value}. How many years of experience are required? (Enter a number)`);
            setCurrentField(JOB_FIELDS.YEARS);
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
            // Mark this message as final to show action buttons
            setChatMessages((prev) => {
              const updated = [...prev];
              if (updated.length > 0 && updated[updated.length - 1].type === "ai") {
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  isFinalMessage: true,
                };
              }
              return updated;
            });
            break;
        }
      }

      setIsLoading(false);
    }, 500);
  };

  // Handle state selection
  const handleStateSelected = async (state) => {
    await saveConversation(COMPANY_FIELDS.STATE, lastAIMessageTextRef.current, state);
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
    await saveConversation(COMPANY_FIELDS.DISTRICT, lastAIMessageTextRef.current, district);
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
    await saveConversation(COMPANY_FIELDS.WEBSITE, lastAIMessageTextRef.current, url);
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
    await saveConversation(COMPANY_FIELDS.FUNDING, lastAIMessageTextRef.current, series);
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
    const answerText = lat && lon ? `${lat}, ${lon}` : "skip";
    await saveConversation(COMPANY_FIELDS.LOCATION, lastAIMessageTextRef.current, answerText);
    setIsLoading(true);
    if (lat && lon) {
      let coordsLine = `Coordinates saved: ${lat}, ${lon}`;
      try {
        const res = await fetch(
          `/api/geocode/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
        );
        if (res.ok) {
          const { state, district } = await res.json();
          if (district || state) {
            const parts = [district, state].filter(Boolean);
            coordsLine += ` • ${parts.join(", ")}`;
          }
        }
      } catch (_) {
        // Keep coordinates-only message on failure
      }
      await addAIMessage(`${coordsLine}.`);
      await addAIMessage(`What's the pincode? (Type "skip" if not available)`);
    } else {
      await addAIMessage(`No problem! What's the pincode? (Type "skip" if not available)`);
    }
    setCurrentField(COMPANY_FIELDS.PINCODE);
    setIsLoading(false);
  };

  // Handle salary selection
  const handleSalarySelected = async (min, max) => {
    const answerText = min != null && max != null ? `${min}-${max}` : "skip";
    await saveConversation(JOB_FIELDS.SALARY, lastAIMessageTextRef.current, answerText);
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


  // Handle save partial data
  const handleSave = async (messageIndex) => {
    if (!userData) {
      alert("Please authenticate first.");
      return;
    }

    setIsLoading(true);
    try {
      // Save company data if available
      if (collectingCompany && companyData && companyData.name) {
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
        if (companyResult.success) {
          setCompanyData((prev) => ({ ...prev, id: companyResult.company.id }));
          await addAIMessage("✅ Company information saved successfully!");
        } else {
          alert(companyResult.error || "Failed to save company information.");
        }
      } else if (!collectingCompany && jobData && jobData.title && companyData?.id) {
        // Save job data if company is already saved
        const jobResponse = await fetch("/api/onboarding/job-position", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: jobData.title || "",
            category: "EngineeringSoftwareQA",
            yearsRequired: parseFloat(jobData.yearsRequired || 0),
            salaryMin: jobData.salaryMin ? parseInt(jobData.salaryMin) : null,
            salaryMax: jobData.salaryMax ? parseInt(jobData.salaryMax) : null,
            jobDescription: jobData.jobDescription || "",
            companyId: companyData.id,
          }),
        });

        const jobResult = await jobResponse.json();
        if (jobResult.success) {
          setJobData((prev) => ({ ...prev, id: jobResult.jobPosition.id }));
          await addAIMessage("✅ Job position information saved successfully!");
        } else {
          alert(jobResult.error || "Failed to save job position information.");
        }
      } else {
        alert("Not enough information to save yet. Please continue filling the form.");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert(`Error saving: ${error.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view on map - submit first, then navigate and zoom to job coordinates
  const handleViewOnMap = async () => {
    // Submit if not already submitted
    if (!jobData?.id || !companyData?.id) {
      await handleFinalSubmit();
    }
    if (typeof window !== "undefined" && companyData?.latitude != null && companyData?.longitude != null) {
      const lat = parseFloat(companyData.latitude);
      const lng = parseFloat(companyData.longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        sessionStorage.setItem(
          "zoomToJobCoords",
          JSON.stringify({
            lat,
            lng,
            companyName: companyData.name || companyData.company_name || "",
          })
        );
      }
    }
    router.push("/");
  };

  // Handle start next job post
  const handleStartNext = () => {
    handleResetChat();
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

    if (!jobData.title || !jobData.jobDescription) {
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
          category: "EngineeringSoftwareQA", // Default category since dropdown is removed
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

      const sid = onboardingSessionIdRef.current ?? onboardingSessionId;
      if (sid) {
        try {
          await fetch("/api/onboarding/session", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: sid,
              companyId: companyResult.company.id,
              jobPositionId: jobResult.jobPosition.id,
            }),
          });
        } catch (e) {
          console.error("Error updating session:", e);
        }
      }

      // Success!
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: `🎉 Success! Your job posting has been submitted successfully.`,
          isFinalMessage: true,
        },
      ]);
    } catch (error) {
      console.error("Submission error:", error);
      alert(`Error submitting: ${error.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };


  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div 
        className="min-h-screen relative overflow-hidden"
        style={{
          backgroundImage: 'url(/back.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#f5f5f5',
        }}
      >
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F84416] mx-auto mb-4"></div>
            <p className="text-gray-600" style={{ fontFamily: "Open Sans, sans-serif" }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show email authentication overlay (only after checking auth to avoid flash)
  if (showAuth) {
    return (
      <div 
        className="min-h-screen relative overflow-hidden"
        style={{
          backgroundImage: 'url(/back.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#f5f5f5', // Fallback color
        }}
      >
        {/* Overlay with blur */}
        <div
          className="absolute inset-0 z-10 flex items-center justify-center p-4"
          style={{
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
      className="fixed inset-0 overflow-hidden" 
      style={{ 
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100dvh',
        width: '100vw',
        margin: 0,
        padding: 0,
      }}
    >
      {/* Blurred background image layer */}
      <div 
        className="fixed z-0"
        style={{
          backgroundImage: 'url(/back.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(8px)',
          transform: 'scale(1.1)', // Scale up to avoid blur edges
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: '100dvh',
          width: '100vw',
          margin: 0,
          padding: 0,
        }}
      ></div>
      
      {/* Overlay for better readability */}
      <div 
        className="fixed z-0" 
        style={{ 
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: '100dvh',
          width: '100vw',
          margin: 0,
          padding: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(1px)',
        }}
      ></div>
      
      <div className="relative z-10 flex justify-center px-4" style={{ height: '100dvh', width: '100vw', margin: 0, padding: 0, paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
        <div className="bg-white/95 backdrop-blur-sm rounded-lg overflow-hidden border border-[#E5E5E5] shadow-lg relative w-full max-w-4xl flex flex-col" style={{ height: '100%', margin: 0, padding: 0, minHeight: 0 }}>
          {/* Header */}
          <div className="bg-white/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between border-b border-[#E5E5E5] relative z-10 flex-shrink-0">
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
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/onboarding/my-jobs");
                    const data = await res.json().catch(() => ({}));
                    const jobs = data.success ? (data.jobs || []) : [];
                    setChatMessages((prev) => [...prev, { type: "jobList", jobs }]);
                  } catch (e) {
                    console.error("Error fetching my jobs:", e);
                    setChatMessages((prev) => [...prev, { type: "jobList", jobs: [] }]);
                  }
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Your job postings"
              >
                <List size={20} style={{ color: "#575757" }} />
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
          <div className="flex-1 relative z-10 overflow-hidden">
            <ChatInterface
              messages={chatMessages}
              onSendMessage={handleChatMessage}
              isLoading={isLoading}
              inlineComponent={inlineComponent}
              typingText={isTyping ? typingText : null}
              onScrollRequest={(scrollFn) => {
                scrollToInlineRef.current = scrollFn;
              }}
              onSave={handleSave}
              onViewOnMap={handleViewOnMap}
              onStartNext={handleStartNext}
              showFindOrPostButtons={chatMessages.length === 1 && !hasChosenPostGig}
              onFindJob={handleFindJob}
              onPostGig={handlePostGig}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
