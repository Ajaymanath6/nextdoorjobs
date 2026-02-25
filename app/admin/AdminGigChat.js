"use client";

import { useState, useRef, useEffect } from "react";
import ChatInterface from "../components/Onboarding/ChatInterface";
import StateDistrictSelector from "../components/Onboarding/StateDistrictSelector";
import GetCoordinatesButton from "../components/Onboarding/GetCoordinatesButton";
import ServiceTypeSelector from "../components/Onboarding/ServiceTypeSelector";
import SalaryInput from "../components/Onboarding/SalaryInput";
import ExperienceInput from "../components/Onboarding/ExperienceInput";
import PincodeDropdown from "../components/Onboarding/PincodeDropdown";
import { WatsonHealthRotate_360 } from "@carbon/icons-react";

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

const INITIAL_AI_MESSAGE =
  "Let's post a gig for a worker. First, share the gig location so candidates see it on the map.";

function extractValue(message) {
  const trimmed = (message || "").trim();
  return trimmed.replace(/^["']|["']$/g, "");
}

export default function AdminGigChat() {
  const [chatMessages, setChatMessages] = useState([{ type: "ai", text: INITIAL_AI_MESSAGE }]);
  const [inlineComponent, setInlineComponent] = useState(null);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gigData, setGigData] = useState({});
  const [currentField, setCurrentField] = useState(GIG_FIELDS.LOCATION);
  const [lastGigCoords, setLastGigCoords] = useState(null);
  const scrollToInlineRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsMobile(
        typeof window !== "undefined" &&
          (window.innerWidth < 768 ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
      );
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const addAIMessage = async (text) => {
    setIsTyping(true);
    setTypingText("");
    for (let i = 0; i < text.length; i++) {
      setTypingText(text.slice(0, i + 1));
      await new Promise((r) => setTimeout(r, 10));
    }
    setIsTyping(false);
    setChatMessages((prev) => [...prev, { type: "ai", text }]);
    setTypingText("");
  };

  const scrollToInline = () => {
    setTimeout(() => scrollToInlineRef.current?.(), 150);
  };

  const handleGigLocationSkipped = async () => {
    await addAIMessage("Which state is the gig in?");
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
    scrollToInline();
  };

  const handleGigStateSelected = async (state) => {
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
    scrollToInline();
  };

  const handleGigDistrictSelected = async (district) => {
    let pincodes = [];
    try {
      const state = gigData?.state || "";
      const res = await fetch(
        `/api/pincodes/by-district?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`
      );
      if (res.ok) {
        const { pincodes: list } = await res.json();
        pincodes = Array.isArray(list) ? list.slice(0, 8) : [];
      }
    } catch (_) {}
    await addAIMessage(
      pincodes.length ? "What's the pincode? (Choose one or skip)" : 'What\'s the pincode? (Type pincode or "skip")'
    );
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
      scrollToInline();
    }
  };

  const handleGigCoordinatesReceived = async (lat, lon) => {
    await addAIMessage(
      `Coordinates received: ${Number(lat).toFixed(6)}, ${Number(lon).toFixed(6)}`
    );
    let state = null;
    let district = null;
    try {
      const res = await fetch(
        `/api/geocode/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
      );
      if (res.ok) {
        const data = await res.json();
        state = data.state ?? null;
        district = data.district ?? null;
      }
    } catch (_) {}
    if (state) setGigData((prev) => ({ ...prev, state }));
    if (district) setGigData((prev) => ({ ...prev, district }));
    if (district && state) {
      await addAIMessage(`District: ${district}, State: ${state}`);
    }
    let pincodes = [];
    try {
      if (state && district) {
        const pinRes = await fetch(
          `/api/pincodes/by-district?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`
        );
        if (pinRes.ok) {
          const { pincodes: list } = await pinRes.json();
          pincodes = Array.isArray(list) ? list.slice(0, 8) : [];
        }
      }
    } catch (_) {}
    if (pincodes.length > 0) {
      await addAIMessage(
        pincodes.length ? "What's the pincode? (Choose one or skip)" : 'What\'s the pincode? (Type pincode or "skip")'
      );
      setCurrentField(GIG_FIELDS.PINCODE);
      setInlineComponent(
        <PincodeDropdown
          pincodes={pincodes}
          onSelect={(pincode) => {
            setChatMessages((prev) => [...prev, { type: "user", text: pincode }]);
            setGigData((prev) => ({
              ...prev,
              pincode,
              latitude: Number(lat),
              longitude: Number(lon),
            }));
            setInlineComponent(null);
            handleGigSubmit({
              pincode,
              state,
              district,
              latitude: Number(lat),
              longitude: Number(lon),
            });
          }}
          onSkip={() => {
            setChatMessages((prev) => [...prev, { type: "user", text: "skip" }]);
            setGigData((prev) => ({ ...prev, latitude: Number(lat), longitude: Number(lon) }));
            setInlineComponent(null);
            handleGigSubmit({ state, district, latitude: Number(lat), longitude: Number(lon) });
          }}
        />
      );
      scrollToInline();
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
      scrollToInline();
    } else {
      await addAIMessage("Which state is the gig in?");
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
      scrollToInline();
    }
  };

  const handleGigSubmit = async (overrides = {}) => {
    const g = { ...gigData, ...overrides };
    const hasTitle = Boolean(g?.title?.trim());
    const hasServiceType = Boolean(g?.serviceType?.trim());
    const hasStateDistrict = Boolean(g?.state?.trim() && g?.district?.trim());
    let latitude =
      g.latitude != null && Number.isFinite(Number(g.latitude)) ? Number(g.latitude) : null;
    let longitude =
      g.longitude != null && Number.isFinite(Number(g.longitude)) ? Number(g.longitude) : null;
    const hasCoords = latitude != null && longitude != null;

    if (!hasTitle || !hasServiceType) {
      setChatMessages((prev) => [
        ...prev,
        { type: "ai", text: "Please complete title and service type. You can try again." },
      ]);
      return;
    }
    if (!hasStateDistrict && !hasCoords) {
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: "Please complete state and district, or set location (coordinates). You can try again.",
        },
      ]);
      return;
    }
    setIsLoading(true);
    try {
      if (latitude == null && longitude == null && g.pincode) {
        try {
          const res = await fetch(
            `/api/pincodes/by-pincode?pincode=${encodeURIComponent(g.pincode)}`
          );
          if (res.ok) {
            const data = await res.json();
            if (
              data.pincode?.latitude != null &&
              data.pincode?.longitude != null
            ) {
              latitude = data.pincode.latitude;
              longitude = data.pincode.longitude;
            }
          }
        } catch (_) {}
      }
      const payload = {
        title: g.title.trim(),
        description: g.description?.trim() || null,
        serviceType: g.serviceType.trim(),
        expectedSalary: g.expectedSalary?.trim() || null,
        experienceWithGig: g.experienceWithGig?.trim() || null,
        customersTillDate:
          typeof g.customersTillDate === "number" && g.customersTillDate >= 0
            ? g.customersTillDate
            : typeof g.customersTillDate === "string" && /^\d+$/.test(String(g.customersTillDate).trim())
              ? parseInt(String(g.customersTillDate).trim(), 10)
              : null,
        state: (g.state || "").trim(),
        district: (g.district || "").trim(),
        pincode: g.pincode?.trim() || null,
        locality: g.locality?.trim() || null,
        latitude: latitude != null ? latitude : null,
        longitude: longitude != null ? longitude : null,
      };
      if (Number.isNaN(payload.customersTillDate)) payload.customersTillDate = null;

      const res = await fetch("/api/admin/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok && result.success && result.gig) {
        setGigData({});
        setCurrentField(GIG_FIELDS.TITLE);
        const coords =
          result.gig.latitude != null && result.gig.longitude != null
            ? { lat: result.gig.latitude, lng: result.gig.longitude }
            : null;
        setLastGigCoords(coords);
        if (coords && typeof sessionStorage !== "undefined") {
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
        setChatMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: "🎉 Gig has been posted! You can view it on the map in the Gig workers view.",
            isFinalMessage: true,
            isGigSuccess: true,
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: `Sorry, we couldn't post the gig. ${result.error || "Please try again."}`,
          },
        ]);
      }
    } catch (err) {
      console.error("Gig submit error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: `Something went wrong. ${err?.message || "Please try again."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOnMap = async () => {
    if (lastGigCoords && typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(
        "zoomToGigCoords",
        JSON.stringify({
          ...lastGigCoords,
          view: "gig_workers",
        })
      );
    }
    try {
      await fetch("/api/admin/set-view-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ viewAs: "user" }),
      });
    } catch (err) {
      console.error("Failed to set admin view-as before opening map:", err);
    }
    if (typeof window !== "undefined") {
      window.open("/", "_blank");
    }
  };

  const handleStartNext = () => {
    setChatMessages([{ type: "ai", text: INITIAL_AI_MESSAGE }]);
    setInlineComponent(null);
    setGigData({});
    setCurrentField(GIG_FIELDS.LOCATION);
    setLastGigCoords(null);
  };

  const handleResetChat = () => {
    setChatMessages([{ type: "ai", text: INITIAL_AI_MESSAGE }]);
    setInlineComponent(null);
    setTypingText("");
    setIsTyping(false);
    setIsLoading(false);
    setGigData({});
    setCurrentField(GIG_FIELDS.LOCATION);
    setLastGigCoords(null);
  };

  const handleChatMessage = async (message) => {
    const value = extractValue(message);
    setChatMessages((prev) => [...prev, { type: "user", text: message }]);
    setIsLoading(true);

    setTimeout(async () => {
      switch (currentField) {
        case GIG_FIELDS.LOCATION:
          await addAIMessage(
            "Where is the gig located? You can get coordinates, or skip and choose state/district."
          );
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
          setCurrentField(GIG_FIELDS.STATE);
          scrollToInline();
          break;

        case GIG_FIELDS.TITLE:
          setGigData((prev) => ({ ...prev, title: value }));
          await addAIMessage(
            `Got it! Title: "${value}". Add a short description (optional — type "skip" to skip).`
          );
          setCurrentField(GIG_FIELDS.DESCRIPTION);
          break;

        case GIG_FIELDS.DESCRIPTION:
          if (value.toLowerCase() !== "skip" && value) {
            setGigData((prev) => ({ ...prev, description: value }));
          }
          await addAIMessage(
            "What type of service is this? Choose from the list or enter your own."
          );
          setCurrentField(GIG_FIELDS.SERVICE_TYPE);
          setInlineComponent(
            <ServiceTypeSelector
              onSelect={async (serviceType) => {
                setChatMessages((prev) => [...prev, { type: "user", text: serviceType }]);
                setGigData((prev) => ({ ...prev, serviceType }));
                setInlineComponent(null);
                await addAIMessage("What's the expected salary for this gig?");
                setInlineComponent(
                  <SalaryInput
                    onSubmit={async (salary) => {
                      setChatMessages((prev) => [...prev, { type: "user", text: salary }]);
                      setGigData((prev) => ({ ...prev, expectedSalary: salary }));
                      setInlineComponent(null);
                      await addAIMessage("Tell us the years of experience with this gig.");
                      setInlineComponent(
                        <ExperienceInput
                          onSubmit={async (experience) => {
                            setGigData((prev) => ({ ...prev, experienceWithGig: experience }));
                            setInlineComponent(null);
                            await addAIMessage(
                              "How many customers have they served till date? (Number or 'skip')"
                            );
                            setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                            scrollToInline();
                          }}
                          onSkip={async () => {
                            setInlineComponent(null);
                            await addAIMessage(
                              "How many customers have they served till date? (Number or 'skip')"
                            );
                            setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                            scrollToInline();
                          }}
                        />
                      );
                      setCurrentField(GIG_FIELDS.EXPECTED_SALARY);
                      scrollToInline();
                    }}
                    onSkip={async () => {
                      setChatMessages((prev) => [...prev, { type: "user", text: "skip" }]);
                      setInlineComponent(null);
                      await addAIMessage("Tell us the years of experience with this gig.");
                      setInlineComponent(
                        <ExperienceInput
                          onSubmit={async (experience) => {
                            setGigData((prev) => ({ ...prev, experienceWithGig: experience }));
                            setInlineComponent(null);
                            await addAIMessage(
                              "How many customers have they served till date? (Number or 'skip')"
                            );
                            setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                            scrollToInline();
                          }}
                          onSkip={async () => {
                            setInlineComponent(null);
                            await addAIMessage(
                              "How many customers have they served till date? (Number or 'skip')"
                            );
                            setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                            scrollToInline();
                          }}
                        />
                      );
                      setCurrentField(GIG_FIELDS.EXPECTED_SALARY);
                      scrollToInline();
                    }}
                  />
                );
                setCurrentField(GIG_FIELDS.EXPECTED_SALARY);
                scrollToInline();
              }}
              onSkip={async () => {
                setChatMessages((prev) => [...prev, { type: "user", text: "skip" }]);
                setInlineComponent(null);
                await addAIMessage("What's the expected salary for this gig?");
                setInlineComponent(
                  <SalaryInput
                    onSubmit={async (salary) => {
                      setChatMessages((prev) => [...prev, { type: "user", text: salary }]);
                      setGigData((prev) => ({ ...prev, expectedSalary: salary }));
                      setInlineComponent(null);
                      await addAIMessage("Tell us the years of experience with this gig.");
                      setInlineComponent(
                        <ExperienceInput
                          onSubmit={async (experience) => {
                            setGigData((prev) => ({ ...prev, experienceWithGig: experience }));
                            setInlineComponent(null);
                            await addAIMessage(
                              "How many customers have they served till date? (Number or 'skip')"
                            );
                            setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                            scrollToInline();
                          }}
                          onSkip={async () => {
                            setInlineComponent(null);
                            await addAIMessage(
                              "How many customers have they served till date? (Number or 'skip')"
                            );
                            setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                            scrollToInline();
                          }}
                        />
                      );
                      setCurrentField(GIG_FIELDS.EXPECTED_SALARY);
                      scrollToInline();
                    }}
                    onSkip={async () => {
                      setChatMessages((prev) => [...prev, { type: "user", text: "skip" }]);
                      setInlineComponent(null);
                      await addAIMessage("Tell us the years of experience with this gig.");
                      setInlineComponent(
                        <ExperienceInput
                          onSubmit={async (experience) => {
                            setGigData((prev) => ({ ...prev, experienceWithGig: experience }));
                            setInlineComponent(null);
                            await addAIMessage(
                              "How many customers have they served till date? (Number or 'skip')"
                            );
                            setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                            scrollToInline();
                          }}
                          onSkip={async () => {
                            setInlineComponent(null);
                            await addAIMessage(
                              "How many customers have they served till date? (Number or 'skip')"
                            );
                            setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                            scrollToInline();
                          }}
                        />
                      );
                      setCurrentField(GIG_FIELDS.EXPECTED_SALARY);
                      scrollToInline();
                    }}
                  />
                );
                setCurrentField(GIG_FIELDS.EXPECTED_SALARY);
                scrollToInline();
              }}
            />
          );
          scrollToInline();
          break;

        case GIG_FIELDS.SERVICE_TYPE:
          if (value?.trim()) setGigData((prev) => ({ ...prev, serviceType: value.trim() }));
          await addAIMessage("What's the expected salary for this gig?");
          setInlineComponent(
            <SalaryInput
              onSubmit={async (salary) => {
                setChatMessages((prev) => [...prev, { type: "user", text: salary }]);
                setGigData((prev) => ({ ...prev, expectedSalary: salary }));
                setInlineComponent(null);
                await addAIMessage("Tell us the years of experience with this gig.");
                setInlineComponent(
                  <ExperienceInput
                    onSubmit={async (experience) => {
                      setGigData((prev) => ({ ...prev, experienceWithGig: experience }));
                      setInlineComponent(null);
                      await addAIMessage(
                        "How many customers have they served till date? (Number or 'skip')"
                      );
                      setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                      scrollToInline();
                    }}
                    onSkip={async () => {
                      setInlineComponent(null);
                      await addAIMessage(
                        "How many customers have they served till date? (Number or 'skip')"
                      );
                      setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                      scrollToInline();
                    }}
                  />
                );
                setCurrentField(GIG_FIELDS.EXPECTED_SALARY);
                scrollToInline();
              }}
              onSkip={async () => {
                setChatMessages((prev) => [...prev, { type: "user", text: "skip" }]);
                setInlineComponent(null);
                await addAIMessage("Tell us the years of experience with this gig.");
                setInlineComponent(
                  <ExperienceInput
                    onSubmit={async (experience) => {
                      setGigData((prev) => ({ ...prev, experienceWithGig: experience }));
                      setInlineComponent(null);
                      await addAIMessage(
                        "How many customers have they served till date? (Number or 'skip')"
                      );
                      setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                      scrollToInline();
                    }}
                    onSkip={async () => {
                      setInlineComponent(null);
                      await addAIMessage(
                        "How many customers have they served till date? (Number or 'skip')"
                      );
                      setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                      scrollToInline();
                    }}
                  />
                );
                setCurrentField(GIG_FIELDS.EXPECTED_SALARY);
                scrollToInline();
              }}
            />
          );
          setCurrentField(GIG_FIELDS.EXPECTED_SALARY);
          scrollToInline();
          break;

        case GIG_FIELDS.EXPECTED_SALARY:
          if (value.toLowerCase() !== "skip" && value)
            setGigData((prev) => ({ ...prev, expectedSalary: value }));
          await addAIMessage("Tell us the years of experience with this gig.");
          setInlineComponent(
            <ExperienceInput
              onSubmit={async (experience) => {
                setGigData((prev) => ({ ...prev, experienceWithGig: experience }));
                setInlineComponent(null);
                await addAIMessage(
                  "How many customers have they served till date? (Number or 'skip')"
                );
                setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                scrollToInline();
              }}
              onSkip={async () => {
                setInlineComponent(null);
                await addAIMessage(
                  "How many customers have they served till date? (Number or 'skip')"
                );
                setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
                scrollToInline();
              }}
            />
          );
          setCurrentField(GIG_FIELDS.EXPERIENCE);
          scrollToInline();
          break;

        case GIG_FIELDS.EXPERIENCE:
          if (value.toLowerCase() !== "skip" && value)
            setGigData((prev) => ({ ...prev, experienceWithGig: value }));
          await addAIMessage(
            "How many customers have they served till date? (Number or 'skip')"
          );
          setCurrentField(GIG_FIELDS.CUSTOMERS_TILL_DATE);
          break;

        case GIG_FIELDS.CUSTOMERS_TILL_DATE: {
          if (value.toLowerCase() !== "skip" && value) {
            const num = parseInt(value.replace(/\D/g, ""), 10);
            if (!Number.isNaN(num) && num >= 0) {
              setGigData((prev) => ({ ...prev, customersTillDate: num }));
            }
          }
          await addAIMessage(
            "Where is the gig located? You can get coordinates, or skip and choose state/district."
          );
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
          scrollToInline();
          break;
        }

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
    }, 500);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex justify-end mb-2">
        <button
          type="button"
          onClick={handleResetChat}
          className="flex items-center gap-2 px-3 py-2 rounded-md border border-brand-stroke-weak text-brand-text-strong text-sm font-medium hover:bg-brand-bg-fill transition-colors"
          title="Reset chat"
        >
          <WatsonHealthRotate_360 size={18} />
          Reset chat
        </button>
      </div>
      <div className="flex-1 min-h-0 rounded-lg border border-brand-stroke-weak bg-brand-bg-white overflow-hidden">
        <ChatInterface
          messages={chatMessages}
          onSendMessage={handleChatMessage}
          isLoading={isLoading}
          inlineComponent={inlineComponent}
          typingText={typingText || null}
          onScrollRequest={(fn) => {
            scrollToInlineRef.current = fn;
          }}
          onViewOnMap={lastGigCoords ? handleViewOnMap : undefined}
          onStartNext={handleStartNext}
          showFindOrPostButtons={false}
        />
      </div>
    </div>
  );
}
