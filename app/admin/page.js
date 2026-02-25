"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { JOB_CATEGORIES } from "../../lib/constants/jobCategories";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const meRes = await fetch("/api/admin/me", { credentials: "include" });
      if (!meRes.ok) {
        if (!cancelled) router.replace("/admin/login");
        return;
      }
      const companiesRes = await fetch("/api/admin/companies", { credentials: "include" });
      if (companiesRes.ok) {
        const data = await companiesRes.json();
        if (!cancelled && data.companies) setCompanies(data.companies);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.replace("/admin/login");
    router.refresh();
  };

  const [viewSection, setViewSection] = useState("all"); // "all" | "gig" | "company"

  const handleViewAsUser = async () => {
    const res = await fetch("/api/admin/set-view-as", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role: "individual" }),
    });
    if (res.ok) window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg-fill">
        <p className="text-brand-text-weak">Loading…</p>
      </div>
    );
  }

  const refreshCompanies = () =>
    fetch("/api/admin/companies", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => d.companies && setCompanies(d.companies));

  return (
    <div className="min-h-screen bg-brand-bg-fill overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-8 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-brand-text-strong">Admin</h1>
          <div className="flex items-center gap-2">
            {viewSection !== "all" && (
              <button
                type="button"
                onClick={() => setViewSection("all")}
                className="rounded-md bg-brand-bg-white border-[1.5px] border-brand-stroke-weak text-brand-text-strong px-3 py-2 text-sm font-medium hover:bg-brand-bg-fill"
              >
                Back to admin
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-brand-bg-white border-[1.5px] border-brand-stroke-weak text-brand-text-strong px-3 py-2 text-sm font-medium hover:bg-brand-bg-fill"
            >
              Log out
            </button>
          </div>
        </div>

        <section className="rounded-md border border-brand-stroke-weak bg-brand-bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-brand-text-strong mb-2">View as</h2>
          <p className="text-sm text-brand-text-weak mb-4">Open the app as a user, or use the forms below to post as a gig worker or company.</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleViewAsUser}
              className="rounded-md bg-brand text-brand-bg-white px-4 py-2 text-sm font-medium hover:bg-brand-hover"
            >
              View as User
            </button>
            <button
              type="button"
              onClick={() => setViewSection("gig")}
              className="rounded-md bg-brand-bg-white border-[1.5px] border-brand-stroke-weak text-brand-text-strong px-4 py-2 text-sm font-medium hover:bg-brand-bg-fill"
            >
              View as Gig worker
            </button>
            <button
              type="button"
              onClick={() => setViewSection("company")}
              className="rounded-md bg-brand-bg-white border-[1.5px] border-brand-stroke-weak text-brand-text-strong px-4 py-2 text-sm font-medium hover:bg-brand-bg-fill"
            >
              View as Company
            </button>
          </div>
        </section>

        {viewSection === "all" && (
          <>
            <AddCompanyForm onSuccess={refreshCompanies} />
            <PostJobForm companies={companies} />
            <OnboardGigForm />
          </>
        )}
        {viewSection === "gig" && (
          <OnboardGigForm />
        )}
        {viewSection === "company" && (
          <PostJobForm companies={companies} />
        )}
      </div>
    </div>
  );
}

function AddCompanyForm({ onSuccess }) {
  const [status, setStatus] = useState({ type: null, text: "" });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    state: "",
    district: "",
    description: "",
    websiteUrl: "",
    fundingSeries: "",
    latitude: "",
    longitude: "",
    pincode: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: null, text: "" });
    setLoading(true);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ type: "error", text: data.error || "Failed" });
        setLoading(false);
        return;
      }
      setStatus({ type: "ok", text: "Company created." });
      setForm({ name: "", state: "", district: "", description: "", websiteUrl: "", fundingSeries: "", latitude: "", longitude: "", pincode: "" });
      onSuccess?.();
    } catch (err) {
      setStatus({ type: "error", text: "Network error." });
    }
    setLoading(false);
  };

  const inputClass = "w-full rounded-md border border-brand-stroke-strong focus:border-brand-text-strong focus:outline-none focus:ring-0 text-brand-text-strong placeholder:text-brand-text-placeholder px-3 py-2";
  return (
    <section className="rounded-md border border-brand-stroke-weak bg-brand-bg-white p-6 shadow">
      <h2 className="text-lg font-medium text-brand-text-strong mb-4">Add company</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" placeholder="Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} required />
        <input type="text" placeholder="State *" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} className={inputClass} required />
        <input type="text" placeholder="District *" value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} className={inputClass} required />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={inputClass} rows={2} />
        <input type="text" placeholder="Website URL" value={form.websiteUrl} onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))} className={inputClass} />
        <input type="text" placeholder="Latitude" value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} className={inputClass} />
        <input type="text" placeholder="Longitude" value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} className={inputClass} />
        <input type="text" placeholder="Pincode" value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))} className={inputClass} />
        {status.text && <p className={status.type === "error" ? "text-red-600 text-sm" : "text-green-600 text-sm"}>{status.text}</p>}
        <button type="submit" disabled={loading} className="rounded-md bg-brand text-brand-bg-white px-4 py-2 text-sm font-medium hover:bg-brand-hover disabled:opacity-50">Create company</button>
      </form>
    </section>
  );
}

