"use client";

import { useState, useEffect, useMemo } from "react";
import Modal from "../Modal";
import {
  Close,
  ArrowLeft,
  Email,
  TrashCan,
  BookmarkAdd,
  BookmarkFilled,
} from "@carbon/icons-react";
import { getAvatarUrlById } from "../../../lib/avatars";
import LoadingSpinner from "../LoadingSpinner";

const TAB_ALL = "all";
const TAB_BOOKMARKED = "bookmarked";
const TAB_INVITED = "invited";

export default function CandidateBucketModal({
  isOpen,
  onClose,
  onSelectCandidate,
}) {
  const [statesList, setStatesList] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [selectedState, setSelectedState] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState(null);
  const [activeTab, setActiveTab] = useState(TAB_ALL);
  const [bookmarkedIds, setBookmarkedIds] = useState(() => new Set());
  const [invitedIds, setInvitedIds] = useState(() => new Set());
  const [removedIds, setRemovedIds] = useState(() => new Set());

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

  const handleBackToStates = () => {
    setSelectedState(null);
    setCandidates([]);
    setCandidatesError(null);
    setActiveTab(TAB_ALL);
    setBookmarkedIds(new Set());
    setInvitedIds(new Set());
    setRemovedIds(new Set());
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
    // Placeholder: could call API or show toast later
  };

  const handleRemove = (e, gig) => {
    e.stopPropagation();
    setRemovedIds((prev) => new Set(prev).add(gig.id));
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
          className="bg-brand-bg-white rounded-lg border border-brand-stroke-weak shadow-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
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
                  "Candidate bucket"
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
                    {statesList.map((state, index) => (
                      <li key={index}>
                        <button
                          type="button"
                          onClick={() => setSelectedState(state)}
                          className="w-full flex items-center justify-between gap-2 py-3 px-3 rounded-lg border border-brand-stroke-weak bg-brand-bg-white hover:bg-brand-bg-fill hover:border-brand-stroke-border text-left transition-colors font-medium text-brand-text-strong"
                        >
                          {state}
                        </button>
                      </li>
                    ))}
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
                    <ul className="space-y-2">
                      {candidatesByTab.map((gig) => {
                        const name =
                          gig.user?.name || gig.title || "Candidate";
                        const email =
                          gig.email || gig.user?.email || "—";
                        const jobProfile =
                          gig.serviceType ||
                          (gig.jobSeekerExperience
                            ? "Job seeker"
                            : "Job seeker");
                        const stateLabel = gig.state || selectedState || "—";
                        const avatarUrl =
                          gig.user?.avatarUrl ||
                          (gig.user?.avatarId
                            ? getAvatarUrlById(gig.user.avatarId)
                            : "/avatars/avatar1.png");
                        const isBookmarked = bookmarkedIds.has(gig.id);
                        const showActions = activeTab === TAB_ALL;

                        return (
                          <li key={gig.id}>
                            <div className="flex items-center gap-4 p-3 rounded-lg border border-brand-stroke-weak bg-brand-bg-white hover:bg-brand-bg-fill transition-colors">
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
                                  <div className="text-sm text-brand-text-weak truncate">
                                    {email}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-xs text-brand-text-weak">
                                    <span>{jobProfile}</span>
                                    <span>·</span>
                                    <span>{stateLabel}</span>
                                  </div>
                                </div>
                              </button>
                              {showActions && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => handleSendInvite(e, gig)}
                                    className="p-2 rounded-md hover:bg-brand-stroke-weak text-brand-stroke-strong transition-colors"
                                    title="Send invite email"
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
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
