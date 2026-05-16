import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * COMPONENT: KpiCardSkeleton
 * PROPÓSITO: Loading state para KPI cards
 * FILOSOFÍA SOCIO: Feedback visual siempre
 */
export const KpiCardSkeleton = () => {
    return (
        <Card className="bg-card p-6 rounded-xl shadow-lg border border-border">
            <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-6 rounded" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
        </Card>
    );
};
