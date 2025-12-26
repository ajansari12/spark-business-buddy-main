import { IdeaCardV2 } from "@/components/ideas/IdeaCardV2";
import { BusinessIdeaDisplay } from "@/types/ideas-enhanced";

interface ResultsGridProps {
  ideas: BusinessIdeaDisplay[];
  onToggleFavorite: (id: string) => void;
  onViewDetails: (idea: BusinessIdeaDisplay) => void;
}

export const ResultsGrid = ({
  ideas,
  onToggleFavorite,
  onViewDetails,
}: ResultsGridProps) => {
  return (
    <div className="container max-w-6xl mx-auto px-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.map((idea) => (
          <IdeaCardV2
            key={idea.id}
            idea={idea}
            onToggleFavorite={() => onToggleFavorite(idea.id)}
            onViewDetails={() => onViewDetails(idea)}
          />
        ))}
      </div>
    </div>
  );
};
