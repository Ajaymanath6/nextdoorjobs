"use client";

import { useState, useEffect } from "react";
import Modal from "../Modal";
import { Close, ArrowLeft } from "@carbon/icons-react";
import { getAvatarUrlById } from "../../../lib/avatars";

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

          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {!selectedState ? (
              <>
                {statesLoading && (
                  <div className="text-center py-8 text-brand-text-weak">
                    Loading states…
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
                  <div className="text-center py-8 text-brand-text-weak">
                    Loading candidates…
                  </div>
                )}
                {candidatesError && (
                  <div className="text-center py-8 text-brand-text-weak">
                    {candidatesError}
                  </div>
                )}
                {!candidatesLoading && !candidatesError && candidates.length === 0 && (
                  <div className="text-center py-8 text-brand-text-weak">
                    No candidates in this state.
                  </div>
                )}
                {!candidatesLoading && !candidatesError && candidates.length > 0 && (
                  <ul className="space-y-2">
                    {candidates.map((gig) => {
                      const name =
                        gig.user?.name || gig.title || "Candidate";
                      const email = gig.email || gig.user?.email || "—";
                      const jobProfile =
                        gig.serviceType ||
                        (gig.jobSeekerExperience ? "Job seeker" : "Job seeker");
                      const stateLabel = gig.state || selectedState || "—";
                      const avatarUrl =
                        gig.user?.avatarUrl ||
                        (gig.user?.avatarId
                          ? getAvatarUrlById(gig.user.avatarId)
                          : "/avatars/avatar1.png");

                      return (
                        <li key={gig.id}>
                          <button
                            type="button"
                            onClick={() => handleRowClick(gig)}
                            className="w-full flex items-center gap-4 p-3 rounded-lg border border-brand-stroke-weak bg-brand-bg-white hover:bg-brand-bg-fill text-left transition-colors"
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
