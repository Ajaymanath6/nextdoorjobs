"use client";

import { useState, useRef, useEffect } from "react";
import ChatInterface from "../components/Onboarding/ChatInterface";
import StateDistrictSelector from "../components/Onboarding/StateDistrictSelector";
import GetCoordinatesButton from "../components/Onboarding/GetCoordinatesButton";
import UrlInput from "../components/Onboarding/UrlInput";
import FundingSeriesBadges from "../components/Onboarding/FundingSeriesBadges";
import PincodeDropdown from "../components/Onboarding/PincodeDropdown";
import ExperienceRangeSelect from "../components/Onboarding/ExperienceRangeSelect";
import SalaryRangeBadges from "../components/Onboarding/SalaryRangeBadges";
import RemoteTypeSelector from "../components/Onboarding/RemoteTypeSelector";
import SeniorityLevelSelector from "../components/Onboarding/SeniorityLevelSelector";
import { JOB_CATEGORIES } from "../../lib/constants/jobCategories";
import { WatsonHealthRotate_360 } from "@carbon/icons-react";

const COMPANY_FIELDS = {
  NAME: "company_name",
  STATE: "company_state",
  DISTRICT: "company_district",
  WEBSITE: "company_website",
  FUNDING: "company_funding",
  DESCRIPTION: "company_description",
  LOCATION: "company_location",
  PINCODE: "company_pincode",
};

const JOB_FIELDS = {
  TITLE: "job_title",
  DESCRIPTION: "job_description",
  CATEGORY: "job_category",
  YEARS: "job_years",
  SALARY: "job_salary",
  REMOTE_TYPE: "job_remote_type",
  SENIORITY: "job_seniority",
  APPLICATION_LINK: "job_application_link",
};

const INITIAL_AI_MESSAGE =
  "Let's add a company and post a job. What's the company name?";

