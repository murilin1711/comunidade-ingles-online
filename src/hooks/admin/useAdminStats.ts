import { useAulasStats } from './useAulasStats';
import { useProfessoresStats } from './useProfessoresStats';

export const useAdminStats = () => {
  const aulasStats = useAulasStats();
  const professoresStats = useProfessoresStats();

  return {
    ...aulasStats,
    ...professoresStats
  };
};