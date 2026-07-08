export default function ProfileSectionHeader({ title, description }) {
  return (
    <div className="border-t border-brand-stroke-weak pt-4">
      <h3 className="text-sm font-medium text-brand-text-strong mb-1">{title}</h3>
      {description && <p className="text-xs text-brand-text-weak mb-3">{description}</p>}
    </div>
  );
}
