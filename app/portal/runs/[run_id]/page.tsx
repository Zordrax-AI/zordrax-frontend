'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function RunPortal() {
  const params = useParams();
  const runId = (params?.run_id as string) || '';
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`http://localhost:8010/api/runs/${runId}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || e));
      }
    }

    poll();
    const t = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(t); };
  }, [runId]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Run Portal</h1>
      <p><b>Run ID:</b> {runId || '(missing)'}</p>
      {error ? <pre style={{ color: 'crimson' }}>{error}</pre> : null}
      <pre style={{ background: '#111', color: '#eee', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
        {data ? JSON.stringify(data, null, 2) : 'Waiting for data...'}
      </pre>
    </main>
  );
}
