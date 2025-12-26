import { BusinessIdeaDisplay } from "@/types/ideas-enhanced";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IdeaDetailsContent } from "./IdeaDetailsContent";

interface IdeaDetailsProps {
  idea: BusinessIdeaDisplay | null;
  open: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
}

export const IdeaDetails = ({
  idea,
  open,
  onClose,
  onToggleFavorite,
}: IdeaDetailsProps) => {
  const isMobile = useIsMobile();

  if (!idea) return null;

  // Mobile: Use bottom Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Idea Details</SheetTitle>
          </SheetHeader>
          <IdeaDetailsContent
            idea={idea}
            onClose={onClose}
            onToggleFavorite={onToggleFavorite}
            showBackButton={true}
          />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use right Drawer
  return (
    <Drawer open={open} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[480px] max-w-full ml-auto rounded-l-2xl">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Idea Details</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="h-full px-6 py-6">
          <IdeaDetailsContent
            idea={idea}
            onClose={onClose}
            onToggleFavorite={onToggleFavorite}
            showBackButton={false}
          />
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};
