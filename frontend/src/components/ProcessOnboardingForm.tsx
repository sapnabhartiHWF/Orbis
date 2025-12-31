import { useState } from "react";
import { createProcessOnboarding } from "@/services/processOnboardingApi";

export default function ProcessOnboardingForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({
    Name: "",
    OwnedBy: "",
    Department: "",
    Description: "",
    Tag: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");
      await createProcessOnboarding(form, token);
      setForm({ Name: "", OwnedBy: "", Department: "", Description: "", Tag: "" });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create process onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-xl shadow-md max-w-xl mx-auto">
      <div>
        <label className="block font-semibold mb-1">Process Name</label>
        <input name="Name" value={form.Name} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
      </div>
      <div>
        <label className="block font-semibold mb-1">Owned By</label>
        <input name="OwnedBy" value={form.OwnedBy} onChange={handleChange} className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block font-semibold mb-1">Department</label>
        <input name="Department" value={form.Department} onChange={handleChange} className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block font-semibold mb-1">Description</label>
        <textarea name="Description" value={form.Description} onChange={handleChange} className="w-full border rounded px-3 py-2 min-h-[60px]" />
      </div>
      <div>
        <label className="block font-semibold mb-1">Tags</label>
        <input name="Tag" value={form.Tag} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Comma separated" />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded font-bold" disabled={loading}>
        {loading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
