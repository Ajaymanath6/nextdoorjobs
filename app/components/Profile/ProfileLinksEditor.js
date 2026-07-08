import ProfileSectionHeader from "./ProfileSectionHeader";
import { EMPTY_OTHER_LINK } from "../../../lib/resumeFormDefaults";

export default function ProfileLinksEditor({ form, setForm, inputClass, onChange }) {
  const updateLink = (field, value) => {
    onChange?.();
    setForm((f) => ({ ...f, [field]: value }));
  };

  return (
    <>
      <ProfileSectionHeader
        title="Portfolio & Links"
        description="LinkedIn, GitHub, portfolio, and other professional links."
      />
      <div className="space-y-2">
        {[
          ["linkedInUrl", "LinkedIn URL"],
          ["githubUrl", "GitHub URL"],
          ["portfolioUrl", "Portfolio Website"],
          ["behanceUrl", "Behance"],
          ["dribbbleUrl", "Dribbble"],
        ].map(([field, label]) => (
          <div key={field}>
            <label className="block text-xs text-brand-text-strong mb-1">{label}</label>
            <input
              value={form[field]}
              onChange={(e) => updateLink(field, e.target.value)}
              className={inputClass}
              placeholder={`https://...`}
            />
          </div>
        ))}
        <div className="pt-2">
          <p className="text-xs text-brand-text-strong mb-2">Other links</p>
          {form.otherLinks.map((link, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                value={link.label}
                onChange={(e) => {
                  onChange?.();
                  setForm((f) => ({
                    ...f,
                    otherLinks: f.otherLinks.map((l, i) =>
                      i === idx ? { ...l, label: e.target.value } : l
                    ),
                  }));
                }}
                className={`${inputClass} w-1/3`}
                placeholder="Label"
              />
              <input
                value={link.url}
                onChange={(e) => {
                  onChange?.();
                  setForm((f) => ({
                    ...f,
                    otherLinks: f.otherLinks.map((l, i) =>
                      i === idx ? { ...l, url: e.target.value } : l
                    ),
                  }));
                }}
                className={`${inputClass} flex-1`}
                placeholder="URL"
              />
              <button
                type="button"
                onClick={() => {
                  onChange?.();
                  setForm((f) => ({
                    ...f,
                    otherLinks: f.otherLinks.filter((_, i) => i !== idx),
                  }));
                }}
                className="text-sm text-brand-text-weak hover:text-brand px-2"
              >
                ×
              </button>
            </div>
          ))}
          {form.otherLinks.length < 10 && (
            <button
              type="button"
              onClick={() => {
                onChange?.();
                setForm((f) => ({
                  ...f,
                  otherLinks: [...f.otherLinks, { ...EMPTY_OTHER_LINK }],
                }));
              }}
              className="text-sm font-medium text-brand underline underline-offset-2 hover:opacity-80"
            >
              Add other link
            </button>
          )}
        </div>
      </div>
    </>
  );
}
