import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AnalysisRecord, UserProfile } from "../backend";
import { useActor } from "./useActor";

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Analysis History ─────────────────────────────────────────────────────────

export function useGetMyAnalyses() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AnalysisRecord[]>({
    queryKey: ["myAnalyses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyAnalyses();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSaveAnalysis() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      analysisName: string;
      tableName: string;
      healthScore: number;
      grade: string;
      violationsSummary: string;
      generatedSQL: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveAnalysis(
        params.analysisName,
        params.tableName,
        BigInt(params.healthScore),
        params.grade,
        params.violationsSummary,
        params.generatedSQL,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myAnalyses"] });
    },
  });
}

export function useDeleteAnalysis() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteAnalysis(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myAnalyses"] });
    },
  });
}