function PostJobForm({ companies }) {
  const [status, setStatus] = useState({ type: null, text: "" });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyId: "",
    title: "",
    category: "EngineeringSoftwareQA",
    yearsRequired: "0",
    salaryMin: "",
    salaryMax: "",
    jobDescription: "",
    remoteType: "",
    seniorityLevel: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: null, text: "" });
    setLoading(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          companyId: parseInt(form.companyId, 10),
          yearsRequired: parseFloat(form.yearsRequired) || 0,
          salaryMin: form.salaryMin ? parseInt(form.salaryMin, 10) : null,
          salaryMax: form.salaryMax ? parseInt(form.salaryMax, 10) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ type: "error", text: data.error || "Failed" });
        setLoading(false);
        return;
      }
      setStatus({ type: "ok", text: "Job created." });
      setForm((f) => ({ ...f, title: "", jobDescription: "" }));
    } catch (err) {
      setStatus({ type: "error", text: "Network error." });
    }
    setLoading(false);
  };

  const inputClass = "w-full rounded-md border border-brand-stroke-strong focus:border-brand-text-strong focus:outline-none focus:ring-0 text-brand-text-strong placeholder:text-brand-text-placeholder px-3 py-2";
  return (
    <section className="rounded-md border border-brand-stroke-weak bg-brand-bg-white p-6 shadow">
      <h2 className="text-lg font-medium text-brand-text-strong mb-4">Post job</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <select value={form.companyId} onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))} className={inputClass} required>
          <option value="">Select company *</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input type="text" placeholder="Job title *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputClass} required />
        <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className={inputClass}>
          {JOB_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <input type="number" step="0.5" min="0" placeholder="Years required" value={form.yearsRequired} onChange={(e) => setForm((f) => ({ ...f, yearsRequired: e.target.value }))} className={inputClass} />
        <input type="number" placeholder="Salary min" value={form.salaryMin} onChange={(e) => setForm((f) => ({ ...f, salaryMin: e.target.value }))} className={inputClass} />
        <input type="number" placeholder="Salary max" value={form.salaryMax} onChange={(e) => setForm((f) => ({ ...f, salaryMax: e.target.value }))} className={inputClass} />
        <textarea placeholder="Job description *" value={form.jobDescription} onChange={(e) => setForm((f) => ({ ...f, jobDescription: e.target.value }))} className={inputClass} rows={3} required />
        <input type="text" placeholder="Remote type" value={form.remoteType} onChange={(e) => setForm((f) => ({ ...f, remoteType: e.target.value }))} className={inputClass} />
        <input type="text" placeholder="Seniority level" value={form.seniorityLevel} onChange={(e) => setForm((f) => ({ ...f, seniorityLevel: e.target.value }))} className={inputClass} />
        {status.text && <p className={status.type === "error" ? "text-red-600 text-sm" : "text-green-600 text-sm"}>{status.text}</p>}
        <button type="submit" disabled={loading} className="rounded-md bg-brand text-brand-bg-white px-4 py-2 text-sm font-medium hover:bg-brand-hover disabled:opacity-50">Create job</button>
      </form>
    </section>
  );
}

function OnboardGigForm() {
  const [status, setStatus] = useState({ type: null, text: "" });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    serviceType: "",
    state: "",
    district: "",
    description: "",
    expectedSalary: "",
    experienceWithGig: "",
    customersTillDate: "",
    pincode: "",
    locality: "",
    latitude: "",
    longitude: "",
    email: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: null, text: "" });
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
          customersTillDate: form.customersTillDate ? parseInt(form.customersTillDate, 10) : null,
          email: form.email.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ type: "error", text: data.error || "Failed" });
        setLoading(false);
        return;
      }
      setStatus({ type: "ok", text: "Gig created." });
      setForm((f) => ({ ...f, title: "", serviceType: "", description: "" }));
    } catch (err) {
      setStatus({ type: "error", text: "Network error." });
    }
    setLoading(false);
  };

  const inputClass = "w-full rounded-md border border-brand-stroke-strong focus:border-brand-text-strong focus:outline-none focus:ring-0 text-brand-text-strong placeholder:text-brand-text-placeholder px-3 py-2";
  return (
    <section className="rounded-md border border-brand-stroke-weak bg-brand-bg-white p-6 shadow">
      <h2 className="text-lg font-medium text-brand-text-strong mb-4">Onboard gig worker</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" placeholder="Gig title *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputClass} required />
        <input type="text" placeholder="Service type *" value={form.serviceType} onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))} className={inputClass} required />
        <input type="text" placeholder="State *" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} className={inputClass} required />
        <input type="text" placeholder="District *" value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} className={inputClass} required />
        <input type="email" placeholder="Gig worker email (optional)" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={inputClass} rows={2} />
        <input type="text" placeholder="Expected salary" value={form.expectedSalary} onChange={(e) => setForm((f) => ({ ...f, expectedSalary: e.target.value }))} className={inputClass} />
        <input type="text" placeholder="Experience" value={form.experienceWithGig} onChange={(e) => setForm((f) => ({ ...f, experienceWithGig: e.target.value }))} className={inputClass} />
        <input type="text" placeholder="Pincode" value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))} className={inputClass} />
        <input type="text" placeholder="Locality" value={form.locality} onChange={(e) => setForm((f) => ({ ...f, locality: e.target.value }))} className={inputClass} />
        <input type="number" step="any" placeholder="Latitude" value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} className={inputClass} />
        <input type="number" step="any" placeholder="Longitude" value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} className={inputClass} />
        {status.text && <p className={status.type === "error" ? "text-red-600 text-sm" : "text-green-600 text-sm"}>{status.text}</p>}
        <button type="submit" disabled={loading} className="rounded-md bg-brand text-brand-bg-white px-4 py-2 text-sm font-medium hover:bg-brand-hover disabled:opacity-50">Create gig</button>
      </form>
    </section>
  );
}
