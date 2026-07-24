"use client";

import { User } from "@phosphor-icons/react";
import { getAvatarUrlById } from "../../../lib/avatars";

/**
 * Full-width list row for Home Gigs (mirrors JobListRow layout).
 */
export default function GigListRow({ gig, onSelect }) {
  const title = gig?.title || gig?.user?.name || "Gig";
  const serviceType = gig?.serviceType || null;
  const location = [gig?.locality, gig?.district, gig?.state]
    .filter(Boolean)
    .join(", ");
  const salary = gig?.expectedSalary || null;
  const avatarSrc = gig?.user?.avatarUrl
    ? gig.user.avatarUrl
    : gig?.user?.avatarId
      ? getAvatarUrlById(gig.user.avatarId)
      : null;

  const details = [serviceType, salary, location || null].filter(Boolean);
  const selectable = typeof onSelect === "function";

  const handleActivate = () => {
    if (selectable) onSelect(gig);
  };

  return (
    <li
      className={`list-none border-b border-brand-stroke-weak last:border-b-0 ${
        selectable ? "cursor-pointer" : ""
      }`}
    >
      <div
        role={selectable ? "button" : undefined}
        tabIndex={selectable ? 0 : undefined}
        onClick={selectable ? handleActivate : undefined}
        onKeyDown={
          selectable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleActivate();
                }
              }
            : undefined
        }
        className={`flex items-center gap-4 py-4 px-1 md:px-2 transition-colors ${
          selectable ? "cursor-pointer hover:bg-brand-bg-fill/60" : "hover:bg-brand-bg-fill/60"
        }`}
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-brand-stroke-weak bg-brand-bg-fill">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User size={28} className="text-brand-stroke-strong" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-brand-text-strong truncate">
            {title}
          </h3>
          {details.length > 0 && (
            <p className="mt-1 text-sm text-brand-text-weak truncate">
              {details.join(" · ")}
            </p>
          )}
        </div>

        <div className="shrink-0">
          <span className="text-xs font-medium text-brand underline">View</span>
        </div>
      </div>
    </li>
  );
}
