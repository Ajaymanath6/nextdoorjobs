"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { WatsonHealthRotate_360, List, UserAvatar, User, Settings, Logout, EarthFilled, Chat, ArrowLeft, Location, Notification } from "@carbon/icons-react";
import ChatInterface from "../components/Onboarding/ChatInterface";
import SettingsModal from "../components/SettingsModal";
import EmailAuthForm from "../components/Onboarding/EmailAuthForm";
import StateDistrictSelector from "../components/Onboarding/StateDistrictSelector";
import LogoPicker from "../components/Onboarding/LogoPicker";
import UrlInput from "../components/Onboarding/UrlInput";
import FundingSeriesBadges from "../components/Onboarding/FundingSeriesBadges";
import ExperienceRangeSelect from "../components/Onboarding/ExperienceRangeSelect";
import SalaryRangeBadges from "../components/Onboarding/SalaryRangeBadges";
import GetCoordinatesButton from "../components/Onboarding/GetCoordinatesButton";
import PincodeDropdown from "../components/Onboarding/PincodeDropdown";
import ServiceTypeSelector from "../components/Onboarding/ServiceTypeSelector";
import SalaryInput from "../components/Onboarding/SalaryInput";
import ExperienceInput from "../components/Onboarding/ExperienceInput";
import ProfileBubbleBackground from "../components/Onboarding/ProfileBubbleBackground";
import RecruiterChatPanel from "../components/RecruiterChatPanel";

