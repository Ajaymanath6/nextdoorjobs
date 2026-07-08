import ProfileSectionHeader from "./ProfileSectionHeader";
import { EMPTY_SKILL } from "../../../lib/resumeFormDefaults";
import { SKILL_PROFICIENCIES } from "../../../lib/constants/profileEnums";

const PROFICIENCY_LABELS = {
  Beginner: "Beginner",
  Intermediate: "Intermediate",
  Advanced: "Advanced",
  Expert: "Expert",
};

export default function ProfileSkillsEditor({ form, setForm, inputClass, onChange }) {
  return (
    <>
      <ProfileSectionHeader
        title="Skills"
        description="Add primary and secondary skills with proficiency levels."
      />
      <div className="space-y-2">
        {form.skills.map((skill, idx) => (
          <div
            key={idx}
            className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-brand-stroke-weak"
          >
            <input
              value={skill.name}
              onChange={(e) => {
                onChange?.();
                setForm((f) => ({
                  ...f,
                  skills: f.skills.map((s, i) =>
                    i === idx ? { ...s, name: e.target.value } : s
                  ),
                }));
              }}
              className={`${inputClass} flex-1 min-w-[120px]`}
              placeholder="Skill name"
            />
            <select
              value={skill.proficiency}
              onChange={(e) => {
                onChange?.();
                setForm((f) => ({
                  ...f,
                  skills: f.skills.map((s, i) =>
                    i === idx ? { ...s, proficiency: e.target.value } : s
                  ),
                }));
              }}
              className={`${inputClass} w-36`}
            >
              {SKILL_PROFICIENCIES.map((p) => (
                <option key={p} value={p}>
                  {PROFICIENCY_LABELS[p]}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-brand-text-strong shrink-0">
              <input
                type="checkbox"
                checked={skill.isPrimary}
                onChange={(e) => {
                  onChange?.();
                  setForm((f) => ({
                    ...f,
                    skills: f.skills.map((s, i) =>
                      i === idx ? { ...s, isPrimary: e.target.checked } : s
                    ),
                  }));
                }}
                className="rounded border-brand-stroke-strong"
              />
              Primary
            </label>
            {form.skills.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  onChange?.();
                  setForm((f) => ({
                    ...f,
                    skills: f.skills.filter((_, i) => i !== idx),
                  }));
                }}
                className="text-sm text-brand-text-weak hover:text-brand"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {form.skills.length < 20 && (
          <button
            type="button"
            onClick={() => {
              onChange?.();
              setForm((f) => ({ ...f, skills: [...f.skills, { ...EMPTY_SKILL }] }));
            }}
            className="text-sm font-medium text-brand underline underline-offset-2 hover:opacity-80"
          >
            Add skill
          </button>
        )}
      </div>
    </>
  );
}
