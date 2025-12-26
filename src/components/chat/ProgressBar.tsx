interface ProgressBarProps {
  progress: number;
}

export const ProgressBar = ({ progress }: ProgressBarProps) => {
  return (
    <div className="w-full px-4 py-2 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.max(progress, 2)}%` }}
        />
      </div>
    </div>
  );
};
