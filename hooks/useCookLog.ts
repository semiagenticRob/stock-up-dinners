import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { CookLog } from '@/types/database';

export function useCookLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<CookLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('cook_log')
      .select('*')
      .eq('user_id', user.id)
      .order('cooked_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching cook log:', error);
    } else {
      setLogs(data ?? []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const logCook = useCallback(
    async (mealId: string, servingsCooked: number) => {
      if (!user) return;

      const { error } = await supabase.from('cook_log').insert({
        user_id: user.id,
        meal_id: mealId,
        servings_cooked: servingsCooked,
      });

      if (error) console.error('Error logging cook:', error);
      await fetchLogs();
    },
    [user, fetchLogs]
  );

  return { logs, isLoading, logCook, refetch: fetchLogs };
}
