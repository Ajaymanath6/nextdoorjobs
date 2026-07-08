import ProfileSectionHeader from "./ProfileSectionHeader";
import { EMPTY_CERT } from "../../../lib/resumeFormDefaults";

export default function ProfileCertificationsEditor({ form, setForm, inputClass, onChange }) {
  return (
    <>
      <ProfileSectionHeader title="Certifications" />
      {form.certifications.length === 0 ? (
        <p className="text-xs text-brand-text-weak mb-2">No certifications added yet.</p>
      ) : (
        form.certifications.map((cert, idx) => (
          <div key={idx} className="mb-3 p-3 rounded-lg border border-brand-stroke-weak space-y-2">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onChange?.();
                  setForm((f) => ({
                    ...f,
                    certifications: f.certifications.filter((_, i) => i !== idx),
                  }));
                }}
                className="text-sm text-brand-text-weak hover:text-brand"
              >
                Remove
              </button>
            </div>
            <input
              value={cert.name}
              onChange={(e) => {
                onChange?.();
                setForm((f) => ({
                  ...f,
                  certifications: f.certifications.map((c, i) =>
                    i === idx ? { ...c, name: e.target.value } : c
                  ),
                }));
              }}
              className={inputClass}
              placeholder="Certification name"
            />
            <input
              value={cert.issuingOrg}
              onChange={(e) => {
                onChange?.();
                setForm((f) => ({
                  ...f,
                  certifications: f.certifications.map((c, i) =>
                    i === idx ? { ...c, issuingOrg: e.target.value } : c
                  ),
                }));
              }}
              className={inputClass}
              placeholder="Issuing organization"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={cert.year}
                onChange={(e) => {
                  onChange?.();
                  setForm((f) => ({
                    ...f,
                    certifications: f.certifications.map((c, i) =>
                      i === idx ? { ...c, year: e.target.value.replace(/\D/g, "").slice(0, 4) } : c
                    ),
                  }));
                }}
                className={inputClass}
                placeholder="Year"
                maxLength={4}
              />
              <input
                value={cert.certificateUrl}
                onChange={(e) => {
                  onChange?.();
                  setForm((f) => ({
                    ...f,
                    certifications: f.certifications.map((c, i) =>
                      i === idx ? { ...c, certificateUrl: e.target.value } : c
                    ),
                  }));
                }}
                className={inputClass}
                placeholder="Certificate URL"
              />
            </div>
          </div>
        ))
      )}
      {form.certifications.length < 10 && (
        <button
          type="button"
          onClick={() => {
            onChange?.();
            setForm((f) => ({
              ...f,
              certifications: [...f.certifications, { ...EMPTY_CERT }],
            }));
          }}
          className="text-sm font-medium text-brand underline underline-offset-2 hover:opacity-80"
        >
          Add certification
        </button>
      )}
    </>
  );
}
