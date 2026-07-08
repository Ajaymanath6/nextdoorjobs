import ProfileSectionHeader from "./ProfileSectionHeader";
import { EMPTY_WORK } from "../../../lib/resumeFormDefaults";
import { EMPLOYMENT_TYPES } from "../../../lib/constants/profileEnums";

const EMPLOYMENT_LABELS = {
  FullTime: "Full-time",
  PartTime: "Part-time",
  Contract: "Contract",
  Internship: "Internship",
  Freelance: "Freelance",
};

export default function ProfileExperienceEditor({
  form,
  setForm,
  inputClass,
  handleTextInput,
  onChange,
}) {
  return (
    <>
      <ProfileSectionHeader title="Experience" />
      {form.workExperiences.map((w, idx) => (
        <div key={idx} className="mb-4 p-3 rounded-lg border border-brand-stroke-weak space-y-2">
          <div className="flex items-center justify-between gap-2">
            {idx > 0 && <p className="text-xs text-brand-text-weak">Previous company</p>}
            <button
              type="button"
              onClick={() => {
                onChange?.();
                setForm((f) => ({
                  ...f,
                  workExperiences: f.workExperiences.filter((_, i) => i !== idx),
                }));
              }}
              className="text-sm text-brand-text-weak hover:text-brand ml-auto"
            >
              Remove
            </button>
          </div>
          <input
            value={w.companyName}
            onChange={(e) => {
              onChange?.();
              setForm((f) => ({
                ...f,
                workExperiences: f.workExperiences.map((x, i) =>
                  i === idx ? { ...x, companyName: handleTextInput(e.target.value) } : x
                ),
              }));
            }}
            className={inputClass}
            placeholder="Company name"
          />
          <input
            value={w.companyUrl}
            onChange={(e) => {
              onChange?.();
              setForm((f) => ({
                ...f,
                workExperiences: f.workExperiences.map((x, i) =>
                  i === idx ? { ...x, companyUrl: e.target.value } : x
                ),
              }));
            }}
            className={inputClass}
            placeholder="Company URL"
          />
          <input
            value={w.position}
            onChange={(e) => {
              onChange?.();
              setForm((f) => ({
                ...f,
                workExperiences: f.workExperiences.map((x, i) =>
                  i === idx ? { ...x, position: handleTextInput(e.target.value) } : x
                ),
              }));
            }}
            className={inputClass}
            placeholder="Job title"
          />
          <select
            value={w.employmentType}
            onChange={(e) => {
              onChange?.();
              setForm((f) => ({
                ...f,
                workExperiences: f.workExperiences.map((x, i) =>
                  i === idx ? { ...x, employmentType: e.target.value } : x
                ),
              }));
            }}
            className={inputClass}
          >
            <option value="">Employment type</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EMPLOYMENT_LABELS[t]}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="month"
              value={w.startDate}
              onChange={(e) => {
                onChange?.();
                setForm((f) => ({
                  ...f,
                  workExperiences: f.workExperiences.map((x, i) =>
                    i === idx ? { ...x, startDate: e.target.value } : x
                  ),
                }));
              }}
              className={inputClass}
              placeholder="Start date"
            />
            <input
              type="month"
              value={w.endDate}
              disabled={w.isCurrent}
              onChange={(e) => {
                onChange?.();
                setForm((f) => ({
                  ...f,
                  workExperiences: f.workExperiences.map((x, i) =>
                    i === idx ? { ...x, endDate: e.target.value } : x
                  ),
                }));
              }}
              className={`${inputClass} disabled:opacity-50`}
              placeholder="End date"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-brand-text-strong">
            <input
              type="checkbox"
              checked={w.isCurrent}
              onChange={(e) => {
                onChange?.();
                setForm((f) => ({
                  ...f,
                  workExperiences: f.workExperiences.map((x, i) =>
                    i === idx ? { ...x, isCurrent: e.target.checked, endDate: "" } : x
                  ),
                }));
              }}
              className="rounded border-brand-stroke-strong"
            />
            Currently working here
          </label>
          <textarea
            value={w.responsibilities}
            onChange={(e) => {
              onChange?.();
              setForm((f) => ({
                ...f,
                workExperiences: f.workExperiences.map((x, i) =>
                  i === idx ? { ...x, responsibilities: e.target.value, duties: e.target.value } : x
                ),
              }));
            }}
            className={`${inputClass} min-h-[60px]`}
            placeholder="Responsibilities"
          />
          <textarea
            value={w.keyAchievements}
            onChange={(e) => {
              onChange?.();
              setForm((f) => ({
                ...f,
                workExperiences: f.workExperiences.map((x, i) =>
                  i === idx ? { ...x, keyAchievements: e.target.value } : x
                ),
              }));
            }}
            className={`${inputClass} min-h-[60px]`}
            placeholder="Key achievements"
          />
        </div>
      ))}
      {form.workExperiences.length < 5 && (
        <button
          type="button"
          onClick={() => {
            onChange?.();
            setForm((f) => ({
              ...f,
              workExperiences: [...f.workExperiences, { ...EMPTY_WORK }],
            }));
          }}
          className="text-sm font-medium text-brand underline underline-offset-2 hover:opacity-80"
        >
          Add experience
        </button>
      )}
    </>
  );
}
