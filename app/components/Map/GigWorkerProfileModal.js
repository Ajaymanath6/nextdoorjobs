"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "../Modal";
import { Close, StarFilled, Star, Add } from "@carbon/icons-react";
import { getAvatarUrlById } from "../../../lib/avatars";

function StarRating({ rating, max = 5 }) {
  const r = Math.min(max, Math.max(0, Math.round(rating)));
  return (
    <span className="flex items-center gap-0.5" aria-label={`${r} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) =>
        i < r ? (
          <StarFilled key={i} size={16} className="text-brand fill-brand shrink-0" />
        ) : (
          <Star key={i} size={16} className="text-brand-stroke-weak shrink-0" />
        )
      )}
    </span>
  );
}

export default function GigWorkerProfileModal({ isOpen, onClose, gig: initialGig }) {
  const [gig, setGig] = useState(initialGig);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [portfolioError, setPortfolioError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !initialGig?.id) {
      setGig(initialGig);
      setError(null);
      return;
    }
    setGig(initialGig);
    setError(null);
    setPortfolioError(null);
    setLoading(true);
    fetch(`/api/gigs/${initialGig.id}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((data) => setGig(data))
      .catch(() => setError("Could not load full profile"))
      .finally(() => setLoading(false));
  }, [isOpen, initialGig?.id]);

  const handlePortfolioFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !gig?.id) return;
    e.target.value = "";
    if (!file.type.startsWith("image/")) {
      setPortfolioError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPortfolioError("File size must be less than 5MB");
      return;
    }
    setPortfolioUploading(true);
    setPortfolioError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const uploadRes = await fetch("/api/profile/avatar/upload", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploadData.success || !uploadData.url) {
        setPortfolioError(uploadData.error || "Upload failed");
        setPortfolioUploading(false);
        return;
      }
      const addRes = await fetch(`/api/gigs/${gig.id}/portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ imageUrl: uploadData.url }),
      });
      const addData = await addRes.json().catch(() => ({}));
      if (addRes.ok && addData.image) {
        setGig((prev) => ({
          ...prev,
          portfolioImages: [...(prev?.portfolioImages ?? []), addData.image],
        }));
      } else {
        setPortfolioError(addData.error || "Failed to add photo");
      }
    } catch (err) {
      setPortfolioError("Network or server error. Try again.");
    } finally {
      setPortfolioUploading(false);
    }
  };

  if (!isOpen) return null;

  const user = gig?.user;
  const userName = user?.name || "Gig worker";
  const avatarUrl = user?.avatarUrl || (user?.avatarId ? getAvatarUrlById(user.avatarId) : "/avatars/avatar1.png");
  const portfolioImages = gig?.portfolioImages ?? [];
  const reviews = gig?.reviews ?? [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
  const instagramLink = gig?.instagramLink?.trim() || null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className="fixed inset-0 z-[1002] flex items-center justify-center p-4 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gig-profile-title"
      >
        <div
          className="bg-brand-bg-white rounded-lg border border-brand-stroke-weak shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="shrink-0 flex items-start justify-between gap-4 p-6 border-b border-brand-stroke-weak">
            <div className="flex gap-4 min-w-0">
              <img
                src={avatarUrl}
                alt={userName}
                className="w-16 h-16 rounded-full object-cover border-2 border-brand-stroke-weak shrink-0"
                onError={(e) => {
                  e.target.src = "/avatars/avatar1.png";
                }}
              />
              <div className="min-w-0">
                <h2 id="gig-profile-title" className="text-xl font-semibold text-brand-text-strong truncate">
                  {userName}
                </h2>
                <p className="text-brand-text-weak font-medium">{gig?.title || ""}</p>
                <p className="text-sm text-brand-text-weak">{gig?.serviceType || ""}</p>
                {user?.email && (
                  <a
                    href={`mailto:${user.email}`}
                    className="text-sm text-brand hover:underline mt-1 inline-block"
                  >
                    {user.email}
                  </a>
                )}
                {user?.phone && (
                  <p className="text-sm text-brand-text-weak mt-0.5">{user.phone}</p>
                )}
              </div>
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

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading && (
              <p className="text-brand-text-weak text-sm">Loading profile…</p>
            )}
            {error && (
              <p className="text-red-600 text-sm" role="alert">{error}</p>
            )}

            {!loading && gig && (
              <>
                <section>
                  <h3 className="text-sm font-semibold text-brand-text-strong mb-2">About &amp; location</h3>
                  <div className="text-sm text-brand-text-weak space-y-1">
                    {gig.description && (
                      <p className="text-brand-text-strong">{gig.description}</p>
                    )}
                    <p>
                      <strong>Location:</strong> {[gig.district, gig.state].filter(Boolean).join(", ")}
                      {gig.pincode ? ` – ${gig.pincode}` : ""}
                    </p>
                    {gig.expectedSalary && (
                      <p><strong>Expected salary:</strong> {gig.expectedSalary}</p>
                    )}
                    {gig.experienceWithGig && (
                      <p><strong>Experience:</strong> {gig.experienceWithGig}</p>
                    )}
                    {gig.customersTillDate != null && (
                      <p><strong>Customers served:</strong> {gig.customersTillDate}</p>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-brand-text-strong mb-2">Work gallery</h3>
                  <div className="flex flex-wrap items-start gap-3">
                    {portfolioImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {portfolioImages.map((img) => (
                          <div key={img.id} className="aspect-square rounded-lg overflow-hidden border border-brand-stroke-weak bg-brand-bg-fill">
                            <img
                              src={img.imageUrl}
                              alt={img.caption || "Portfolio"}
                              className="w-full h-full object-cover"
                            />
                            {img.caption && (
                              <p className="text-xs text-brand-text-weak p-2 truncate">{img.caption}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {gig?.isOwner && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          aria-label="Upload portfolio photo"
                          onChange={handlePortfolioFileChange}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={portfolioUploading}
                          className="w-14 h-14 rounded-full border-2 border-dashed border-brand-stroke-weak bg-brand-bg-fill flex items-center justify-center text-brand-stroke-strong hover:border-brand hover:text-brand hover:bg-brand-bg-fill transition-colors disabled:opacity-50 disabled:pointer-events-none shrink-0"
                          aria-label="Add portfolio photo"
                        >
                          <Add size={28} className="shrink-0" />
                        </button>
                      </>
                    )}
                    {portfolioImages.length === 0 && !gig?.isOwner && (
                      <p className="text-sm text-brand-text-weak">No portfolio photos yet.</p>
                    )}
                  </div>
                  {portfolioError && (
                    <p className="text-sm text-red-600 mt-2" role="alert">{portfolioError}</p>
                  )}
                  {instagramLink && (
                    <a
                      href={instagramLink.startsWith("http") ? instagramLink : `https://${instagramLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-2 text-brand font-medium text-sm hover:underline"
                    >
                      See more on Instagram (reels &amp; video)
                    </a>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-brand-text-strong mb-2">Customer reviews</h3>
                  {reviews.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <StarRating rating={avgRating} />
                        <span className="text-sm text-brand-text-weak">
                          {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                        </span>
                      </div>
                      <ul className="space-y-3">
                        {reviews.map((rev) => (
                          <li
                            key={rev.id}
                            className="p-3 rounded-lg border border-brand-stroke-weak bg-brand-bg-fill"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <StarRating rating={rev.rating} />
                              <span className="text-xs text-brand-text-weak">
                                {rev.reviewer?.name || "Customer"} · {new Date(rev.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {rev.comment && (
                              <p className="text-sm text-brand-text-strong mt-1">{rev.comment}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-sm text-brand-text-weak">No reviews yet.</p>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
