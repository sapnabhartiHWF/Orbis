import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProcessDetail, getAllProcessesSummary } from "@/services/processRegistrationApi";

/**
 * React Query hook for fetching process detail with caching
 * Automatically caches results and reduces unnecessary API calls
 */
export const useProcessDetail = (processId: number | null) => {
  return useQuery({
    queryKey: ["processDetail", processId],
    queryFn: () => getProcessDetail(processId!),
    enabled: !!processId && processId > 0,
    staleTime: 30000,
    gcTime: 300000, 
    refetchOnWindowFocus: false, 
    refetchOnMount: false, 
    retry: 1,
  });
};

/**
 * React Query hook for fetching all processes summary with caching
 */
export const useProcessesSummary = () => {
  return useQuery({
    queryKey: ["processesSummary"],
    queryFn: getAllProcessesSummary,
    staleTime: 60000, // Consider data fresh for 1 minute
    gcTime: 600000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Hook to invalidate process detail cache
 * Use this after mutations to trigger a refetch
 */
export const useInvalidateProcessDetail = () => {
  const queryClient = useQueryClient();
  
  return (processId?: number) => {
    if (processId) {
      queryClient.invalidateQueries({ queryKey: ["processDetail", processId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ["processDetail"] });
    }
    // Also invalidate processes summary to update list view
    queryClient.invalidateQueries({ queryKey: ["processesSummary"] });
  };
};

/**
 * Hook to manually refetch process detail
 */
export const useRefetchProcessDetail = () => {
  const queryClient = useQueryClient();
  
  return (processId: number) => {
    return queryClient.refetchQueries({ queryKey: ["processDetail", processId] });
  };
};

