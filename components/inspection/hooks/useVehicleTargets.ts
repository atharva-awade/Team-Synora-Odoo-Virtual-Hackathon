import { useEffect, useState, useCallback } from "react";

interface ArTarget {
  vehicleId: string;
  regNo: string;
  name: string;
  status: string;
  pngUrl: string;
  mindUrl: string;
}

export function useVehicleTargets() {
  const [targets, setTargets] = useState<ArTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTargets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ar/manifest");
      if (!res.ok) throw new Error("Failed to fetch targets");
      const data = await res.json();
      setTargets(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  return { targets, loading, error, refetch: fetchTargets };
}