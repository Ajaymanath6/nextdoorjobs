import ProfileSectionHeader from "./ProfileSectionHeader";

export default function ProfileProfessionalSummary({ form, setForm, inputClass, onChange }) {
  const aboutLen = (form.aboutMe || "").length;
  return (
    <>
      <ProfileSectionHeader
        title="Professional Summary"
        description="One of the most viewed sections by recruiters."
      />
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-brand-text-strong mb-1">Professional Headline</label>
          <input
            value={form.professionalHeadline}
            onChange={(e) => {
              onChange?.();
              setForm((f) => ({ ...f, professionalHeadline: e.target.value }));
            }}
            className={inputClass}
            placeholder='e.g. "Flutter Developer | 6 Years Experience"'
          />
        </div>
        <div>
          <label className="block text-sm text-brand-text-strong mb-1">About Me / Summary</label>
          <textarea
            value={form.aboutMe}
            onChange={(e) => {
              onChange?.();
              setForm((f) => ({ ...f, aboutMe: e.target.value }));
            }}
            className={`${inputClass} min-h-[100px]`}
            placeholder="Write a brief professional summary (200–500 characters)"
            maxLength={500}
          />
          <p
            className={`text-xs mt-1 ${
              aboutLen > 0 && (aboutLen < 200 || aboutLen > 500)
                ? "text-red-600"
                : "text-brand-text-weak"
            }`}
          >
            {aboutLen}/500 characters {aboutLen > 0 && aboutLen < 200 ? "(minimum 200)" : ""}
          </p>
        </div>
      </div>
    </>
  );
}
