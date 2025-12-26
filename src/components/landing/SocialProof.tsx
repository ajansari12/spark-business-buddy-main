import { Star, Users, FileCheck } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "500+",
    label: "Entrepreneurs Helped",
  },
  {
    icon: FileCheck,
    value: "1,200+",
    label: "Ideas Generated",
  },
  {
    icon: Star,
    value: "4.8",
    label: "Average Rating",
  },
];

export const SocialProof = () => {
  return (
    <section className="py-12 px-4">
      <div className="container max-w-lg mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-success/10 mb-2">
                <stat.icon className="w-5 h-5 text-success" />
              </div>
              <p className="font-display font-bold text-xl sm:text-2xl text-foreground">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
