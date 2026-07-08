import ProfileSectionHeader from "./ProfileSectionHeader";
import { EMPTY_LANGUAGE } from "../../../lib/resumeFormDefaults";
import { LANGUAGE_PROFICIENCIES } from "../../../lib/constants/profileEnums";

const LANG_LABELS = {
  Basic: "Basic",
  Intermediate: "Intermediate",
  Fluent: "Fluent",
  Native: "Native",
};

export default function ProfileLanguagesEditor({ form, setForm, inputClass, onChange }) {
  return (
    <>
      <ProfileSectionHeader title="Languages" />
      {form.languages.map((lang, idx) => (
        <div
          key={idx}
          className="flex flex-wrap items-center gap-2 mb-2 p-3 rounded-lg border border-brand-stroke-weak"
        >
          <input
            value={lang.language}
            onChange={(e) => {
              onChange?.();
              setForm((f) => ({
                ...f,
                languages: f.languages.map((l, i) =>
                  i === idx ? { ...l, language: e.target.value } : l
                ),
              }));
            }}
            className={`${inputClass} flex-1 min-w-[120px]`}
            placeholder="Language"
          />
          <select
            value={lang.proficiency}
            onChange={(e) => {
              onChange?.();
              setForm((f) => ({
                ...f,
                languages: f.languages.map((l, i) =>
                  i === idx ? { ...l, proficiency: e.target.value } : l
                ),
              }));
            }}
            className={`${inputClass} w-36`}
          >
            {LANGUAGE_PROFICIENCIES.map((p) => (
              <option key={p} value={p}>
                {LANG_LABELS[p]}
              </option>
            ))}
          </select>
          {form.languages.length > 1 && (
            <button
              type="button"
              onClick={() => {
                onChange?.();
                setForm((f) => ({
                  ...f,
                  languages: f.languages.filter((_, i) => i !== idx),
                }));
              }}
              className="text-sm text-brand-text-weak hover:text-brand"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      {form.languages.length < 10 && (
        <button
          type="button"
          onClick={() => {
            onChange?.();
            setForm((f) => ({
              ...f,
              languages: [...f.languages, { ...EMPTY_LANGUAGE }],
            }));
          }}
          className="text-sm font-medium text-brand underline underline-offset-2 hover:opacity-80"
        >
          Add language
        </button>
      )}
    </>
  );
}
