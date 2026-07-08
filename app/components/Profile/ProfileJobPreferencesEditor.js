import ProfileSectionHeader from "./ProfileSectionHeader";
import { JOB_LOOKING_FOR, WORK_MODES, NOTICE_PERIODS } from "../../../lib/constants/profileEnums";

const LOOKING_LABELS = {
  FullTime: "Full-Time Job",
  PartTime: "Part-Time Job",
  Freelance: "Freelance Gig",
  Internship: "Internship",
};

const WORK_MODE_LABELS = {
  Onsite: "Onsite",
  Remote: "Remote",
  Hybrid: "Hybrid",
};

const NOTICE_LABELS = {
  Immediate: "Immediate",
  Days15: "15 Days",
  Days30: "30 Days",
  Days60: "60 Days",
  Custom: "Custom",
};

export default function ProfileJobPreferencesEditor({ form, setForm, inputClass, onChange }) {
  const toggleLookingFor = (value) => {
    onChange?.();
    setForm((f) => {
      const current = f.lookingFor || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...f, lookingFor: next };
    });
  };

  return (
    <>
      <ProfileSectionHeader title="Job Preferences" />
      <div className="space-y-3">
        <div>
          <p className="text-xs text-brand-text-strong mb-2">Looking for</p>
          <div className="flex flex-wrap gap-2">
            {JOB_LOOKING_FOR.map((opt) => (
              <label
                key={opt}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer ${
                  form.lookingFor?.includes(opt)
                    ? "border-brand bg-brand-bg-fill text-brand"
                    : "border-brand-stroke-weak text-brand-text-strong"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.lookingFor?.includes(opt)}
                  onChange={() => toggleLookingFor(opt)}
                  className="sr-only"
                />
                {LOOKING_LABELS[opt]}
              </label>
            ))}
          </div>
        </div>
        <input
          value={form.preferredJobRole}
          onChange={(e) => {
            onChange?.();
            setForm((f) => ({ ...f, preferredJobRole: e.target.value }));
          }}
          className={inputClass}
          placeholder="Preferred job role"
        />
        <input
          value={form.preferredIndustry}
          onChange={(e) => {
            onChange?.();
            setForm((f) => ({ ...f, preferredIndustry: e.target.value }));
          }}
          className={inputClass}
          placeholder="Preferred industry"
        />
        <div>
          <label className="block text-xs text-brand-text-strong mb-1">Work mode</label>
          <select
            value={form.workMode}
            onChange={(e) => {
              onChange?.();
              setForm((f) => ({ ...f, workMode: e.target.value }));
            }}
            className={inputClass}
          >
            <option value="">Select work mode</option>
            {WORK_MODES.map((m) => (
              <option key={m} value={m}>
                {WORK_MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-brand-text-strong mb-1">Available to join</label>
          <select
            value={form.noticePeriod}
            onChange={(e) => {
              onChange?.();
              setForm((f) => ({ ...f, noticePeriod: e.target.value }));
            }}
            className={inputClass}
          >
            <option value="">Select notice period</option>
            {NOTICE_PERIODS.map((p) => (
              <option key={p} value={p}>
                {NOTICE_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        {form.noticePeriod === "Custom" && (
          <input
            value={form.noticePeriodCustom}
            onChange={(e) => {
              onChange?.();
              setForm((f) => ({ ...f, noticePeriodCustom: e.target.value }));
            }}
            className={inputClass}
            placeholder="Custom notice period"
          />
        )}
      </div>
    </>
  );
}
