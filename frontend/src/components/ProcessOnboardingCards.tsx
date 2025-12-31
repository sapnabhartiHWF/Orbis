import { useEffect, useState } from "react";
import { getProcessOnboardingList } from "@/services/processOnboardingApi";

export default function ProcessOnboardingCards() {
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");
        const data = await getProcessOnboardingList(token);
        setProcesses(data.processes || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch onboarding data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
      {processes.length === 0 && (
        <div className="col-span-full text-gray-400">No onboarding processes found.</div>
      )}
      {processes.map((proc) => (
        <div 
          key={proc.Oid} 
          className="rounded-2xl shadow-lg bg-white/80 border border-indigo-100 p-6 flex flex-col gap-2 hover:shadow-xl transition-all"
        >
          <div className="text-xl font-bold text-indigo-700 mb-1">{proc.Name}</div>
          
          <div className="text-sm text-gray-600 mb-2">
            Owned By:{" "}
            {proc.OwnedBy ? (
              <span className="font-medium text-gray-800">{proc.OwnedBy}</span>
            ) : (
              <span className="italic text-gray-400">N/A</span>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            Department:{" "}
            {proc.Department ? (
              <span className="font-medium text-gray-800">{proc.Department}</span>
            ) : (
              <span className="italic text-gray-400">N/A</span>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            Description:{" "}
            {proc.Description ? (
              <span className="font-medium text-gray-800">{proc.Description}</span>
            ) : (
              <span className="italic text-gray-400">N/A</span>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            Tags:{" "}
            {proc.Tag ? (
              <span className="font-medium text-gray-800">{proc.Tag}</span>
            ) : (
              <span className="italic text-gray-400">N/A</span>
            )}
          </div>
          
          <div className="text-xs text-gray-400 mt-2">
            Created: {proc.CreatedAt ? new Date(proc.CreatedAt).toLocaleString() : "-"}
          </div>
        </div>
      ))}
    </div>
  );
}