// Field collection states
const COMPANY_FIELDS = {
  NAME: "company_name",
  LOGO: "company_logo",
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

const GIG_FIELDS = {
  TITLE: "gig_title",
  DESCRIPTION: "gig_description",
  SERVICE_TYPE: "gig_service_type",
  EXPECTED_SALARY: "gig_expected_salary",
  EXPERIENCE: "gig_experience",
  CUSTOMERS_TILL_DATE: "gig_customers_till_date",
  LOCATION: "gig_location",
  STATE: "gig_state",
  DISTRICT: "gig_district",
  PINCODE: "gig_pincode",
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut } = useClerk();
  const [showAuth, setShowAuth] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [profileUserName, setProfileUserName] = useState("Profile");
  const [profileUserEmail, setProfileUserEmail] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const languageDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

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

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    if (showUserDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserDropdown]);

  // Fetch profile (name + email from Clerk/DB) for header and dropdown
  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (data.success && data.user) {
        setProfileUserName(data.user.name || data.user.email || "Profile");
        setProfileUserEmail(data.user.email || "");
        setProfileAvatarUrl(data.user.avatarUrl || "");
      }
    } catch (_) {
      // Network or parse error: keep defaults
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileLogout = async () => {
    setShowUserDropdown(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      if (signOut) {
        await signOut({ redirectUrl: "/onboarding" });
      } else {
        window.location.href = "/onboarding";
      }
    } catch (e) {
      console.error("Logout error:", e);
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      window.location.href = "/onboarding";
    }
  };

  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [currentField, setCurrentField] = useState(GIG_FIELDS.TITLE);
  // Company flow removed - Individual-only onboarding
  const [inlineComponent, setInlineComponent] = useState(null);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasChosenPostGig, setHasChosenPostGig] = useState(false);
  const [collectingGig, setCollectingGig] = useState(false);
  const [gigData, setGigData] = useState(null);
  const [onboardingSessionId, setOnboardingSessionId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isNavigatingToMap, setIsNavigatingToMap] = useState(false);
  const [listViewActive, setListViewActive] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [activeChatConversationId, setActiveChatConversationId] = useState(null);
  const [activeChatRecruiterName, setActiveChatRecruiterName] = useState("");
  const [activeChatRecruiterEmail, setActiveChatRecruiterEmail] = useState("");
  const [activeChatRecruiterCompanyName, setActiveChatRecruiterCompanyName] = useState("");
  const onboardingSessionIdRef = useRef(null);
  const conversationOrderRef = useRef(0);
  const lastAIMessageTextRef = useRef("");
  const scrollToInlineRef = useRef(null);

  useEffect(() => {
    const checkMobile = () =>
      setIsMobile(typeof window !== "undefined" && (window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)));
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    onboardingSessionIdRef.current = onboardingSessionId;
  }, [onboardingSessionId]);

  // Read URL params: openNotifications, conversationId (from sidebar or email link)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("openNotifications") === "1") {
      setShowNotificationsPanel(true);
      setNotificationsLoading(true);
      fetch("/api/notifications", { credentials: "same-origin" })
        .then((r) => (r.ok ? r.json() : { notifications: [] }))
        .then((data) => {
          const list = Array.isArray(data.notifications) ? data.notifications : [];
          setNotifications(list);
          setNotificationCount(0);
          fetch("/api/notifications/mark-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ markAll: true }),
          }).then(() => {
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
          }).catch(() => {});
        })
        .catch(() => setNotifications([]))
        .finally(() => setNotificationsLoading(false));
    }
    const convId = params.get("conversationId");
    if (convId) {
      const id = parseInt(convId, 10);
      if (!Number.isNaN(id)) {
        setShowNotificationsPanel(true);
        setActiveChatConversationId(id);
        setNotificationsLoading(true);
        fetch("/api/notifications", { credentials: "same-origin" })
          .then((r) => (r.ok ? r.json() : { notifications: [] }))
          .then((data) => {
            const list = Array.isArray(data.notifications) ? data.notifications : [];
            setNotifications(list);
            setNotificationCount(data.unreadCount || 0);
            const notif = list.find((n) => n.conversationId === id);
            if (notif) {
              setActiveChatRecruiterName(notif.senderName || "Recruiter");
              setActiveChatRecruiterEmail(notif.senderEmail || "");
              setActiveChatRecruiterCompanyName(notif.senderOrgName || "");
            }
          })
          .catch(() => setNotifications([]))
          .finally(() => setNotificationsLoading(false));
      }
    }
  }, []);

  // Poll notification count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count", { credentials: "same-origin" });
        if (res.ok) {
          const data = await res.json();
          setNotificationCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Guard: Redirect Company users to /onboarding.org
  useEffect(() => {
    if (userData && userData.accountType === "Company") {
      router.replace("/onboarding.org");
    }
  }, [userData, router]);

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
        const displayNameForWelcome = (u) =>
          (u?.name?.trim()) || (u?.email ? u.email.split("@")[0] : "there");
        const setWelcome = (user) => {
          setUserData(user);
          // Individual-only welcome message
          const welcomeText = `Hi ${displayNameForWelcome(user)}! 👋 Welcome to mapmyGig.`;
          setChatMessages([{ type: "ai", text: welcomeText }]);
        };
        try {
          const meRes = await fetch("/api/auth/me", { credentials: "same-origin" });
          const meData = meRes.ok ? await meRes.json().catch(() => ({})) : null;
          if (meData?.success && meData.user && (meData.user.accountType == null || meData.user.accountType === "")) {
            router.replace("/who-are-you");
            return;
          }
          if (meData?.success && meData.user) {
            setWelcome(meData.user);
            return;
          }
        } catch (_) {}
        try {
          const params = new URLSearchParams({ email });
          if (clerkUser.id) params.set("clerkId", clerkUser.id);
          if (clerkUser.imageUrl) params.set("avatarUrl", clerkUser.imageUrl);
          const response = await fetch(`/api/onboarding/user?${params.toString()}`);
          const result = await response.json().catch(() => ({}));
          if (result.success && result.user) {
            if (result.user.accountType == null || result.user.accountType === "") {
              router.replace("/who-are-you");
              return;
            }
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
            // Only redirect to who-are-you if accountType is not set
            if (!createResult.user.accountType || createResult.user.accountType === "") {
              router.replace("/who-are-you");
              return;
            }
            // If accountType is already set, show welcome message
            setWelcome(createResult.user);
            return;
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

  // Restore chat state from localStorage when userData is available
  useEffect(() => {
    if (!userData) return;
    
    const userId = userData?.id || userData?.email || "anonymous";
    try {
      const saved = localStorage.getItem(`onboarding_chat_state_${userId}`);
      if (!saved) return;
      
      const state = JSON.parse(saved);
      // Only restore if same user and state is recent (within 24 hours)
      if (state.userId === userId && Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
        // Always restore saved state, regardless of current chatMessages length
        if (state.chatMessages?.length > 0) {
          setChatMessages(state.chatMessages);
        }
        if (state.hasChosenPostGig !== undefined) {
          setHasChosenPostGig(state.hasChosenPostGig);
        }
        if (state.collectingGig !== undefined) {
          setCollectingGig(state.collectingGig);
        }
        if (state.gigData) {
          setGigData(state.gigData);
        }
        if (state.currentField) {
          setCurrentField(state.currentField);
        }
        if (state.onboardingSessionId) {
          setOnboardingSessionId(state.onboardingSessionId);
        }
      }
    } catch (e) {
      console.error("Failed to restore chat state:", e);
    }
  }, [userData]);

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
        const welcomeName =
          result.user.name?.trim() ||
          (result.user.email ? result.user.email.split("@")[0] : "there");
        setChatMessages([
          {
            type: "ai",
            text: `Hi ${welcomeName}! 👋 Welcome to mapmyGig.`,
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

  // Save chat state to localStorage
  const saveChatState = () => {
    if (typeof window === "undefined") return;
    const userId = userData?.id || userData?.email || "anonymous";
    const state = {
      chatMessages,
      hasChosenPostGig,
      collectingGig,
      gigData,
      currentField,
      onboardingSessionId,
      timestamp: Date.now(),
      userId,
    };
    try {
      localStorage.setItem(`onboarding_chat_state_${userId}`, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save chat state:", e);
    }
  };

  // Reset chat function
  const handleResetChat = () => {
    setHasChosenPostGig(false);
    setCollectingGig(false);
    setGigData(null);
    setOnboardingSessionId(null);
    conversationOrderRef.current = 0;
    if (userData) {
      const welcomeName =
        userData.name?.trim() ||
        (userData.email ? userData.email.split("@")[0] : "there");
      // Individual-only welcome message
      const welcomeText = `Hi ${welcomeName}! 👋 Welcome to mapmyGig.`;
      setChatMessages([{ type: "ai", text: welcomeText }]);
    } else {
      setChatMessages([]);
    }
    setGigData(null);
    setCurrentField(GIG_FIELDS.TITLE);
    // Clear saved state
    if (typeof window !== "undefined" && userData) {
      const userId = userData?.id || userData?.email || "anonymous";
      try {
        localStorage.removeItem(`onboarding_chat_state_${userId}`);
      } catch (e) {
        console.error("Failed to clear chat state:", e);
      }
    }
  };

  // User chose "Find a job" → go to map view
  const handleFindJob = () => {
    router.push("/");
  };

  // User chose "Post a gig" (Individual only)
  const handlePostGig = async () => {
    if (!userData) return;
    if (userData.accountType !== "Individual") {
      router.replace("/onboarding.org");
      return;
    }
    if (userData.id == null && clerkUser && !clerkUser.emailAddresses?.[0]?.emailAddress) {
      alert("Please add an email to your account (Clerk settings) to post.");
      return;
    }
    setHasChosenPostGig(true);

    setCollectingGig(true);
    setGigData({});
    setCurrentField(GIG_FIELDS.TITLE);
    await addAIMessage("What's the title of your gig? (e.g. Singing, Custom purses, Teaching)");
  };

  // Extract value from message
  const extractValue = (message, fieldType) => {
    const trimmed = message.trim();
    // Remove quotes if present
    return trimmed.replace(/^["']|["']$/g, "");
  };

  // Add AI message with typing animation; optional imageUrl for logo etc.
  const addAIMessage = async (text, options = {}) => {
    const { imageUrl } = options;
    setIsTyping(true);
    setTypingText("");
    for (let i = 0; i < text.length; i++) {
      setTypingText(text.slice(0, i + 1));
      await new Promise(resolve => setTimeout(resolve, 10)); // 10ms per character (faster)
    }
    setIsTyping(false);
    lastAIMessageTextRef.current = text;
    setChatMessages((prev) => [
      ...prev,
      { type: "ai", text, ...(imageUrl && { imageUrl }) },
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

      // Individual gig flow only
      if (collectingGig) {
        const value = extractValue(message);
        switch (currentField) {
          case GIG_FIELDS.TITLE:
            setGigData((prev) => ({ ...prev, title: value }));
            await addAIMessage(`Got it! Title: "${value}". Add a short description (optional — type "skip" to skip).`);
            setCurrentField(GIG_FIELDS.DESCRIPTION);
            break;
          case GIG_FIELDS.DESCRIPTION:
            if (value.toLowerCase() !== "skip" && value) {
              setGigData((prev) => ({ ...prev, description: value }));
            }
            await addAIMessage("What type of service is this? Choose from the list or enter your own.");
            setCurrentField(GIG_FIELDS.SERVICE_TYPE);
            setInlineComponent(
              <ServiceTypeSelector
                onSelect={async (serviceType) => {
                  // Add user message showing the selection
                  setChatMessages((prev) => [...prev, { type: "user", text: serviceType }]);
                  setGigData((prev) => ({ ...prev, serviceType }));
                  setInlineComponent(null);
                  await addAIMessage("What's the expected salary for this gig?");
                  setInlineComponent(
                    <SalaryInput
                      onSubmit={async (salary) => {
                        // Add user message showing the selection
                        setChatMessages((prev) => [...prev, { type: "user", text: salary }]);
                        setGigData((prev) => ({ ...prev, expectedSalary: salary }));
                        setInlineComponent(null);
                        await addAIMessage("Tell us your years of experience with this gig.");
                        setInlineComponent(
                          <ExperienceInput
                            onSubmit={async (experience) => {
                              setGigData((prev) => ({ ...prev, experienceWithGig: experience }));
                              setInlineComponent(null);
                              await addAIMessage("How many customers have you served till date? (Number or 'skip')");
                              setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                              setIsLoading(false);
                              setTimeout(() => scrollToInlineRef.current?.(), 150);
                            }}
                            onSkip={async () => {
                              setInlineComponent(null);
                              await addAIMessage("How many customers have you served till date? (Number or 'skip')");
                              setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                              setIsLoading(false);
                              setTimeout(() => scrollToInlineRef.current?.(), 150);
                            }}
                          />
                        );
                        setCurrentField(GIG_FIELDS.EXPERIENCE);
                        setTimeout(() => scrollToInlineRef.current?.(), 150);
                      }}
                      onSkip={async () => {
                        setInlineComponent(null);
                        await addAIMessage("Tell us your years of experience with this gig.");
                        setInlineComponent(
                          <ExperienceInput
                            onSubmit={async (experience) => {
                              setGigData((prev) => ({ ...prev, experienceWithGig: experience }));
                              setInlineComponent(null);
                              await addAIMessage("How many customers have you served till date? (Number or 'skip')");
                              setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                              setIsLoading(false);
                              setTimeout(() => scrollToInlineRef.current?.(), 150);
                            }}
                            onSkip={async () => {
                              setInlineComponent(null);
                              await addAIMessage("How many customers have you served till date? (Number or 'skip')");
                              setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                              setIsLoading(false);
                              setTimeout(() => scrollToInlineRef.current?.(), 150);
                            }}
                          />
                        );
                        setCurrentField(GIG_FIELDS.EXPERIENCE);
                        setTimeout(() => scrollToInlineRef.current?.(), 150);
                      }}
                    />
                  );
                  setCurrentField(GIG_FIELDS.EXPECTED_SALARY);
                  setTimeout(() => scrollToInlineRef.current?.(), 150);
                }}
                onSkip={async () => {
                  // Add user message for skip
                  setChatMessages((prev) => [...prev, { type: "user", text: "skip" }]);
                  setInlineComponent(null);
                  await addAIMessage("What's the expected salary for this gig?");
                  setInlineComponent(
                    <SalaryInput
                      onSubmit={async (salary) => {
                        // Add user message showing the selection
                        setChatMessages((prev) => [...prev, { type: "user", text: salary }]);
                        setGigData((prev) => ({ ...prev, expectedSalary: salary }));
                        setInlineComponent(null);
                        await addAIMessage("Tell us your years of experience with this gig.");
                        setInlineComponent(
                          <ExperienceInput
                            onSubmit={async (experience) => {
                              setGigData((prev) => ({ ...prev, experienceWithGig: experience }));
                              setInlineComponent(null);
                              await addAIMessage("How many customers have you served till date? (Number or 'skip')");
                              setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                              setIsLoading(false);
                              setTimeout(() => scrollToInlineRef.current?.(), 150);
                            }}
                            onSkip={async () => {
                              setInlineComponent(null);
                              await addAIMessage("How many customers have you served till date? (Number or 'skip')");
                              setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                              setIsLoading(false);
                              setTimeout(() => scrollToInlineRef.current?.(), 150);
                            }}
                          />
                        );
                        setCurrentField(GIG_FIELDS.EXPERIENCE);
                        setTimeout(() => scrollToInlineRef.current?.(), 150);
                      }}
                      onSkip={async () => {
                        setInlineComponent(null);
                        await addAIMessage("Tell us your years of experience with this gig.");
                        setInlineComponent(
                          <ExperienceInput
                            onSubmit={async (experience) => {
                              setGigData((prev) => ({ ...prev, experienceWithGig: experience }));
                              setInlineComponent(null);
                              await addAIMessage("How many customers have you served till date? (Number or 'skip')");
                              setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                              setIsLoading(false);
                              setTimeout(() => scrollToInlineRef.current?.(), 150);
                            }}
                            onSkip={async () => {
                              setInlineComponent(null);
                              await addAIMessage("How many customers have you served till date? (Number or 'skip')");
                              setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                              setIsLoading(false);
                              setTimeout(() => scrollToInlineRef.current?.(), 150);
                            }}
                          />
                        );
                        setCurrentField(GIG_FIELDS.EXPERIENCE);
                        setTimeout(() => scrollToInlineRef.current?.(), 150);
                      }}
                    />
                  );
                  setCurrentField(GIG_FIELDS.EXPECTED_SALARY);
                  setTimeout(() => scrollToInlineRef.current?.(), 150);
                }}
              />
            );
            setTimeout(() => scrollToInlineRef.current?.(), 150);
            setIsLoading(false);
            return;
          case GIG_FIELDS.SERVICE_TYPE:
            if (value && value.trim()) {
              setGigData((prev) => ({ ...prev, serviceType: value.trim() }));
            }
            await addAIMessage("What's the expected salary for this gig?");
            setInlineComponent(
              <SalaryInput
                onSubmit={async (salary) => {
                  // Add user message showing the selection
                  setChatMessages((prev) => [...prev, { type: "user", text: salary }]);
                  setGigData((prev) => ({ ...prev, expectedSalary: salary }));
                  setInlineComponent(null);
                  await addAIMessage("Tell us your years of experience with this gig.");
                  setInlineComponent(
                    <ExperienceInput
                      onSubmit={async (experience) => {
                        setGigData((prev) => ({ ...prev, experienceWithGig: experience }));
                        setInlineComponent(null);
                        await addAIMessage("How many customers have you served till date? (Number or 'skip')");
setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                            setIsLoading(false);
                            setTimeout(() => scrollToInlineRef.current?.(), 150);
                      }}
                      onSkip={async () => {
                        setInlineComponent(null);
                        await addAIMessage("How many customers have you served till date? (Number or 'skip')");
setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                            setIsLoading(false);
                            setTimeout(() => scrollToInlineRef.current?.(), 150);
                      }}
                    />
                  );
                  setCurrentField(GIG_FIELDS.EXPECTED_SALARY);
                  setTimeout(() => scrollToInlineRef.current?.(), 150);
                }}
                onSkip={async () => {
                  // Add user message for skip
                  setChatMessages((prev) => [...prev, { type: "user", text: "skip" }]);
                  setInlineComponent(null);
                  await addAIMessage("Tell us your years of experience with this gig.");
                  setInlineComponent(
                    <ExperienceInput
                      onSubmit={async (experience) => {
                        setGigData((prev) => ({ ...prev, experienceWithGig: experience }));
                        setInlineComponent(null);
                        await addAIMessage("How many customers have you served till date? (Number or 'skip')");
setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                            setIsLoading(false);
                            setTimeout(() => scrollToInlineRef.current?.(), 150);
                      }}
                      onSkip={async () => {
                        setInlineComponent(null);
                        await addAIMessage("How many customers have you served till date? (Number or 'skip')");
setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                            setIsLoading(false);
                            setTimeout(() => scrollToInlineRef.current?.(), 150);
                      }}
                    />
                  );
                  setCurrentField(GIG_FIELDS.EXPECTED_SALARY);
                  setTimeout(() => scrollToInlineRef.current?.(), 150);
                }}
              />
            );
            setCurrentField(GIG_FIELDS.EXPECTED_SALARY);
            setTimeout(() => scrollToInlineRef.current?.(), 150);
            return;
          case GIG_FIELDS.EXPECTED_SALARY:
            if (value.toLowerCase() !== "skip" && value) {
              setGigData((prev) => ({ ...prev, expectedSalary: value }));
            }
            await addAIMessage("Tell us your years of experience with this gig.");
            setInlineComponent(
              <ExperienceInput
                onSubmit={async (experience) => {
                  setGigData((prev) => ({ ...prev, experienceWithGig: experience }));
                  setInlineComponent(null);
                  await addAIMessage("How many customers have you served till date? (Number or 'skip')");
setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                            setIsLoading(false);
                            setTimeout(() => scrollToInlineRef.current?.(), 150);
                }}
                onSkip={async () => {
                  setInlineComponent(null);
                  await addAIMessage("How many customers have you served till date? (Number or 'skip')");
setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                            setIsLoading(false);
                            setTimeout(() => scrollToInlineRef.current?.(), 150);
                }}
              />
            );
            setCurrentField(GIG_FIELDS.EXPERIENCE);
            setTimeout(() => scrollToInlineRef.current?.(), 150);
            setIsLoading(false);
            return;
          case GIG_FIELDS.EXPERIENCE:
            if (value.toLowerCase() !== "skip" && value) {
              setGigData((prev) => ({ ...prev, experienceWithGig: value }));
            }
            await addAIMessage("How many customers have you served till date? (Number or 'skip')");
            setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
            setIsLoading(false);
            return;
          case GIG_FIELDS.CUSTOMERS_TILL_DATE: {
            if (value.toLowerCase() !== "skip" && value) {
              const num = parseInt(value.replace(/\D/g, ""), 10);
              if (!Number.isNaN(num) && num >= 0) {
                setGigData((prev) => ({ ...prev, customersTillDate: num }));
              }
            }
            await addAIMessage("Where are you located? You can get coordinates, enter them manually, or skip and choose state/district.");
            setCurrentField(GIG_FIELDS.LOCATION);
            setInlineComponent(
              <GetCoordinatesButton
                isMobile={isMobile}
                onCoordinatesReceived={(lat, lon) => {
                  setGigData((prev) => ({ ...prev, latitude: lat, longitude: lon }));
                  setInlineComponent(null);
                  handleGigCoordinatesReceived(lat, lon);
                }}
                onSkip={() => {
                  setInlineComponent(null);
                  handleGigLocationSkipped();
                }}
              />
            );
            setTimeout(() => scrollToInlineRef.current?.(), 150);
            break;
          }
          case GIG_FIELDS.LOCATION:
            break;
          case GIG_FIELDS.STATE:
            break;
          case GIG_FIELDS.DISTRICT:
            break;
          case GIG_FIELDS.PINCODE:
            if (value.toLowerCase() !== "skip" && value) {
              setGigData((prev) => ({ ...prev, pincode: value }));
            }
            await handleGigSubmit();
            break;
          default:
            break;
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
    }, 500);
  };

  // Handle logo selected
  const handleLogoSelected = async (file, previewUrl) => {
    await saveConversation(COMPANY_FIELDS.LOGO, lastAIMessageTextRef.current, "logo");
    setIsLoading(true);
    await addAIMessage("Logo added.", { imageUrl: previewUrl });
    await addAIMessage("What state is your company located in?");
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
    setIsLoading(false);
    setTimeout(() => scrollToInlineRef.current?.(), 150);
  };

  // Handle logo skipped
  const handleLogoSkipped = async () => {
    await saveConversation(COMPANY_FIELDS.LOGO, lastAIMessageTextRef.current, "skip");
    setIsLoading(true);
    await addAIMessage("No problem! What state is your company located in?");
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
    setIsLoading(false);
    setTimeout(() => scrollToInlineRef.current?.(), 150);
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
        selectedState={state}
        showDistrict={true}
      />
    );
    setIsLoading(false);
    setTimeout(() => scrollToInlineRef.current?.(), 150);
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
      try {
        const res = await fetch(
          `/api/onboarding/company-from-url?url=${encodeURIComponent(url)}`
        );
        if (res.ok) {
          const data = await res.json();
          const hasAll =
            data.state &&
            data.district &&
            typeof data.latitude === "number" &&
            typeof data.longitude === "number";
          if (hasAll) {
            setCompanyData((prev) => ({
              ...prev,
              state: data.state,
              district: data.district,
              latitude: String(data.latitude),
              longitude: String(data.longitude),
              ...(data.pincode && { pincode: data.pincode }),
            }));
            await addAIMessage(
              `We found your company location from your website: ${data.district}, ${data.state}. Coordinates saved. What's your funding series?`
            );
          } else {
            await addAIMessage(`Website noted: ${url}. What's your funding series?`);
          }
        } else {
          await addAIMessage(`Website noted: ${url}. What's your funding series?`);
        }
      } catch (_) {
        await addAIMessage(`Website noted: ${url}. What's your funding series?`);
      }
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
    // If we already have coordinates (e.g. from company URL fetch), skip GetCoordinatesButton
    if (companyData?.latitude != null && companyData?.longitude != null) {
      await handleCoordinatesReceived(companyData.latitude, companyData.longitude);
      return;
    }
    setInlineComponent(
      <GetCoordinatesButton
        isMobile={isMobile}
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

  // Handle pincode selected from dropdown (or skip)
  const handlePincodeChosen = async (pincode) => {
    const answerText = pincode || "skip";
    await saveConversation(COMPANY_FIELDS.PINCODE, lastAIMessageTextRef.current, answerText);
    if (pincode) {
      setCompanyData((prev) => ({ ...prev, pincode }));
    }
    setInlineComponent(null);
    setCollectingCompany(false);
    setCurrentField(JOB_FIELDS.TITLE);
    setIsLoading(true);
    await addAIMessage(
      pincode
        ? `Pincode: ${pincode}. Excellent! Company information collected. Now let's add the job position details. What's the job title?`
        : `No problem! Excellent! Company information collected. Now let's add the job position details. What's the job title?`
    );
    setIsLoading(false);
  };

  const handleGigLocationSkipped = async () => {
    setIsLoading(true);
    await addAIMessage("Which state are you in?");
    setCurrentField(GIG_FIELDS.STATE);
    setInlineComponent(
      <StateDistrictSelector
        onStateSelect={(state) => {
          setGigData((prev) => ({ ...prev, state }));
          setInlineComponent(null);
          handleGigStateSelected(state);
        }}
        selectedState={gigData?.state}
      />
    );
    setIsLoading(false);
    setTimeout(() => scrollToInlineRef.current?.(), 150);
  };

  const handleGigCoordinatesReceived = async (lat, lon) => {
    setIsLoading(true);
    await addAIMessage(`Coordinates received: ${Number(lat).toFixed(6)}, ${Number(lon).toFixed(6)}`);
    let state = null;
    let district = null;
    let postcode = null;
    try {
      const res = await fetch(
        `/api/geocode/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
      );
      if (res.ok) {
        const data = await res.json();
        state = data.state ?? null;
        district = data.district ?? null;
        postcode = data.postcode ?? null;
      }
    } catch (_) {}
    if (state) setGigData((prev) => ({ ...prev, state }));
    if (district) setGigData((prev) => ({ ...prev, district }));

    // Show location summary
    if (district && state) {
      await addAIMessage(`District: ${district}, State: ${state}`);
    } else if (state) {
      await addAIMessage(`State: ${state}`);
    }

    if (state && district) {
      let pincodes = [];
      try {
        const pinRes = await fetch(
          `/api/pincodes/by-district?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`
        );
        if (pinRes.ok) {
          const { pincodes: list } = await pinRes.json();
          pincodes = Array.isArray(list) ? list.slice(0, 8) : [];
        }
      } catch (_) {}
      if (postcode && !pincodes.includes(postcode)) {
        pincodes = [postcode, ...pincodes].slice(0, 8);
      }
      await addAIMessage(pincodes.length ? "What's your pincode? (Choose one or skip)" : "What's your pincode? (Type pincode or \"skip\")");
      setCurrentField(GIG_FIELDS.PINCODE);
      if (pincodes.length > 0) {
        setInlineComponent(
          <PincodeDropdown
            pincodes={pincodes}
            onSelect={(pincode) => {
              setChatMessages((prev) => [...prev, { type: "user", text: pincode }]);
              setGigData((prev) => ({ ...prev, pincode, latitude: Number(lat), longitude: Number(lon) }));
              setInlineComponent(null);
              handleGigSubmit({ pincode, state, district, latitude: Number(lat), longitude: Number(lon) });
            }}
            onSkip={() => {
              setChatMessages((prev) => [...prev, { type: "user", text: "skip" }]);
              setGigData((prev) => ({ ...prev, latitude: Number(lat), longitude: Number(lon) }));
              setInlineComponent(null);
              handleGigSubmit({ state, district, latitude: Number(lat), longitude: Number(lon) });
            }}
          />
        );
        setTimeout(() => scrollToInlineRef.current?.(), 150);
      }
    } else if (state) {
      await addAIMessage(`State: ${state}. Which district?`);
      setCurrentField(GIG_FIELDS.DISTRICT);
      setInlineComponent(
        <StateDistrictSelector
          onDistrictSelect={(district) => {
            setGigData((prev) => ({ ...prev, district }));
            setInlineComponent(null);
            handleGigDistrictSelected(district);
          }}
          selectedDistrict={gigData?.district}
          selectedState={state}
          showDistrict={true}
        />
      );
      setTimeout(() => scrollToInlineRef.current?.(), 150);
    } else {
      await addAIMessage("Which state are you in?");
      setCurrentField(GIG_FIELDS.STATE);
      setInlineComponent(
        <StateDistrictSelector
          onStateSelect={(state) => {
            setGigData((prev) => ({ ...prev, state }));
            setInlineComponent(null);
            handleGigStateSelected(state);
          }}
          selectedState={gigData?.state}
        />
      );
      setTimeout(() => scrollToInlineRef.current?.(), 150);
    }
    setIsLoading(false);
  };

  const handleGigStateSelected = async (state) => {
    setIsLoading(true);
    await addAIMessage(`State: ${state}. Which district?`);
    setCurrentField(GIG_FIELDS.DISTRICT);
    setInlineComponent(
      <StateDistrictSelector
        onDistrictSelect={(district) => {
          setGigData((prev) => ({ ...prev, district }));
          setInlineComponent(null);
          handleGigDistrictSelected(district);
        }}
        selectedDistrict={gigData?.district}
        selectedState={state}
        showDistrict={true}
      />
    );
    setIsLoading(false);
    setTimeout(() => scrollToInlineRef.current?.(), 150);
  };

  const handleGigDistrictSelected = async (district) => {
    setIsLoading(true);
    let pincodes = [];
    try {
      const state = gigData?.state || "";
      const pinRes = await fetch(
        `/api/pincodes/by-district?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`
      );
      if (pinRes.ok) {
        const { pincodes: list } = await pinRes.json();
        pincodes = Array.isArray(list) ? list.slice(0, 8) : [];
      }
    } catch (_) {}
    await addAIMessage(pincodes.length ? "What's your pincode? (Choose one or skip)" : "What's your pincode? (Type pincode or \"skip\")");
    setCurrentField(GIG_FIELDS.PINCODE);
    if (pincodes.length > 0) {
      setInlineComponent(
        <PincodeDropdown
          pincodes={pincodes}
          onSelect={(pincode) => {
            setChatMessages((prev) => [...prev, { type: "user", text: pincode }]);
            setGigData((prev) => ({ ...prev, pincode }));
            setInlineComponent(null);
            handleGigSubmit({ pincode });
          }}
          onSkip={() => {
            setChatMessages((prev) => [...prev, { type: "user", text: "skip" }]);
            setInlineComponent(null);
            handleGigSubmit({});
          }}
        />
      );
      setTimeout(() => scrollToInlineRef.current?.(), 150);
    }
    setIsLoading(false);
  };

  const handleGigSubmit = async (overrides = {}) => {
    const g = { ...gigData, ...overrides };
    const hasTitle = Boolean(g?.title?.trim());
    const hasServiceType = Boolean(g?.serviceType?.trim());
    const hasStateDistrict = Boolean(g?.state?.trim() && g?.district?.trim());
    let latitude = g.latitude != null && Number.isFinite(Number(g.latitude)) ? Number(g.latitude) : null;
    let longitude = g.longitude != null && Number.isFinite(Number(g.longitude)) ? Number(g.longitude) : null;
    const hasCoords = latitude != null && longitude != null;

    if (!hasTitle || !hasServiceType) {
      setChatMessages((prev) => [
        ...prev,
        { type: "ai", text: "Please complete title and service type. You can try again." },
      ]);
      setIsLoading(false);
      return;
    }
    if (!hasStateDistrict && !hasCoords) {
      setChatMessages((prev) => [
        ...prev,
        { type: "ai", text: "Please complete state and district, or set your location (coordinates). You can try again." },
      ]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      if (latitude == null && longitude == null && g.pincode) {
        try {
          const res = await fetch(`/api/pincodes/by-pincode?pincode=${encodeURIComponent(g.pincode)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.pincode?.latitude != null && data.pincode?.longitude != null) {
              latitude = data.pincode.latitude;
              longitude = data.pincode.longitude;
            }
          }
        } catch (_) {}
      }
      const response = await fetch("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: g.title.trim(),
          description: g.description?.trim() || undefined,
          serviceType: g.serviceType.trim(),
          expectedSalary: g.expectedSalary?.trim() || undefined,
          experienceWithGig: g.experienceWithGig?.trim() || undefined,
          customersTillDate: typeof g.customersTillDate === "number" && g.customersTillDate >= 0 ? g.customersTillDate : undefined,
          state: (g.state || "").trim(),
          district: (g.district || "").trim(),
          pincode: g.pincode?.trim() || undefined,
          locality: g.locality?.trim() || undefined,
          latitude,
          longitude,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (result.success && result.gig) {
        setCollectingGig(false);
        setGigData(null);
        setCurrentField(COMPANY_FIELDS.NAME);
        setChatMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: "🎉 Your gig has been posted! You can view it on the map in the \"Gig workers\" view.",
            isFinalMessage: true,
            isGigSuccess: true,
          },
        ]);
        if (result.gig.latitude != null && result.gig.longitude != null && typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(
            "zoomToGigCoords",
            JSON.stringify({
              lat: result.gig.latitude,
              lng: result.gig.longitude,
              view: "gig_workers",
              state: result.gig.state || null,
              district: result.gig.district || null,
            })
          );
        }
      } else {
        setChatMessages((prev) => [
          ...prev,
          { type: "ai", text: `Sorry, we couldn't post your gig. ${result.error || "Please try again."}` },
        ]);
      }
    } catch (err) {
      console.error("Gig submit error:", err);
      setChatMessages((prev) => [
        ...prev,
        { type: "ai", text: `Something went wrong. ${err?.message || "Please try again."}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle coordinates received
  const handleCoordinatesReceived = async (lat, lon) => {
    const answerText = lat && lon ? `${lat}, ${lon}` : "skip";
    await saveConversation(COMPANY_FIELDS.LOCATION, lastAIMessageTextRef.current, answerText);
    setIsLoading(true);
    if (lat && lon) {
      let coordsLine = `Coordinates saved: ${lat}, ${lon}`;
      let state = null;
      let district = null;
      let postcode = null;
      try {
        const res = await fetch(
          `/api/geocode/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
        );
        if (res.ok) {
          const data = await res.json();
          state = data.state ?? null;
          district = data.district ?? null;
          postcode = data.postcode ?? null;
          if (district || state) {
            const parts = [district, state].filter(Boolean);
            coordsLine += ` • ${parts.join(", ")}`;
          }
        }
      } catch (_) {
        // Keep coordinates-only message on failure
      }
      await addAIMessage(`${coordsLine}.`);

      let pincodes = [];
      if (district && state) {
        try {
          const pinRes = await fetch(
            `/api/pincodes/by-district?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`
          );
          if (pinRes.ok) {
            const { pincodes: list } = await pinRes.json();
            pincodes = Array.isArray(list) ? list.slice(0, 4) : [];
          }
        } catch (_) {}
      }
      if (postcode && !pincodes.includes(postcode)) {
        pincodes = [postcode, ...pincodes].slice(0, 4);
      }

      if (pincodes.length > 0) {
        await addAIMessage(`What's the pincode? (Choose one or skip)`);
        setCurrentField(COMPANY_FIELDS.PINCODE);
        setInlineComponent(
          <PincodeDropdown
            pincodes={pincodes}
            onSelect={(pincode) => handlePincodeChosen(pincode)}
            onSkip={() => handlePincodeChosen(null)}
          />
        );
      } else {
        await addAIMessage(`What's the pincode? (Type "skip" if not available)`);
        setCurrentField(COMPANY_FIELDS.PINCODE);
      }
    } else {
      await addAIMessage(`No problem! What's the pincode? (Type "skip" if not available)`);
      setCurrentField(COMPANY_FIELDS.PINCODE);
    }
    setIsLoading(false);
  };

  // Handle salary selection
  const handleExperienceSelected = async (years) => {
    await saveConversation(JOB_FIELDS.YEARS, lastAIMessageTextRef.current, String(years));
    setIsLoading(true);
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
    setIsLoading(false);
  };

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
          setCompanyData((prev) => ({
            ...prev,
            id: companyResult.company.id,
            logoPath: companyResult.company.logoPath ?? prev.logoPath,
          }));
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

  // Handle view on map - submit first, then pass coordinates to map and show pindrop.
  // If submit fails we still navigate with coords when we have them so the pin always shows (user can retry save from chat).
  const handleViewOnMap = async () => {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("zoomToGigCoords")) {
      router.push("/");
      return;
    }
    const needSubmit = !jobData?.id || !companyData?.id;
    let submittedCompany = null;
    if (needSubmit) {
      submittedCompany = await handleFinalSubmit();
    }
    // Prefer coordinates from submitted company (authoritative after submit); else use companyData
    const source = submittedCompany?.company ?? companyData;
    const latVal = source?.latitude != null ? source.latitude : companyData?.latitude;
    const lngVal = source?.longitude != null ? source.longitude : companyData?.longitude;
    const hasCoords =
      latVal != null &&
      lngVal != null &&
      !Number.isNaN(parseFloat(latVal)) &&
      !Number.isNaN(parseFloat(lngVal));
    if (typeof window !== "undefined" && hasCoords) {
      const lat = parseFloat(latVal);
      const lng = parseFloat(lngVal);
      const companyName =
        submittedCompany?.company?.name ??
        companyData?.name ??
        companyData?.company_name ??
        "";
      let logoUrl =
        submittedCompany?.company?.logoPath ?? companyData?.logoPath ?? null;
      if (!logoUrl && companyData?.id) {
        try {
          const res = await fetch(`/api/onboarding/company/${companyData.id}`);
          if (res.ok) {
            const data = await res.json();
            logoUrl = data.company?.logoPath ?? null;
          }
        } catch (_) {}
      }
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const resolvedLogoUrl =
        logoUrl && !logoUrl.startsWith("http")
          ? `${baseUrl}${logoUrl.startsWith("/") ? "" : "/"}${logoUrl}`
          : logoUrl;
      sessionStorage.setItem(
        "zoomToJobCoords",
        JSON.stringify({
          lat,
          lng,
          companyName: companyName || "Your posting",
          ...(resolvedLogoUrl && { logoUrl: resolvedLogoUrl }),
        })
      );
    }
    setIsNavigatingToMap(true);
    setTimeout(() => {
      router.push("/");
    }, 2000);
  };

  // Handle start next job post
  const handleStartNext = () => {
    handleResetChat();
  };

  // Ensure we have a valid user id (fetch from API if we have Clerk user but id was null)
  const ensureUserId = async () => {
    if (userData?.id != null) return userData.id;
    if (!clerkUser?.emailAddresses?.[0]?.emailAddress) return null;
    const email = clerkUser.emailAddresses[0].emailAddress;
    const name =
      clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.firstName || clerkUser.username || "User";
    try {
      let res = await fetch(
        `/api/onboarding/user?${new URLSearchParams({ email }).toString()}`
      );
      let data = await res.json().catch(() => ({}));
      if (data.success && data.user?.id) {
        setUserData((prev) => (prev ? { ...prev, id: data.user.id } : data.user));
        return data.user.id;
      }
      res = await fetch("/api/onboarding/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          clerkId: clerkUser.id,
          avatarUrl: clerkUser.imageUrl || undefined,
        }),
      });
      data = await res.json().catch(() => ({}));
      if (data.success && data.user?.id) {
        setUserData((prev) => (prev ? { ...prev, id: data.user.id } : data.user));
        return data.user.id;
      }
    } catch (_) {}
    return null;
  };

  const fetchWithRetry = async (url, options, retries = 2) => {
    let lastError;
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(url, options);
        const text = await res.text();
        let data;
        try {
          data = text ? JSON.parse(text) : {};
        } catch (_) {
          data = { success: false, error: res.ok ? "Invalid response" : `Request failed (${res.status})` };
        }
        return { response: res, data };
      } catch (e) {
        lastError = e;
        if (i < retries) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
      }
    }
    throw lastError || new Error("Network error");
  };

  // Handle final submission – normalized payloads, user fallback, retries, logo fallback
  const handleFinalSubmit = async () => {
    if (!companyData || !jobData) {
      alert("Missing required data. Please go back and complete all steps.");
      return null;
    }

    const name = String(companyData.name || "").trim();
    const state = String(companyData.state || "").trim();
    const district = String(companyData.district || "").trim();
    if (!name || !state || !district) {
      alert("Please complete all required company information (name, state, district).");
      return null;
    }

    const title = String(jobData.title || "").trim();
    const jobDescription = String(jobData.jobDescription || "").trim();
    if (!title || !jobDescription) {
      alert("Please complete all required job position information (title, description).");
      return null;
    }

    const userId = await ensureUserId();
    if (userId == null) {
      alert("Please sign in and try again.");
      return null;
    }

    setIsLoading(true);

    try {
      const lat =
        companyData.latitude != null && !Number.isNaN(parseFloat(companyData.latitude))
          ? parseFloat(companyData.latitude)
          : null;
      const lon =
        companyData.longitude != null && !Number.isNaN(parseFloat(companyData.longitude))
          ? parseFloat(companyData.longitude)
          : null;
      const yearsRequired = Math.max(
        0,
        Number.isNaN(parseFloat(jobData.yearsRequired)) ? 0 : parseFloat(jobData.yearsRequired)
      );
      let salaryMin =
        jobData.salaryMin != null && jobData.salaryMin !== ""
          ? parseInt(jobData.salaryMin, 10)
          : null;
      let salaryMax =
        jobData.salaryMax != null && jobData.salaryMax !== ""
          ? parseInt(jobData.salaryMax, 10)
          : null;
      if (salaryMin != null && (Number.isNaN(salaryMin) || salaryMin < 0)) salaryMin = null;
      if (salaryMax != null && (Number.isNaN(salaryMax) || salaryMax < 0)) salaryMax = null;
      if (salaryMin != null && salaryMax != null && salaryMin > salaryMax) salaryMax = salaryMin;

      let companyResult = null;
      let includeLogo = Boolean(companyData.logo);

      for (let attempt = 0; attempt <= 1; attempt++) {
        const companyFormData = new FormData();
        companyFormData.append("name", name);
        if (includeLogo && companyData.logo) {
          companyFormData.append("logo", companyData.logo);
        }
        if (companyData.websiteUrl) {
          companyFormData.append("websiteUrl", String(companyData.websiteUrl).trim());
        }
        if (companyData.fundingSeries) {
          companyFormData.append("fundingSeries", companyData.fundingSeries);
        }
        if (lat != null) companyFormData.append("latitude", String(lat));
        if (lon != null) companyFormData.append("longitude", String(lon));
        companyFormData.append("state", state);
        companyFormData.append("district", district);
        if (companyData.pincode) {
          companyFormData.append("pincode", String(companyData.pincode).trim());
        }
        companyFormData.append("userId", String(userId));

        const { response: companyResponse, data: companyDataRes } = await fetchWithRetry(
          "/api/onboarding/company",
          { method: "POST", body: companyFormData }
        );
        companyResult = companyDataRes;

        if (companyResult.success && companyResult.company) break;
        // In development, prefer API details (e.g. Prisma message) for debugging
        const errorMessage = companyResult.details || companyResult.error || "Failed to create company";
        if (process.env.NODE_ENV === "development" && companyResult.details) {
          console.error("Company API error:", companyResult.details, companyResult);
        }
        // Only retry without logo on server error (5xx), not on 400 – so we don't lose the uploaded logo
        if (companyResponse.status >= 500 && attempt === 0) {
          includeLogo = false;
          continue;
        }
        throw new Error(errorMessage);
      }

      if (!companyResult?.success || !companyResult?.company?.id) {
        const err = companyResult?.details || companyResult?.error || "Failed to create company";
        throw new Error(err);
      }

      const jobPayload = {
        title,
        category: "EngineeringSoftwareQA",
        yearsRequired,
        salaryMin,
        salaryMax,
        jobDescription,
        companyId: companyResult.company.id,
      };

      const { response: jobResponse, data: jobResult } = await fetchWithRetry(
        "/api/onboarding/job-position",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobPayload),
        }
      );

      if (!jobResult.success || !jobResult.jobPosition?.id) {
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

      setCompanyData((prev) => ({
        ...prev,
        id: companyResult.company.id,
        logoPath: companyResult.company.logoPath ?? prev.logoPath,
      }));
      setJobData((prev) => ({ ...prev, id: jobResult.jobPosition.id }));
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: `🎉 Success! Your job posting has been submitted successfully.`,
          isFinalMessage: true,
        },
      ]);
      return { company: companyResult.company, job: jobResult.jobPosition };
    } catch (error) {
      console.error("Submission error:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: `Sorry, we couldn’t submit your posting right now. Please try again. (${error?.message || "Unknown error"})`,
          isFinalMessage: false,
        },
      ]);
      return null;
    } finally {
      setIsLoading(false);
    }
  };


  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div
        className="min-h-screen relative overflow-hidden bg-brand-bg-fill bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/back.png)" }}
      >
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="rounded-full h-12 w-12 border-4 border-brand-stroke-weak border-t-brand loading-spinner mx-auto mb-4" />
            <p className="text-brand-text-weak font-sans">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show email authentication overlay (only after checking auth to avoid flash)
  if (showAuth) {
    return (
      <div className="fixed inset-0 w-full h-full overflow-hidden bg-brand-bg-fill bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url(/back.png)" }}>
        {/* Animated bubble background above the image */}
        <ProfileBubbleBackground />
        
        {/* Sign-up modal overlay */}
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
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

      {/* 2s loader when navigating to map */}
      {isNavigatingToMap && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 font-sans">
          <div className="rounded-full h-12 w-12 border-4 border-brand-stroke-weak border-t-brand loading-spinner mx-auto mb-4" />
          <p className="text-brand-text-weak font-medium">Taking you to the map…</p>
        </div>
      )}
      
      <div className="relative z-10 flex justify-center px-4 h-[100dvh] w-screen m-0 p-0 pb-[env(safe-area-inset-bottom,0)]">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg overflow-visible border border-brand-stroke-weak shadow-lg relative w-full max-w-[61rem] flex flex-col h-full m-0 p-0 min-h-0">
          {/* Header - overflow-visible and high z so dropdowns overlay chat */}
          <div className="bg-white/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between border-b border-brand-stroke-weak relative z-30 flex-shrink-0 overflow-visible">
            <div className="flex items-center gap-3">
              {/* Globe | Chat toggle - straight line, two options side by side */}
              <div className="flex items-center bg-brand-bg-white border border-brand-stroke-weak overflow-hidden rounded-full shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    saveChatState();
                    router.push("/");
                  }}
                  aria-label="Map view"
                  className="flex items-center gap-1.5 px-3 py-2 border-0 rounded-l-md rounded-r-none bg-transparent hover:bg-brand-bg-fill transition-colors"
                >
                  <ArrowLeft size={16} className="w-4 h-4 shrink-0 text-brand-text-weak" />
                  <EarthFilled size={20} className="w-5 h-5 shrink-0 text-brand-text-weak" />
                  <span className="text-sm font-medium text-brand-text-weak">Map</span>
                </button>
                <button
                  type="button"
                  aria-label="Chat"
                  className="flex items-center gap-1.5 px-3 py-2 border-0 rounded-r-md rounded-l-none bg-brand/10 transition-colors"
                >
                  <Chat size={20} className="w-5 h-5 shrink-0 text-brand" />
                  <span className="text-sm font-medium text-brand">Chat</span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetChat}
                className="p-2 rounded-lg hover:bg-brand-bg-fill transition-colors"
                title="Restart chat"
              >
                <WatsonHealthRotate_360 size={20} className="text-brand-text-weak" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (listViewActive) {
                    // Back to chat: remove list view and remove the last list message
                    setListViewActive(false);
                    setChatMessages((prev) => {
                      const lastIndex = prev.map((m, i) =>
                        (m.type === "gigList" || m.type === "jobList") ? i : -1
                      ).filter((i) => i >= 0).pop();
                      if (lastIndex == null) return prev;
                      return prev.filter((_, i) => i !== lastIndex);
                    });
                    return;
                  }
                  // Switch to list view - fetch and show list
                  setListViewActive(true);
                  try {
                    if (userData?.accountType === "Individual") {
                      const res = await fetch("/api/gigs?mine=1", { credentials: "same-origin" });
                      const data = await res.json().catch(() => ({}));
                      const gigs = data.success ? (data.gigs || []) : [];
                      setChatMessages((prev) => [...prev, { type: "gigList", gigs }]);
                    } else {
                      const res = await fetch("/api/onboarding/my-jobs");
                      const data = await res.json().catch(() => ({}));
                      const jobs = data.success ? (data.jobs || []) : [];
                      setChatMessages((prev) => [...prev, { type: "jobList", jobs }]);
                    }
                  } catch (e) {
                    console.error("Error fetching list:", e);
                    if (userData?.accountType === "Individual") {
                      setChatMessages((prev) => [...prev, { type: "gigList", gigs: [] }]);
                    } else {
                      setChatMessages((prev) => [...prev, { type: "jobList", jobs: [] }]);
                    }
                  }
                }}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg border border-brand-stroke-border transition-colors ${listViewActive ? "bg-brand-bg-fill" : "bg-brand-bg-white hover:bg-brand-bg-fill"}`}
                title={listViewActive ? "Back to chat" : (userData?.accountType === "Individual" ? "Your posted gigs" : "Your job postings")}
              >
                {listViewActive ? (
                  <Chat size={20} className="text-brand-text-strong shrink-0" />
                ) : (
                  <List size={20} className="text-brand-text-strong shrink-0" />
                )}
                <span className="text-sm font-medium text-brand-text-strong whitespace-nowrap">
                  {listViewActive ? "Back to chat" : (userData?.accountType === "Individual" ? "Your posted gigs" : "Your job postings")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNotificationsPanel(true);
                  setNotificationsLoading(true);
                  fetch("/api/notifications", { credentials: "same-origin" })
                    .then((r) => (r.ok ? r.json() : { notifications: [] }))
                    .then((data) => {
                      const list = Array.isArray(data.notifications) ? data.notifications : [];
                      setNotifications(list);
                      setNotificationCount(0);
                      fetch("/api/notifications/mark-read", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "same-origin",
                        body: JSON.stringify({ markAll: true }),
                      }).then(() => {
                        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                      }).catch(() => {});
                    })
                    .catch(() => setNotifications([]))
                    .finally(() => setNotificationsLoading(false));
                }}
                className="p-2 rounded-lg hover:bg-brand-bg-fill transition-colors relative"
                title="Notifications"
              >
                <Notification size={20} className="text-brand-text-weak" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1" style={{ fontSize: "10px" }}>
                    {notificationCount}
                  </span>
                )}
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
              {/* User profile - same pattern as Sidebar */}
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(!showUserDropdown);
                    if (!showUserDropdown) fetchProfile();
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center shrink-0"
                  aria-label="Profile menu"
                  title={profileUserEmail || profileUserName}
                >
                  {profileAvatarUrl ? (
                    <img
                      src={profileAvatarUrl}
                      alt="Profile"
                      className="h-8 w-8 rounded-full object-cover border border-brand-stroke-weak"
                    />
                  ) : (
                    <UserAvatar size={24} className="text-brand-stroke-strong" />
                  )}
                </button>
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 min-w-[16rem] max-w-[24rem] w-max bg-white border border-brand-stroke-weak rounded-lg shadow-lg z-[200]">
                    <div className="p-2">
                      <div className="flex items-center gap-2 px-4 py-2 text-sm text-brand-text-strong break-all border-b border-brand-stroke-weak mb-1" title={profileUserEmail || "Signed in"}>
                        <User size={20} className="shrink-0 text-brand-stroke-strong" />
                        <span>{profileUserEmail || "Signed in"}</span>
                      </div>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2 text-brand-text-strong hover:bg-brand-bg-fill rounded transition-colors flex items-center gap-2"
                        onClick={() => {
                          setShowUserDropdown(false);
                          setShowSettingsModal(true);
                        }}
                      >
                        <Settings size={20} className="text-brand-stroke-strong" />
                        <span>Settings</span>
                      </button>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2 text-brand-text-strong hover:bg-brand-bg-fill rounded transition-colors flex items-center gap-2"
                        onClick={() => {
                          setShowUserDropdown(false);
                          if (typeof sessionStorage !== "undefined") sessionStorage.setItem("locateMeOnMap", "1");
                          router.push("/");
                        }}
                      >
                        <Location size={20} className="text-brand-stroke-strong" />
                        <span>Locate me on map</span>
                      </button>
                      <div className="border-t border-brand-stroke-weak my-1" />
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2 text-brand-text-strong hover:bg-brand-bg-fill rounded transition-colors flex items-center gap-2"
                        onClick={handleProfileLogout}
                      >
                        <Logout size={20} className="text-brand-stroke-strong" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content - Chat interface, or notifications panel, or recruiter chat panel */}
          <div className="flex-1 relative z-10 overflow-hidden rounded-b-lg min-h-0">
            {activeChatConversationId ? (
              <RecruiterChatPanel
                conversationId={activeChatConversationId}
                otherPartyName={activeChatRecruiterName}
                otherPartyEmail={activeChatRecruiterEmail}
                otherPartyCompanyName={activeChatRecruiterCompanyName}
                onClose={() => {
                  setActiveChatConversationId(null);
                  setActiveChatRecruiterName("");
                  setActiveChatRecruiterEmail("");
                  setActiveChatRecruiterCompanyName("");
                }}
                onNotificationCountChange={(count) => setNotificationCount(count)}
              />
            ) : showNotificationsPanel ? (
              <div className="h-full flex flex-col bg-white">
                <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowNotificationsPanel(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-brand-text-strong"
                    aria-label="Back"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h2 className="text-lg font-semibold text-brand-text-strong">Notifications</h2>
                  <div className="w-10"></div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                  {notificationsLoading ? (
                    <p className="text-sm text-brand-text-weak">Loading…</p>
                  ) : notifications.length === 0 ? (
                    <p className="text-sm text-brand-text-weak">No notifications yet.</p>
                  ) : (
                    <ul className="space-y-0">
                      {notifications.map((notif) => (
                        <li
                          key={notif.id}
                          className="flex flex-col gap-1 p-3 border-b border-[#E5E5E5] hover:bg-gray-50 cursor-pointer last:border-b-0"
                          onClick={async () => {
                            try {
                              await fetch("/api/notifications/mark-read", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "same-origin",
                                body: JSON.stringify({ notificationIds: [notif.id] }),
                              });
                              setNotifications((prev) =>
                                prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
                              );
                              setNotificationCount((prev) => Math.max(0, prev - 1));
                              if (notif.conversationId) {
                                setActiveChatConversationId(notif.conversationId);
                                setActiveChatRecruiterName(notif.senderName || "Recruiter");
                                setActiveChatRecruiterEmail(notif.senderEmail || "");
                                setActiveChatRecruiterCompanyName(notif.senderOrgName || "");
                              }
                            } catch (error) {
                              console.error("Error marking notification as read:", error);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-brand-text-strong min-w-0">{notif.title}</span>
                            {notif.senderEmail && (
                              <span className="text-xs text-brand-text-weak shrink-0">{notif.senderEmail}</span>
                            )}
                            {!notif.isRead && (
                              <span className="w-2 h-2 bg-brand rounded-full shrink-0 mt-1.5" />
                            )}
                          </div>
                          <span className="text-sm text-brand-text-weak">{notif.message}</span>
                          {notif.senderOrgName && (
                            <span className="text-xs text-brand-text-weak">From: {notif.senderOrgName}</span>
                          )}
                          <span className="text-xs text-brand-text-weak">
                            {new Date(notif.createdAt).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
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
              accountType={userData?.accountType}
              onFindJob={handleFindJob}
              onPostGig={handlePostGig}
              onGigDeleted={async () => {
                try {
                  const res = await fetch("/api/gigs?mine=1", { credentials: "same-origin" });
                  const data = await res.json().catch(() => ({}));
                  const gigs = data.success ? (data.gigs || []) : [];
                  setChatMessages((prev) => {
                    const idx = prev.map((m, i) => (m.type === "gigList" ? i : -1)).filter((i) => i >= 0).pop();
                    if (idx == null) return prev;
                    const next = [...prev];
                    next[idx] = { type: "gigList", gigs };
                    return next;
                  });
                } catch (e) {
                  console.error("Error refreshing gig list:", e);
                }
              }}
              onGigEdited={async () => {
                try {
                  const res = await fetch("/api/gigs?mine=1", { credentials: "same-origin" });
                  const data = await res.json().catch(() => ({}));
                  const gigs = data.success ? (data.gigs || []) : [];
                  setChatMessages((prev) => {
                    const idx = prev.map((m, i) => (m.type === "gigList" ? i : -1)).filter((i) => i >= 0).pop();
                    if (idx == null) return prev;
                    const next = [...prev];
                    next[idx] = { type: "gigList", gigs };
                    return next;
                  });
                } catch (e) {
                  console.error("Error refreshing gig list:", e);
                }
              }}
            />
            )}
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false);
          fetch("/api/auth/me", { credentials: "same-origin" })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.success && data.user) {
                setProfileUserName(data.user.name || data.user.email || "Profile");
                setProfileUserEmail(data.user.email || "");
                setProfileAvatarUrl(data.user.avatarUrl || "");
              }
            })
            .catch(() => {});
        }}
      />
    </div>
  );
}
