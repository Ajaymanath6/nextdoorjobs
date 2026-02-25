export const metadata = {
  title: "Admin",
  description: "Admin area",
};

export default function AdminLayout({ children }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-brand-bg-fill text-brand-text-strong">
      {children}
    </div>
  );
}
