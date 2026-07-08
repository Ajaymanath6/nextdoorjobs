import ProfileSectionHeader from "./ProfileSectionHeader";

export default function ProfileSalaryEditor({ form, setForm, inputClass, onChange }) {
  return (
    <>
      <ProfileSectionHeader title="Salary Information" />
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-brand-text-strong mb-1">Currency</label>
            <select
              value={form.salaryCurrency}
              onChange={(e) => {
                onChange?.();
                setForm((f) => ({ ...f, salaryCurrency: e.target.value }));
              }}
              className={inputClass}
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm text-brand-text-strong cursor-pointer">
              <input
                type="checkbox"
                checked={form.salaryNegotiable}
                onChange={(e) => {
                  onChange?.();
                  setForm((f) => ({ ...f, salaryNegotiable: e.target.checked }));
                }}
                className="rounded border-brand-stroke-strong"
              />
              Negotiable
            </label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-brand-text-strong mb-1">Expected salary</label>
            <input
              value={form.expectedSalaryPackage}
              onChange={(e) => {
                onChange?.();
                setForm((f) => ({ ...f, expectedSalaryPackage: e.target.value }));
              }}
              className={inputClass}
              placeholder="e.g. 10 LPA"
            />
          </div>
          <div>
            <label className="block text-sm text-brand-text-strong mb-1">Current salary</label>
            <div className="flex items-center gap-2">
              <input
                value={form.currentSalaryPackage}
                onChange={(e) => {
                  onChange?.();
                  setForm((f) => ({ ...f, currentSalaryPackage: e.target.value }));
                }}
                className={`${inputClass} flex-1`}
                placeholder="e.g. 8 LPA"
              />
              <label className="flex items-center gap-1.5 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.currentSalaryVisibleToRecruiter}
                  onChange={(e) => {
                    onChange?.();
                    setForm((f) => ({
                      ...f,
                      currentSalaryVisibleToRecruiter: e.target.checked,
                    }));
                  }}
                  className="rounded border-brand-stroke-strong"
                />
                <span className="text-xs text-brand-text-strong">Visible</span>
              </label>
            </div>
          </div>
        </div>
        <p className="text-xs text-brand-text-weak">Gig worker rates (optional)</p>
        <div className="grid grid-cols-3 gap-2">
          <input
            value={form.hourlyRate}
            onChange={(e) => {
              onChange?.();
              setForm((f) => ({ ...f, hourlyRate: e.target.value }));
            }}
            className={inputClass}
            placeholder="Hourly rate"
          />
          <input
            value={form.dailyRate}
            onChange={(e) => {
              onChange?.();
              setForm((f) => ({ ...f, dailyRate: e.target.value }));
            }}
            className={inputClass}
            placeholder="Daily rate"
          />
          <input
            value={form.projectRate}
            onChange={(e) => {
              onChange?.();
              setForm((f) => ({ ...f, projectRate: e.target.value }));
            }}
            className={inputClass}
            placeholder="Project rate"
          />
        </div>
      </div>
    </>
  );
}
