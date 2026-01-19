import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  ArrowRight, 
  CheckCircle2,
  Globe,
  Layers,
  Zap
} from "lucide-react";
import cpassLogo from "@/assets/cpass-logo.jpg";

const Index = () => {
  const navigate = useNavigate();

  const personas = [
    {
      title: "Platform Partner",
      description: "Hire verified talent. Track worker development. Build your certified workforce.",
      icon: Briefcase,
      path: "/login/partnership",
      colorClass: "bg-portal-partner",
      hoverShadow: "hover:shadow-[0_20px_40px_-12px_hsl(224_64%_33%/0.35)]",
    },
    {
      title: "TVET Institution",
      description: "Find RPL candidates. Track student WBL progress. Validate alumni career outcomes.",
      icon: GraduationCap,
      path: "/login/tvet-django",
      colorClass: "bg-portal-tvet",
      hoverShadow: "hover:shadow-[0_20px_40px_-12px_hsl(37_90%_45%/0.35)]",
    },
    {
      title: "Worker",
      description: "Build verified credentials. Track your pathway. Access opportunities that match your skills.",
      icon: Users,
      path: "/worker-login",
      colorClass: "bg-portal-worker",
      hoverShadow: "hover:shadow-[0_20px_40px_-12px_hsl(150_40%_28%/0.35)]",
    },
  ];

  const badges = [
    { label: "Recognition of Prior Learning", icon: CheckCircle2 },
    { label: "Work-Based Learning", icon: Layers },
    { label: "Sector Agnostic", icon: Globe },
    { label: "Globally Portable", icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-white dark:bg-background">
        
        <div className="container mx-auto px-4 py-16 lg:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Logo */}
            <div className="animate-fade-up">
              <img 
                src={cpassLogo} 
                alt="CPASS.ai - Career Repository Skills Credentialing Platform" 
                className="h-16 md:h-20 lg:h-24 mx-auto"
              />
            </div>
            
            {/* Primary headline */}
            <h2 
              className="text-3xl md:text-5xl font-display font-bold text-foreground leading-tight animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              Universal Skills Credentialing Infrastructure
            </h2>
            
            {/* Tagline */}
            <p 
              className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-up"
              style={{ animationDelay: "200ms" }}
            >
              Transforming work experience into verified, portable credentials — across any sector, any geography, any career stage
            </p>

            {/* Badge row */}
            <div 
              className="flex flex-wrap justify-center gap-3 pt-4 animate-fade-up"
              style={{ animationDelay: "300ms" }}
            >
              {badges.map((badge) => (
                <div
                  key={badge.label}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/60 border border-border/50 text-sm font-medium text-foreground/80"
                >
                  <badge.icon className="w-4 h-4 text-primary" />
                  {badge.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Portal Selection Cards */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div 
            className="text-center mb-12 animate-fade-up"
            style={{ animationDelay: "400ms" }}
          >
            <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
              Choose Your Portal
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Select your role to access the appropriate dashboard and features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {personas.map((persona, index) => (
              <div
                key={persona.title}
                className={`group relative overflow-hidden rounded-2xl bg-card border border-border p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 ${persona.hoverShadow} animate-fade-up cursor-pointer`}
                style={{ animationDelay: `${(index + 5) * 100}ms` }}
                onClick={() => navigate(persona.path)}
              >
                <div className="space-y-6">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${persona.colorClass} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <persona.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h4 className="text-xl font-display font-semibold text-foreground">
                      {persona.title}
                    </h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {persona.description}
                    </p>
                  </div>

                  {/* CTA */}
                  <Button 
                    variant="ghost" 
                    className="group/btn p-0 h-auto text-primary font-medium hover:bg-transparent"
                  >
                    Enter Portal
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>

                {/* Subtle corner accent */}
                <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full ${persona.colorClass} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            CPASS — Career Repository Skills Credentialing Platform
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
