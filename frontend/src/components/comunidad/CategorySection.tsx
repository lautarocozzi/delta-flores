import { useRef } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpandCard } from "./ExpandCard";
import { PostDto } from "@/schemas/DTOSchemas";

interface CategorySectionProps {
  title: string;
  icon: string;
  posts: PostDto[];
  onSeeAll?: () => void;
}

export function CategorySection({ title, icon, posts, onSeeAll }: CategorySectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (posts.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span>{icon}</span> {title}
        </h3>
        <div className="flex items-center gap-1">
          {onSeeAll && (
            <Button variant="ghost" size="sm" onClick={onSeeAll} className="text-xs">
              Ver todo
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => scroll("left")}
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {posts.map((post) => (
          <div key={post.id} className="flex-shrink-0 w-[280px]">
            <ExpandCard post={post} />
          </div>
        ))}
      </div>
    </div>
  );
}