function extractValue(message) {
  const trimmed = (message || "").trim();
  return trimmed.replace(/^["']|["']$/g, "");
}

export default function AdminCompanyChat() {
  const [chatMessages, setChatMessages] = useState([
    { type: "ai", text: INITIAL_AI_MESSAGE },
  ]);
  const [inlineComponent, setInlineComponent] = useState(null);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [companyData, setCompanyData] = useState({});
  const [jobData, setJobData] = useState({});
  const [currentField, setCurrentField] = useState(COMPANY_FIELDS.NAME);
  const [collectingCompany, setCollectingCompany] = useState(true);
  const [createdCompany, setCreatedCompany] = useState(null);
  const [lastJobCoords, setLastJobCoords] = useState(null);
  const scrollToInlineRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [recentJobsActive, setRecentJobsActive] = useState(false);
  const [adminJobsCache, setAdminJobsCache] = useState([]);
  const jobDataRef = useRef({});
  const createdCompanyRef = useRef(null);
  useEffect(() => {
    jobDataRef.current = jobData;
  }, [jobData]);
  useEffect(() => {
    createdCompanyRef.current = createdCompany;
  }, [createdCompany]);

  const handleShowRecentJobs = async () => {
    setRecentJobsActive(true);
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      const jobsRaw = Array.isArray(data.jobs) ? data.jobs : [];
      // Extra safety: filter out any inactive jobs if they slip through
      const jobs = jobsRaw.filter((job) => job && job.isActive !== false);

      setAdminJobsCache(jobs);
      setChatMessages((prev) => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        const isRecentJobsAi = (msg) =>
          msg?.type === "ai" && (msg?.text?.includes("recent posted jobs") || msg?.text?.includes("don't have any recent"));
        if (lastIdx >= 0 && next[lastIdx].type === "jobList") {
          next.pop();
          if (lastIdx - 1 >= 0 && isRecentJobsAi(next[lastIdx - 1])) next.pop();
        } else if (lastIdx >= 0 && isRecentJobsAi(next[lastIdx])) {
          next.pop();
        }
        return [
          ...next,
          {
            type: "ai",
            text: jobs.length
              ? "Here are your recent posted jobs:"
              : "You don't have any recent posted jobs yet.",
          },
          ...(jobs.length ? [{ type: "jobList", jobs }] : []),
        ];
      });
    } catch (err) {
      console.error("Failed to load recent admin jobs:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text:
            "Couldn't load recent posted jobs right now. Please try again in a moment.",
        },
      ]);
      setRecentJobsActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminJobDeleted = (jobId) => {
    setAdminJobsCache((prev) => prev.filter((job) => job.id !== jobId));
    setChatMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        const msg = next[i];
        if (msg.type === "jobList") {
          next[i] = {
            ...msg,
            jobs: (msg.jobs || []).filter((job) => job.id !== jobId),
          };
          break;
        }
      }
      return next;
    });
  };

  const handleAdminJobEdited = (updatedJob) => {
    if (!updatedJob || !updatedJob.id) return;
    setAdminJobsCache((prev) =>
      prev.map((job) => (job.id === updatedJob.id ? { ...job, ...updatedJob } : job))
    );
    setChatMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        const msg = next[i];
        if (msg.type === "jobList") {
          next[i] = {
            ...msg,
            jobs: (msg.jobs || []).map((job) =>
              job.id === updatedJob.id ? { ...job, ...updatedJob } : job
            ),
          };
          break;
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const check = () =>
      setIsMobile(
        typeof window !== "undefined" &&
          (window.innerWidth < 768 ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent
            ))
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

  const handleLocationReceived = async (lat, lon) => {
    const latitude = typeof lat === "number" ? lat : parseFloat(lat);
    const longitude = typeof lon === "number" ? lon : parseFloat(lon);
    let state = companyData?.state ?? null;
    let district = companyData?.district ?? null;
    try {
      const res = await fetch(
        `/api/geocode/reverse?lat=${latitude}&lon=${longitude}`
      );
      if (res.ok) {
        const data = await res.json();
        state = data.state ?? state;
        district = data.district ?? district;
      }
    } catch (_) {}
    setCompanyData((prev) => ({
      ...prev,
      latitude,
      longitude,
      ...(state && { state }),
      ...(district && { district }),
    }));
    await addAIMessage(
      `Location saved: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}${district && state ? ` • ${district}, ${state}` : ""}.`
    );

    let pincodes = [];
    if (district && state) {
      try {
        const pinRes = await fetch(
          `/api/pincodes/by-district?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`
        );
        if (pinRes.ok) {
          const { pincodes: list } = await pinRes.json();
          pincodes = Array.isArray(list) ? list.slice(0, 8) : [];
        }
      } catch (_) {}
    }
    if (pincodes.length > 0) {
      await addAIMessage("What's the pincode? (Choose one or skip)");
      setCurrentField(COMPANY_FIELDS.PINCODE);
      setInlineComponent(
        <PincodeDropdown
          pincodes={pincodes}
          onSelect={(pincode) => {
            setCompanyData((prev) => ({ ...prev, pincode }));
            setInlineComponent(null);
            handleCompanySubmit({ pincode });
          }}
          onSkip={() => {
            setInlineComponent(null);
            handleCompanySubmit({});
          }}
        />
      );
      scrollToInline();
    } else {
      await addAIMessage('What\'s the pincode? (Type pincode or "skip")');
      setCurrentField(COMPANY_FIELDS.PINCODE);
    }
  };

  const handleLocationSkipped = async () => {
    await addAIMessage('What\'s the pincode? (Type pincode or "skip")');
    setCurrentField(COMPANY_FIELDS.PINCODE);
  };

  const handleWebsiteSubmitted = async (url) => {
    const value = (url || "").trim();
    const isSkip = !value || value.toLowerCase() === "skip";
    let logoFetched = false;

    if (!isSkip) {
      const normalizedUrl = /^https?:\/\//i.test(value) ? value : `https://${value}`;
      setCompanyData((prev) => ({ ...prev, websiteUrl: normalizedUrl }));

      setIsLoading(true);
      try {
        const logoRes = await fetch(
          `/api/onboarding/fetch-logo?url=${encodeURIComponent(normalizedUrl)}`
        );
        if (logoRes.ok) {
          const logoData = await logoRes.json();
          if (logoData.success && logoData.logoUrl) {
            logoFetched = true;
            setCompanyData((prev) => ({
              ...prev,
              websiteUrl: normalizedUrl,
              logoPath: logoData.logoUrl,
              logoUrl: logoData.logoUrl,
            }));
          }
        }
      } catch (e) {
        // Ignore logo fetch errors and continue
      }

      try {
        const locRes = await fetch(
          `/api/onboarding/company-from-url?url=${encodeURIComponent(normalizedUrl)}`
        );
        if (locRes.ok) {
          const data = await locRes.json();
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
          }
        }
      } catch (e) {
        // Ignore failures, we still proceed
      }

      await addAIMessage(
        logoFetched
          ? `Website noted: ${value}. We found your company logo!`
          : `Website noted: ${value}.`
      );
    } else {
      await addAIMessage("Website skipped.");
    }

    await addAIMessage(
      "Add company location (coordinates), or skip to enter pincode only."
    );
    setCurrentField(COMPANY_FIELDS.LOCATION);
    setInlineComponent(
      <GetCoordinatesButton
        isMobile={isMobile}
        onCoordinatesReceived={(lat, lon) => {
          setInlineComponent(null);
          handleLocationReceived(lat, lon);
        }}
        onSkip={() => {
          setInlineComponent(null);
          handleLocationSkipped();
        }}
      />
    );
    scrollToInline();
    setIsLoading(false);
  };

  const handleCompanySubmit = async (overrides = {}) => {
    const c = { ...companyData, ...overrides };
    const name = (c.name || "").trim();
    const state = (c.state || "").trim();
    const district = (c.district || "").trim();
    if (!name || !state || !district) {
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: "Company name, state, and district are required. Please try again.",
        },
      ]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          state,
          district,
          description: c.description?.trim() || null,
          websiteUrl: c.websiteUrl?.trim() || null,
          fundingSeries: c.fundingSeries || null,
          logoPath: c.logoPath || c.logoUrl || null,
          latitude:
            c.latitude != null && Number.isFinite(Number(c.latitude))
              ? Number(c.latitude)
              : null,
          longitude:
            c.longitude != null && Number.isFinite(Number(c.longitude))
              ? Number(c.longitude)
              : null,
          pincode: c.pincode?.trim() || null,
        }),
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok && result.success && result.company) {
        setCreatedCompany({
          ...result.company,
          latitude: c.latitude != null ? Number(c.latitude) : null,
          longitude: c.longitude != null ? Number(c.longitude) : null,
        });
        setCollectingCompany(false);
        setCompanyData({});
        setCurrentField(JOB_FIELDS.TITLE);
        await addAIMessage(
          `Company "${result.company.name}" created. Now let's add the job. What's the job title?`
        );
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: `Couldn't create company. ${result.error || "Please try again."}`,
          },
        ]);
      }
    } catch (err) {
      console.error("Company submit error:", err);
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

  const handleJobSubmit = async () => {
    const j = jobDataRef.current;
    const company = createdCompanyRef.current;
    const title = (j.title || "").trim();
    const jobDescription = (j.jobDescription || "").trim();
    const category = j.category || "EngineeringSoftwareQA";
    if (!title || !jobDescription || !company?.id) {
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: "Job title and description are required. Please try again.",
        },
      ]);
      return;
    }
    setIsLoading(true);
    try {
      const yearsRequired =
        j.yearsRequired != null ? parseFloat(j.yearsRequired) : 0;
      const salaryMin =
        j.salaryMin != null && j.salaryMin !== ""
          ? parseInt(String(j.salaryMin), 10)
          : null;
      const salaryMax =
        j.salaryMax != null && j.salaryMax !== ""
          ? parseInt(String(j.salaryMax), 10)
          : null;

      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          category,
          jobDescription,
          companyId: company.id,
          yearsRequired: Number.isNaN(yearsRequired) ? 0 : yearsRequired,
          salaryMin: Number.isNaN(salaryMin) ? null : salaryMin,
          salaryMax: Number.isNaN(salaryMax) ? null : salaryMax,
          remoteType: j.remoteType?.trim() || null,
          seniorityLevel: j.seniorityLevel?.trim() || null,
          applicationUrl: j.applicationUrl?.trim() || null,
        }),
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok && result.success && result.jobPosition) {
        const companyLat = company.latitude;
        const companyLon = company.longitude;
        const logoUrl =
          company.logoPath ||
          companyData?.logoPath ||
          companyData?.logoUrl ||
          null;
        if (
          companyLat != null &&
          companyLon != null &&
          (typeof sessionStorage !== "undefined" ||
            typeof localStorage !== "undefined")
        ) {
          const payload = {
            lat: companyLat,
            lng: companyLon,
            companyName: company.name || "Your posting",
            logoUrl: logoUrl || null,
          };
          setLastJobCoords({ lat: companyLat, lng: companyLon, logoUrl: logoUrl || null });
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("zoomToJobCoords", JSON.stringify(payload));
          }
          if (typeof localStorage !== "undefined") {
            localStorage.setItem("zoomToJobCoords", JSON.stringify(payload));
          }
        }
        setChatMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: "🎉 Job posting created successfully!",
            isFinalMessage: true,
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: `Couldn't create job. ${result.error || "Please try again."}`,
          },
        ]);
      }
    } catch (err) {
      console.error("Job submit error:", err);
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

  const handleApplicationLinkSubmitted = async (url) => {
    setInlineComponent(null);
    if (url && url.toLowerCase() !== "skip") {
      const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      setJobData((prev) => ({ ...prev, applicationUrl: normalized }));
    }
    await addAIMessage("Submitting job posting...");
    await handleJobSubmit();
  };

  const goToApplicationLinkStep = () => {
    addAIMessage(
      "Job application link? (URL where applicants can apply, or skip)"
    );
    setCurrentField(JOB_FIELDS.APPLICATION_LINK);
    setInlineComponent(
      <UrlInput
        onUrlSubmit={(url) => handleApplicationLinkSubmitted(url)}
        onSkip={() => handleApplicationLinkSubmitted("skip")}
        placeholder="Enter application URL or skip..."
      />
    );
    scrollToInline();
  };

  const handleViewOnMap = async () => {
    if (lastJobCoords && (typeof sessionStorage !== "undefined" || typeof localStorage !== "undefined")) {
      const payload = {
        lat: lastJobCoords.lat,
        lng: lastJobCoords.lng,
        companyName: createdCompany?.name || "Your posting",
        logoUrl: lastJobCoords.logoUrl || createdCompany?.logoPath || null,
      };
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("zoomToJobCoords", JSON.stringify(payload));
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("zoomToJobCoords", JSON.stringify(payload));
      }
    }
    try {
      await fetch("/api/admin/set-view-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: "individual" }),
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
    setCompanyData({});
    setJobData({});
    setCurrentField(COMPANY_FIELDS.NAME);
    setCollectingCompany(true);
    setCreatedCompany(null);
    setLastJobCoords(null);
  };

  const handleResetChat = () => {
    setChatMessages([{ type: "ai", text: INITIAL_AI_MESSAGE }]);
    setInlineComponent(null);
    setTypingText("");
    setIsTyping(false);
    setIsLoading(false);
    setCompanyData({});
    setJobData({});
    setCurrentField(COMPANY_FIELDS.NAME);
    setCollectingCompany(true);
    setCreatedCompany(null);
    setLastJobCoords(null);
  };

  const handleChatMessage = async (message) => {
    const value = extractValue(message);
    setChatMessages((prev) => [...prev, { type: "user", text: message }]);
    setIsLoading(true);

    setTimeout(async () => {
      if (collectingCompany) {
        switch (currentField) {
          case COMPANY_FIELDS.NAME:
            setCompanyData((prev) => ({ ...prev, name: value }));
            await addAIMessage(
              `Got it! Company: "${value}". What does your company do? (short description or type skip)`
            );
            setCurrentField(COMPANY_FIELDS.DESCRIPTION);
            break;

          case COMPANY_FIELDS.DESCRIPTION:
            if (value.toLowerCase() !== "skip" && value) {
              setCompanyData((prev) => ({ ...prev, description: value }));
            }
            await addAIMessage(
              "Do you have a company website URL? (Enter URL or skip)"
            );
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
                placeholder="Enter website URL or click skip..."
              />
            );
            scrollToInline();
            break;

          case COMPANY_FIELDS.PINCODE:
            if (value.toLowerCase() !== "skip" && value) {
              setCompanyData((prev) => ({ ...prev, pincode: value }));
            }
            await handleCompanySubmit();
            break;

          default:
            break;
        }
      } else {
        switch (currentField) {
          case JOB_FIELDS.TITLE:
            setJobData((prev) => ({ ...prev, title: value }));
            await addAIMessage(
              `Job title: ${value}. Please provide a detailed job description.`
            );
            setCurrentField(JOB_FIELDS.DESCRIPTION);
            break;

          case JOB_FIELDS.DESCRIPTION:
            setJobData((prev) => ({ ...prev, jobDescription: value }));
            await addAIMessage("Select job category:");
            setCurrentField(JOB_FIELDS.CATEGORY);
            setInlineComponent(
              <div className="w-full flex flex-wrap gap-2 p-4 border border-brand-stroke-weak rounded-lg bg-white/95">
                {JOB_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      setJobData((prev) => ({ ...prev, category: cat.value }));
                      setChatMessages((prev) => [
                        ...prev,
                        { type: "user", text: cat.label },
                      ]);
                      setInlineComponent(null);
                      addAIMessage(`Category: ${cat.label}. How many years of experience required?`).then(
                        () => {
                          setCurrentField(JOB_FIELDS.YEARS);
                          setInlineComponent(
                            <ExperienceRangeSelect
                              onSelect={(years) => {
                                setJobData((prev) => ({
                                  ...prev,
                                  yearsRequired: years,
                                }));
                                setChatMessages((prev) => [
                                  ...prev,
                                  { type: "user", text: `${years} years` },
                                ]);
                                setInlineComponent(null);
                                addAIMessage("What's the salary range?").then(
                                  () => {
                                    setCurrentField(JOB_FIELDS.SALARY);
                                    setInlineComponent(
                                      <SalaryRangeBadges
                                        onSelect={(min, max) => {
                                          setJobData((prev) => ({
                                            ...prev,
                                            salaryMin: min,
                                            salaryMax: max,
                                          }));
                                          setInlineComponent(null);
                                          addAIMessage(
                                            "Remote type? (Remote, Hybrid, On-site — or skip)"
                                          ).then(() => {
                                            setCurrentField(
                                              JOB_FIELDS.REMOTE_TYPE
                                            );
                                            setInlineComponent(
                                              <RemoteTypeSelector
                                                selectedValue={
                                                  jobData?.remoteType || null
                                                }
                                                onSelect={(type) => {
                                                  setJobData((prev) => ({
                                                    ...prev,
                                                    remoteType: type,
                                                  }));
                                                  setChatMessages((prev) => [
                                                    ...prev,
                                                    {
                                                      type: "user",
                                                      text: type,
                                                    },
                                                  ]);
                                                  setInlineComponent(null);
                                                  addAIMessage(
                                                    "Seniority level? (Entry, Mid, Senior — or skip)"
                                                  ).then(() => {
                                                    setCurrentField(
                                                      JOB_FIELDS.SENIORITY
                                                    );
                                                    setInlineComponent(
                                                      <SeniorityLevelSelector
                                                        selectedValue={
                                                          jobData?.seniorityLevel ||
                                                          null
                                                        }
                                                        onSelect={(level) => {
                                                          setJobData(
                                                            (prev) => ({
                                                              ...prev,
                                                              seniorityLevel:
                                                                level,
                                                            })
                                                          );
                                                          setChatMessages(
                                                            (prev) => [
                                                              ...prev,
                                                              {
                                                                type: "user",
                                                                text: level,
                                                              },
                                                            ]
                                                          );
                                                          setInlineComponent(
                                                            null
                                                          );
                                                          goToApplicationLinkStep();
                                                        }}
                                                        onSkip={() => {
                                                          setInlineComponent(
                                                            null
                                                          );
                                                          goToApplicationLinkStep();
                                                        }}
                                                      />
                                                    );
                                                    scrollToInline();
                                                  });
                                                }}
                                                onSkip={() => {
                                                  setInlineComponent(null);
                                                  addAIMessage(
                                                    "Seniority level? (Entry, Mid, Senior — or skip)"
                                                  ).then(() => {
                                                    setCurrentField(
                                                      JOB_FIELDS.SENIORITY
                                                    );
                                                    setInlineComponent(
                                                      <SeniorityLevelSelector
                                                        selectedValue={
                                                          jobData?.seniorityLevel ||
                                                          null
                                                        }
                                                        onSelect={(level) => {
                                                          setJobData(
                                                            (prev) => ({
                                                              ...prev,
                                                              seniorityLevel:
                                                                level,
                                                            })
                                                          );
                                                          setChatMessages(
                                                            (prev) => [
                                                              ...prev,
                                                              {
                                                                type: "user",
                                                                text: level,
                                                              },
                                                            ]
                                                          );
                                                          setInlineComponent(
                                                            null
                                                          );
                                                          goToApplicationLinkStep();
                                                        }}
                                                        onSkip={() => {
                                                          setInlineComponent(
                                                            null
                                                          );
                                                          goToApplicationLinkStep();
                                                        }}
                                                      />
                                                    );
                                                    scrollToInline();
                                                  });
                                                }}
                                              />
                                            );
                                            scrollToInline();
                                          });
                                        }}
                                        onSkip={() => {
                                          setInlineComponent(null);
                                          addAIMessage(
                                            "Remote type? (Remote, Hybrid, On-site — or skip)"
                                          ).then(() => {
                                            setCurrentField(
                                              JOB_FIELDS.REMOTE_TYPE
                                            );
                                            setInlineComponent(
                                              <RemoteTypeSelector
                                                selectedValue={
                                                  jobData?.remoteType || null
                                                }
                                                onSelect={(type) => {
                                                  setJobData((prev) => ({
                                                    ...prev,
                                                    remoteType: type,
                                                  }));
                                                  setChatMessages((prev) => [
                                                    ...prev,
                                                    {
                                                      type: "user",
                                                      text: type,
                                                    },
                                                  ]);
                                                  setInlineComponent(null);
                                                  addAIMessage(
                                                    "Seniority level? (Entry, Mid, Senior — or skip)"
                                                  ).then(() => {
                                                    setCurrentField(
                                                      JOB_FIELDS.SENIORITY
                                                    );
                                                    setInlineComponent(
                                                      <SeniorityLevelSelector
                                                        selectedValue={
                                                          jobData?.seniorityLevel ||
                                                          null
                                                        }
                                                        onSelect={(level) => {
                                                          setJobData(
                                                            (prev) => ({
                                                              ...prev,
                                                              seniorityLevel:
                                                                level,
                                                            })
                                                          );
                                                          setChatMessages(
                                                            (prev) => [
                                                              ...prev,
                                                              {
                                                                type: "user",
                                                                text: level,
                                                              },
                                                            ]
                                                          );
                                                          setInlineComponent(
                                                            null
                                                          );
                                                          goToApplicationLinkStep();
                                                        }}
                                                        onSkip={() => {
                                                          setInlineComponent(
                                                            null
                                                          );
                                                          goToApplicationLinkStep();
                                                        }}
                                                      />
                                                    );
                                                    scrollToInline();
                                                  });
                                                }}
                                                onSkip={() => {
                                                  setInlineComponent(null);
                                                  addAIMessage(
                                                    "Seniority level? (Entry, Mid, Senior — or skip)"
                                                  ).then(() => {
                                                    setCurrentField(
                                                      JOB_FIELDS.SENIORITY
                                                    );
                                                    setInlineComponent(
                                                      <SeniorityLevelSelector
                                                        selectedValue={
                                                          jobData?.seniorityLevel ||
                                                          null
                                                        }
                                                        onSelect={(level) => {
                                                          setJobData(
                                                            (prev) => ({
                                                              ...prev,
                                                              seniorityLevel:
                                                                level,
                                                            })
                                                          );
                                                          setChatMessages(
                                                            (prev) => [
                                                              ...prev,
                                                              {
                                                                type: "user",
                                                                text: level,
                                                              },
                                                            ]
                                                          );
                                                          setInlineComponent(
                                                            null
                                                          );
                                                          goToApplicationLinkStep();
                                                        }}
                                                        onSkip={() => {
                                                          setInlineComponent(
                                                            null
                                                          );
                                                          goToApplicationLinkStep();
                                                        }}
                                                      />
                                                    );
                                                    scrollToInline();
                                                  });
                                                }}
                                              />
                                            );
                                            scrollToInline();
                                          });
                                        }}
                                        selectedMin={jobData?.salaryMin}
                                        selectedMax={jobData?.salaryMax}
                                      />
                                    );
                                    scrollToInline();
                                  }
                                );
                              }}
                              selectedValue={jobData?.yearsRequired}
                            />
                          );
                          scrollToInline();
                        }
                      );
                    }}
                    className="px-4 py-2 rounded-lg border border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill text-sm"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            );
            scrollToInline();
            break;

          case JOB_FIELDS.REMOTE_TYPE:
            if (value.toLowerCase() !== "skip" && value) {
              setJobData((prev) => ({ ...prev, remoteType: value }));
            }
            await addAIMessage(
              "Seniority level? (e.g. Entry, Mid, Senior — or skip)"
            );
            setCurrentField(JOB_FIELDS.SENIORITY);
            break;

          case JOB_FIELDS.SENIORITY:
            if (value.toLowerCase() !== "skip" && value) {
              setJobData((prev) => ({ ...prev, seniorityLevel: value }));
            }
            goToApplicationLinkStep();
            break;

          case JOB_FIELDS.APPLICATION_LINK:
            if (value.toLowerCase() !== "skip" && value) {
              const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
              setJobData((prev) => ({ ...prev, applicationUrl: normalized }));
            }
            await addAIMessage("Submitting job posting...");
            await handleJobSubmit();
            break;

          default:
            break;
        }
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex justify-end gap-2 mb-2">
        <button
          type="button"
          onClick={handleShowRecentJobs}
          className={`flex items-center gap-2 px-3 py-2 rounded-md border border-brand-stroke-weak text-brand-text-strong text-sm font-medium transition-colors ${
            recentJobsActive ? "bg-brand-bg-fill" : "hover:bg-brand-bg-fill"
          }`}
        >
          Job listings
        </button>
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
          onViewOnMap={lastJobCoords ? handleViewOnMap : undefined}
          onStartNext={handleStartNext}
          showFindOrPostButtons={false}
          onJobDeleted={handleAdminJobDeleted}
          onJobEdited={handleAdminJobEdited}
          jobApiPrefix="/api/admin/jobs"
          openMapInNewTab={true}
        />
      </div>
    </div>
  );
}
