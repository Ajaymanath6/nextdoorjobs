"use client";

import { useState, useEffect } from "react";
import Modal from "../Modal";
import { Close } from "@carbon/icons-react";
import { getAvatarUrlById } from "../../../lib/avatars";

export default function StateCandidatesModal({
  isOpen,
  onClose,
  stateName,
  onSelectCandidate,
}) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !stateName) {
      setCandidates([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/gigs?state=${encodeURIComponent(stateName)}`, {
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
      .catch(() => setError("Could not load candidates"))
      .finally(() => setLoading(false));
  }, [isOpen, stateName]);

  if (!isOpen) return null;

  const handleRowClick = (gig) => {
    if (onSelectCandidate) {
      onSelectCandidate(gig);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className="fixed inset-0 z-1002 flex items-center justify-center p-4 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="state-candidates-title"
      >
        <div
          className="bg-brand-bg-white rounded-lg border border-brand-stroke-weak shadow-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ fontFamily: "Open Sans, sans-serif" }}
        >
          <div className="shrink-0 flex items-center justify-between gap-4 p-4 border-b border-brand-stroke-weak">
            <h2
              id="state-candidates-title"
              className="text-lg font-semibold text-brand-text-strong"
            >
              Candidates in {stateName || "state"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-brand-bg-fill transition-colors"
              aria-label="Close"
            >
              <Close size={24} className="text-brand-stroke-strong" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {loading && (
              <div className="text-center py-8 text-brand-text-weak">
                Loading candidates…
              </div>
            )}
            {error && (
              <div className="text-center py-8 text-brand-text-weak">{error}</div>
            )}
            {!loading && !error && candidates.length === 0 && (
              <div className="text-center py-8 text-brand-text-weak">
                No candidates in this state.
              </div>
            )}
            {!loading && !error && candidates.length > 0 && (
              <ul className="space-y-2">
                {candidates.map((gig) => {
                  const name =
                    gig.user?.name || gig.title || "Candidate";
                  const email = gig.email || gig.user?.email || "—";
                  const jobProfile =
                    gig.serviceType ||
                    (gig.jobSeekerExperience
                      ? "Job seeker"
                      : "Job seeker");
                  const stateLabel = gig.state || stateName || "—";
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
          </div>
        </div>
      </div>
    </Modal>
  );
}
