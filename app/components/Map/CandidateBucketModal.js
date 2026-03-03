"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Modal from "../Modal";
import {
  Close,
  ArrowLeft,
  Email,
  TrashCan,
  BookmarkAdd,
  BookmarkFilled,
  Location,
} from "@carbon/icons-react";
import { getAvatarUrlById } from "../../../lib/avatars";
import LoadingSpinner from "../LoadingSpinner";

const TAB_ALL = "all";
const TAB_BOOKMARKED = "bookmarked";
const TAB_INVITED = "invited";

function normalizeName(str) {
  return (str || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export default function CandidateBucketModal({
  isOpen,
  onClose,
  onSelectCandidate,
  selectedLocationFromSearch = null,
  preselectedState = null,
  initialSearchQuery = "",
}) {
  const [statesList, setStatesList] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [selectedState, setSelectedState] = useState(null);
  const [districtsList, setDistrictsList] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState(null);
  const [activeTab, setActiveTab] = useState(TAB_ALL);
  const [bookmarkedIds, setBookmarkedIds] = useState(() => new Set());
  const [invitedIds, setInvitedIds] = useState(() => new Set());
  const [removedIds, setRemovedIds] = useState(() => new Set());
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [removingId, setRemovingId] = useState(null);
  const hasAppliedPreselectRef = useRef(false);

  useEffect(() => {
    if (!isOpen) hasAppliedPreselectRef.current = false;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setStatesLoading(true);
    fetch("/api/india/states", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.states)) setStatesList(data.states);
        else setStatesList([]);
      })
      .catch(() => setStatesList([]))
      .finally(() => setStatesLoading(false));
  }, [isOpen]);

  const stateForPreselect = selectedLocationFromSearch?.state || preselectedState;

  useEffect(() => {
    if (!isOpen || statesLoading || statesList.length === 0 || hasAppliedPreselectRef.current) return;
    const fromLocation = stateForPreselect && statesList.find((s) => normalizeName(s) === normalizeName(stateForPreselect));
    const q = (initialSearchQuery || "").trim().toLowerCase();
    const fromSearch = !fromLocation && q && statesList.find((s) => normalizeName(s).includes(q) || normalizeName(s).startsWith(q));
    const found = fromLocation || fromSearch;
    if (found) {
      hasAppliedPreselectRef.current = true;
      setSelectedState(found);
    }
  }, [isOpen, statesLoading, statesList, stateForPreselect, initialSearchQuery]);

  useEffect(() => {
    if (!isOpen || !selectedState) {
      setCandidates([]);
      setCandidatesError(null);
      return;
    }
    setCandidatesLoading(true);
    setCandidatesError(null);
    setBookmarkedIds(new Set());
    setInvitedIds(new Set());
    setRemovedIds(new Set());
    setSelectedIds(new Set());
    setActiveTab(TAB_ALL);
    fetch(`/api/gigs?state=${encodeURIComponent(selectedState)}`, {
      credentials: "same-origin",
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data) => {
        if (data.success && Array.isArray(data.gigs)) {
          setCandidates(data.gigs);
        } else {
          setCandidates([]);
        }
      })
      .catch(() => setCandidatesError("Could not load candidates"))
      .finally(() => setCandidatesLoading(false));
  }, [isOpen, selectedState]);

  useEffect(() => {
    if (!isOpen || !selectedState) {
      setDistrictsList([]);
      return;
    }
    setDistrictsLoading(true);
    fetch(`/api/india/districts?state=${encodeURIComponent(selectedState)}`, {
      credentials: "same-origin",
    })
      .then((res) => res.json())
      .then((data) => {
        setDistrictsList(Array.isArray(data.districts) ? data.districts : []);
      })
      .catch(() => setDistrictsList([]))
      .finally(() => setDistrictsLoading(false));
  }, [isOpen, selectedState]);

  const handleBackToStates = () => {
    setSelectedState(null);
    setCandidates([]);
    setCandidatesError(null);
    setActiveTab(TAB_ALL);
    setBookmarkedIds(new Set());
    setInvitedIds(new Set());
    setRemovedIds(new Set());
    setSelectedIds(new Set());
  };

  const toggleSelected = (e, gig) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(gig.id)) next.delete(gig.id);
      else next.add(gig.id);
      return next;
    });
  };

  const handleExportAs = () => {
    const toExport = selectedIds.size > 0
      ? visibleCandidates.filter((c) => selectedIds.has(c.id))
      : visibleCandidates;
    if (toExport.length === 0) return;
    const jobTitle = (g) => g.resume?.currentPosition || g.resume?.workExperiences?.[0]?.position || "";
    const header = "Name,Email,Job Title,State\n";
    const rows = toExport.map((g) => {
      const name = (g.user?.name || g.title || "Candidate").replace(/"/g, '""');
      const email = (g.email || g.user?.email || "").replace(/"/g, '""');
      const title = jobTitle(g).replace(/"/g, '""');
      const state = (g.state || selectedState || "").replace(/"/g, '""');
      return `"${name}","${email}","${title}","${state}"`;
    });
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidates-${selectedState || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCancelExport = () => {
    setSelectedIds(new Set());
  };

  const visibleCandidates = useMemo(() => {
    return candidates.filter((c) => !removedIds.has(c.id));
  }, [candidates, removedIds]);

  const bookmarkedCandidates = useMemo(() => {
    return visibleCandidates.filter((c) => bookmarkedIds.has(c.id));
  }, [visibleCandidates, bookmarkedIds]);

  const invitedCandidates = useMemo(() => {
    return visibleCandidates.filter((c) => invitedIds.has(c.id));
  }, [visibleCandidates, invitedIds]);

  const candidatesByTab = useMemo(() => {
    if (activeTab === TAB_BOOKMARKED) return bookmarkedCandidates;
    if (activeTab === TAB_INVITED) return invitedCandidates;
    return visibleCandidates;
  }, [activeTab, visibleCandidates, bookmarkedCandidates, invitedCandidates]);

  const handleBookmark = (e, gig) => {
    e.stopPropagation();
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(gig.id)) next.delete(gig.id);
      else next.add(gig.id);
      return next;
    });
  };

  const handleSendInvite = (e, gig) => {
    e.stopPropagation();
    setInvitedIds((prev) => new Set(prev).add(gig.id));
    const email = gig.email || gig.user?.email || "";
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const handleRemove = (e, gig) => {
    e.stopPropagation();
    setRemovingId(gig.id);
    setTimeout(() => {
      setRemovedIds((prev) => new Set(prev).add(gig.id));
      setRemovingId(null);
    }, 500);
  };

  const handleRowClick = (gig) => {
    if (onSelectCandidate) {
      onSelectCandidate(gig);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className="fixed inset-0 z-1002 flex items-center justify-center p-4 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-bucket-title"
      >
        <div
          className="bg-brand-bg-white rounded-lg border border-brand-stroke-weak shadow-lg w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ fontFamily: "Open Sans, sans-serif" }}
        >
          <div className="shrink-0 flex items-center justify-between gap-4 p-4 border-b border-brand-stroke-weak">
            <div className="flex items-center gap-2 min-w-0">
              {selectedState ? (
                <button
                  type="button"
                  onClick={handleBackToStates}
                  className="p-2 rounded-lg hover:bg-brand-bg-fill transition-colors shrink-0"
                  aria-label="Back to states"
                >
                  <ArrowLeft size={24} className="text-brand-stroke-strong" />
                </button>
              ) : null}
              <h2
                id="candidate-bucket-title"
                className="text-lg font-semibold text-brand-text-strong truncate"
              >
                {selectedState ? (
                  <>
                    Candidates in{" "}
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand/15 text-brand font-semibold border border-brand/30">
                      {selectedState}
                    </span>
                  </>
                ) : (
                  "Fetch candidates"
                )}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-brand-bg-fill transition-colors shrink-0"
              aria-label="Close"
            >
              <Close size={24} className="text-brand-stroke-strong" />
            </button>
          </div>

          {selectedState && (
            <div className="shrink-0 flex border-b border-brand-stroke-weak px-4 gap-0">
              <button
                type="button"
                onClick={() => setActiveTab(TAB_ALL)}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === TAB_ALL
                    ? "text-brand border-brand"
                    : "text-brand-text-weak border-transparent hover:text-brand-text-strong"
                }`}
              >
                All candidates
              </button>
              <button
                type="button"
                onClick={() => setActiveTab(TAB_BOOKMARKED)}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === TAB_BOOKMARKED
                    ? "text-brand border-brand"
                    : "text-brand-text-weak border-transparent hover:text-brand-text-strong"
                }`}
              >
                Bookmarked {bookmarkedIds.size > 0 && `(${bookmarkedIds.size})`}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab(TAB_INVITED)}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === TAB_INVITED
                    ? "text-brand border-brand"
                    : "text-brand-text-weak border-transparent hover:text-brand-text-strong"
                }`}
              >
                Invited {invitedIds.size > 0 && `(${invitedIds.size})`}
              </button>
            </div>
          )}

          {selectedState && districtsList.length > 0 && (
            <div className="shrink-0 px-4 pt-2 pb-1 border-b border-brand-stroke-weak">
              <p className="text-xs font-medium text-brand-text-weak mb-2" style={{ fontFamily: "Open Sans, sans-serif" }}>
                Areas in {selectedState}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {districtsList.map((district, idx) => {
                  const isPreselectedDistrict =
                    selectedLocationFromSearch?.district &&
                    normalizeName(district) === normalizeName(selectedLocationFromSearch.district);
                  return (
                    <span
                      key={idx}
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        isPreselectedDistrict
                          ? "bg-brand/20 text-brand border border-brand"
                          : "bg-brand-bg-fill text-brand-text-weak border border-brand-stroke-weak"
                      }`}
                    >
                      {district}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {!selectedState ? (
              <>
                {statesLoading && (
                  <div className="flex flex-col items-center justify-center py-8 gap-4 text-brand-text-weak">
                    <LoadingSpinner size="lg" />
                    <span>Loading states…</span>
                  </div>
                )}
                {!statesLoading && statesList.length === 0 && (
                  <div className="text-center py-8 text-brand-text-weak">
                    No states found.
                  </div>
                )}
                {!statesLoading && statesList.length > 0 && (
                  <ul className="space-y-1">
                    {statesList.map((state, index) => {
                      const isPreselected = stateForPreselect && normalizeName(state) === normalizeName(stateForPreselect);
                      return (
                        <li key={index}>
                          <button
                            type="button"
                            onClick={() => setSelectedState(state)}
                            className={`w-full flex items-center justify-between gap-2 py-3 px-3 rounded-lg border text-left transition-colors font-medium ${
                              isPreselected
                                ? "border-brand bg-brand/20 text-brand"
                                : "border-brand-stroke-weak bg-brand-bg-white hover:bg-brand-bg-fill hover:border-brand-stroke-border text-brand-text-strong"
                            }`}
                          >
                            {state}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            ) : (
              <>
                {candidatesLoading && (
                  <div className="flex flex-col items-center justify-center py-8 gap-4 text-brand-text-weak">
                    <LoadingSpinner size="lg" />
                    <span>Loading candidates…</span>
                  </div>
                )}
                {candidatesError && (
                  <div className="text-center py-8 text-brand-text-weak">
                    {candidatesError}
                  </div>
                )}
                {!candidatesLoading &&
                  !candidatesError &&
                  candidates.length === 0 && (
                    <div className="text-center py-8 text-brand-text-weak">
                      No candidates in this state.
                    </div>
                  )}
                {!candidatesLoading &&
                  !candidatesError &&
                  candidatesByTab.length === 0 &&
                  candidates.length > 0 && (
                    <div className="text-center py-8 text-brand-text-weak">
                      {activeTab === TAB_BOOKMARKED &&
                        "No bookmarked candidates."}
                      {activeTab === TAB_INVITED && "No invited candidates yet."}
                    </div>
                  )}
                {!candidatesLoading &&
                  !candidatesError &&
                  candidatesByTab.length > 0 && (
                    <>
                      <ul className="space-y-2">
                        {candidatesByTab.map((gig) => {
                          const name =
                            gig.user?.name || gig.title || "Candidate";
                          const email =
                            gig.email || gig.user?.email || "—";
                          const locationParts = [gig.locality, gig.district, gig.state || selectedState].filter(Boolean);
                          const locationLabel = locationParts.length > 0 ? locationParts.join(", ") : (gig.state || selectedState || "—");
                          const jobTitle =
                            gig.resume?.currentPosition ||
                            gig.resume?.workExperiences?.[0]?.position ||
                            "";
                          const avatarUrl =
                            gig.user?.avatarUrl ||
                            (gig.user?.avatarId
                              ? getAvatarUrlById(gig.user.avatarId)
                              : "/avatars/avatar1.png");
                          const isBookmarked = bookmarkedIds.has(gig.id);
                          const isSelected = selectedIds.has(gig.id);
                          const showActions = activeTab === TAB_ALL;
                          const hasEmail = !!(gig.email || gig.user?.email);
                          const isRemoving = removingId === gig.id;

                          return (
                            <li key={gig.id}>
                              <div className="flex items-center gap-4 p-3 rounded-lg border border-brand-stroke-weak bg-brand-bg-white hover:bg-brand-bg-fill transition-colors">
                                {showActions && !isRemoving && (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => toggleSelected(e, gig)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="shrink-0 w-4 h-4 rounded border-brand-stroke-border focus:ring-brand"
                                    style={{ accentColor: "var(--color-brand, #F84416)" }}
                                    aria-label={`Select ${name}`}
                                  />
                                )}
                                {showActions && isRemoving && <div className="shrink-0 w-4 h-4" aria-hidden />}
                                <button
                                  type="button"
                                  onClick={() => handleRowClick(gig)}
                                  className="flex items-center gap-4 flex-1 min-w-0 text-left"
                                >
                                  <img
                                    src={avatarUrl}
                                    alt=""
                                    className="w-10 h-10 rounded-full object-cover border border-brand-stroke-weak shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-brand-text-strong truncate">
                                      {name}
                                    </div>
                                    <div className="text-sm text-blue-600 underline truncate">
                                      {email}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-brand-text-weak truncate">
                                      {jobTitle && <span className="font-semibold text-brand-text-strong truncate">{jobTitle}</span>}
                                      {jobTitle && locationLabel && <span>·</span>}
                                      <span className="flex items-center gap-1 min-w-0 truncate">
                                        <Location size={12} className="shrink-0 text-brand-stroke-strong" />
                                        <span className="truncate">{locationLabel}</span>
                                      </span>
                                    </div>
                                  </div>
                                </button>
                                {showActions && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    {isRemoving ? (
                                      <span className="flex items-center gap-2 text-sm text-brand-text-weak">
                                        <LoadingSpinner size="sm" />
                                        Deleting
                                      </span>
                                    ) : (
                                      <>
                                    <button
                                      type="button"
                                      onClick={(e) => handleSendInvite(e, gig)}
                                      disabled={!hasEmail}
                                      className="p-2 rounded-md hover:bg-brand-stroke-weak text-brand-stroke-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={hasEmail ? "Send invite email" : "No email"}
                                      aria-label="Send invite email"
                                    >
                                      <Email size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleBookmark(e, gig)}
                                      className="p-2 rounded-md hover:bg-brand-stroke-weak text-brand-stroke-strong transition-colors"
                                      title={isBookmarked ? "Unbookmark" : "Bookmark"}
                                      aria-label={isBookmarked ? "Unbookmark" : "Bookmark"}
                                    >
                                      {isBookmarked ? (
                                        <BookmarkFilled size={16} className="text-brand" />
                                      ) : (
                                        <BookmarkAdd size={16} />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleRemove(e, gig)}
                                      className="p-2 rounded-md hover:bg-brand-stroke-weak text-red-600 transition-colors"
                                      title="Remove from list"
                                      aria-label="Remove candidate"
                                    >
                                      <TrashCan size={16} />
                                    </button>
                                    </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      {activeTab === TAB_ALL && visibleCandidates.length > 0 && (
                        <div className="sticky bottom-0 mt-4 pt-4 flex items-center justify-end gap-2 border-t border-brand-stroke-weak bg-brand-bg-white -mx-4 px-4 -mb-4 pb-4">
                          <button
                            type="button"
                            onClick={handleCancelExport}
                            className="px-4 py-2 rounded-lg border border-brand-stroke-border bg-brand-bg-white text-brand-text-strong text-sm font-medium hover:bg-brand-bg-fill transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleExportAs}
                            className="px-4 py-2 rounded-lg bg-brand-text-strong text-white text-sm font-medium hover:opacity-90 transition-colors"
                            title={selectedIds.size > 0 ? `Export ${selectedIds.size} selected` : "Export all"}
                          >
                            Export as
                          </button>
                        </div>
                      )}
                    </>
                  )}
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
