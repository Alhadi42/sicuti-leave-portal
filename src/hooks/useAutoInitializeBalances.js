import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { initializeYearBalances } from '@/utils/leaveBalanceCalculator';
import { AuthManager } from '@/lib/auth';

/**
 * Hook to automatically initialize leave balances for the current year.
 * Runs once when component mounts and detects a new year.
 * Should be used in a top-level component like App or Layout.
 */
export const useAutoInitializeBalances = () => {
  const initializedRef = useRef(false);
  const lastCheckedYearRef = useRef(null);

  useEffect(() => {
    const currentYear = new Date().getFullYear();

    if (lastCheckedYearRef.current === currentYear && initializedRef.current) {
      return;
    }

    const checkAndInitialize = async () => {
      try {
        // Skip untuk user SSO — mereka tidak punya Supabase Auth session di SiCuti
        const { data: sessionData } = await supabase.auth.getSession();
        const hasSicutiSession = !!sessionData?.session;

        const user = AuthManager.getUserSession();
        const isSsoUser = user?.access_token && !hasSicutiSession;
        const isEmployeeRole = user?.role === 'employee';

        if (isSsoUser || isEmployeeRole) {
          lastCheckedYearRef.current = currentYear;
          return;
        }

        const { data: existingBalances, error } = await supabase
          .from('leave_balances')
          .select('id')
          .eq('year', currentYear)
          .limit(1);

        if (error) {
          console.error('Error checking balances:', error);
          return;
        }

        if (!existingBalances || existingBalances.length === 0) {
          console.log(`🔄 Initializing leave balances for year ${currentYear}...`);
          const result = await initializeYearBalances(supabase, currentYear);
          console.log(`✅ Initialized ${result.initialized} balance records for year ${currentYear}`);
          if (result.errors.length > 0) {
            console.warn(`⚠️ ${result.errors.length} errors during initialization:`, result.errors);
          }
          initializedRef.current = true;
        } else {
          console.log(`✅ Leave balances for year ${currentYear} already exist`);
        }

        lastCheckedYearRef.current = currentYear;
      } catch (error) {
        console.error('Error initializing balances:', error);
      }
    };

    checkAndInitialize();

    const checkInterval = setInterval(() => {
      const now = new Date().getFullYear();
      if (now !== lastCheckedYearRef.current) {
        initializedRef.current = false;
        checkAndInitialize();
      }
    }, 24 * 60 * 60 * 1000);

    return () => { clearInterval(checkInterval); };
  }, []);

  return {
    isInitialized: initializedRef.current,
    lastCheckedYear: lastCheckedYearRef.current,
  };
};

export default useAutoInitializeBalances;
