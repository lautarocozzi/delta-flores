import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";

export const useFavorites = () => {
    const queryClient = useQueryClient();

    const { data: favoritePlantas = [], isLoading } = useQuery({
        queryKey: ['favorites', 'plantas'],
        queryFn: apiService.getFavoritePlantas,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    // Helper specific validation
    const isFavoritePlanta = (id: number) => favoritePlantas.some(p => p.id === id);

    const addFavoriteMutation = useMutation({
        mutationFn: apiService.addFavoritePlanta,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites', 'plantas'] });
        }
    });

    const removeFavoriteMutation = useMutation({
        mutationFn: apiService.removeFavoritePlanta,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites', 'plantas'] });
        }
    });

    return {
        favoritePlantas,
        isFavoritePlanta,
        addFavorite: addFavoriteMutation.mutate,
        removeFavorite: removeFavoriteMutation.mutate,
        isLoading
    };
};
