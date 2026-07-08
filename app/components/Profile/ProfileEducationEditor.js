import ProfileSectionHeader from "./ProfileSectionHeader";
import { EMPTY_EDUCATION } from "../../../lib/resumeFormDefaults";

export default function ProfileEducationEditor({
  form,
  setForm,
  inputClass,
  handleTextInput,
  handleNumericInput,
  onChange,
}) {
  return (
    <>
      <ProfileSectionHeader title="Education" />
      {form.educations.map((e, idx) => (
        <div key={idx} className="mb-4 p-3 rounded-lg border border-brand-stroke-weak space-y-2">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                onChange?.();
                setForm((f) => ({
                  ...f,
                  educations: f.educations.filter((_, i) => i !== idx),
                }));
              }}
              className="text-sm text-brand-text-weak hover:text-brand"
            >
              Remove
            </button>
          </div>
          <input
            value={e.degree}
            onChange={(ev) => {
              onChange?.();
              setForm((f) => ({
                ...f,
                educations: f.educations.map((x, i) =>
                  i === idx ? { ...x, degree: handleTextInput(ev.target.value) } : x
                ),
              }));
            }}
            className={inputClass}
            placeholder="Degree (e.g. B.Tech, MBA)"
          />
          <input
            value={e.specialization}
            onChange={(ev) => {
              onChange?.();
              setForm((f) => ({
                ...f,
                educations: f.educations.map((x, i) =>
                  i === idx
                    ? { ...x, specialization: handleTextInput(ev.target.value), streamName: handleTextInput(ev.target.value) }
                    : x
                ),
              }));
            }}
            className={inputClass}
            placeholder="Specialization / Stream"
          />
          <input
            value={e.universityName}
            onChange={(ev) => {
              onChange?.();
              setForm((f) => ({
                ...f,
                educations: f.educations.map((x, i) =>
                  i === idx ? { ...x, universityName: handleTextInput(ev.target.value) } : x
                ),
              }));
            }}
            className={inputClass}
            placeholder="College / University"
          />
          <input
            value={e.marksOrScore}
            onChange={(ev) => {
              onChange?.();
              setForm((f) => ({
                ...f,
                educations: f.educations.map((x, i) =>
                  i === idx ? { ...x, marksOrScore: ev.target.value } : x
                ),
              }));
            }}
            className={inputClass}
            placeholder="Percentage / CGPA"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={e.startYear}
              onChange={(ev) => {
                onChange?.();
                setForm((f) => ({
                  ...f,
                  educations: f.educations.map((x, i) =>
                    i === idx ? { ...x, startYear: handleNumericInput(ev.target.value) } : x
                  ),
                }));
              }}
              className={inputClass}
              placeholder="Start year"
              maxLength={4}
            />
            <input
              value={e.endYear}
              onChange={(ev) => {
                onChange?.();
                const val = handleNumericInput(ev.target.value);
                setForm((f) => ({
                  ...f,
                  educations: f.educations.map((x, i) =>
                    i === idx ? { ...x, endYear: val, yearOfPassing: val } : x
                  ),
                }));
              }}
              className={inputClass}
              placeholder="End year"
              maxLength={4}
            />
          </div>
        </div>
      ))}
      {form.educations.length < 5 && (
        <button
          type="button"
          onClick={() => {
            onChange?.();
            setForm((f) => ({
              ...f,
              educations: [...f.educations, { ...EMPTY_EDUCATION }],
            }));
          }}
          className="text-sm font-medium text-brand underline underline-offset-2 hover:opacity-80"
        >
          Add education
        </button>
      )}
    </>
  );
}
