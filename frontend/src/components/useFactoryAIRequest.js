import { useCallback, useEffect, useRef, useState } from 'react';
export default function useFactoryAIRequest() {
  const current = useRef(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  useEffect(() => () => { const active = current.current; current.current = null; active?.abort(); }, []);
  const cancel = useCallback(() => {
    const active = current.current; current.current = null; active?.abort();
    setLoading(false); setStatus('Cancelled. No late response will replace this form.');
  }, []);
  const clear = useCallback(() => { setResult(null); setError(''); setStatus(''); }, []);
  const run = useCallback(async request => {
    if (current.current) return;
    const controller = new AbortController(); current.current = controller;
    setLoading(true); setResult(null); setError(''); setStatus('');
    try {
      const response = await request(controller.signal);
      if (current.current === controller && !controller.signal.aborted) setResult(response.data);
    } catch (cause) {
      if (current.current === controller && !controller.signal.aborted) setError(cause.response?.data?.error || cause.message || 'The AI request failed. Try again.');
    } finally {
      if (current.current === controller) { current.current = null; setLoading(false); }
    }
  }, []);
  return { loading, result, error, status, run, cancel, clear };
}
