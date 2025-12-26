import { IdeaCardV2 } from "@/components/ideas/IdeaCardV2";
import { BusinessIdeaDisplay } from "@/types/ideas-enhanced";
import { Button } from "@/components/ui/button";

interface ResultsMobileNavProps {
  ideas: BusinessIdeaDisplay[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onToggleFavorite: (id: string) => void;
  onViewDetails: (idea: BusinessIdeaDisplay) => void;
}

export const ResultsMobileNav = ({
  ideas,
  currentIndex,
  onIndexChange,
  onToggleFavorite,
  onViewDetails,
}: ResultsMobileNavProps) => {
  const currentIdea = ideas[currentIndex];

  return (
    <div className="px-4 space-y-4">
      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mb-4">
        {ideas.map((_, index) => (
          <button
            key={index}
            onClick={() => onIndexChange(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Current card */}
      <IdeaCardV2
        idea={currentIdea}
        onToggleFavorite={() => onToggleFavorite(currentIdea.id)}
        onViewDetails={() => onViewDetails(currentIdea)}
      />

      {/* Navigation buttons */}
      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground self-center">
          {currentIndex + 1} of {ideas.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onIndexChange(Math.min(ideas.length - 1, currentIndex + 1))}
          disabled={currentIndex === ideas.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
