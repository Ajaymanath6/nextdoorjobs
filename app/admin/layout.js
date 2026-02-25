export const metadata = {
  title: "Admin",
  description: "Admin area",
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-brand-bg-fill text-brand-text-strong">
      {children}
    </div>
  );
}
