import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api";

// Fetches `path` from the API (e.g. "/hotels?featured=true"). Pass null to skip.
const useFetch = (path, initialData = []) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      setData(await apiRequest(path));
    } catch (err) {
      setError(err);
    }
    setLoading(false);
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reFetch: load };
};

export default useFetch;
