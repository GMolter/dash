import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  shortCode: string;
}

export function URLRedirect({ shortCode }: Props) {
  const [error, setError] = useState('');

  useEffect(() => {
    const redirect = async () => {
      const { data, error } = await supabase
        .from('short_urls')
        .select('target_url, clicks')
        .eq('short_code', shortCode)
        .maybeSingle();

      if (error || !data) {
        setError('Short URL not found');
        return;
      }

      await supabase
        .from('short_urls')
        .update({ clicks: data.clicks + 1 })
        .eq('short_code', shortCode);

      window.location.href = data.target_url;
    };

    redirect();
  }, [shortCode]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">404</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Redirecting...</p>
      </div>
    </div>
  );
}
