import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Download, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface CertificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workerName: string;
  skillName: string;
  verifiedDate?: string;
  proficiencyLevel?: string;
  certificationId?: string;
}

export const CertificationModal = ({
  open,
  onOpenChange,
  workerName,
  skillName,
  verifiedDate,
  proficiencyLevel,
  certificationId = 'CPASS-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
}: CertificationModalProps) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/verify/${certificationId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Certification link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Share Certification</DialogTitle>
          <DialogDescription>
            Share this verified credential with employers and institutions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Certificate preview */}
          <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-card to-muted/30 p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-success" />
                <span className="text-sm font-medium text-success">Verified Credential</span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">This certifies that</p>
                <h3 className="text-xl font-display font-bold text-foreground">{workerName}</h3>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">has demonstrated proficiency in</p>
                <h4 className="text-lg font-display font-semibold text-primary">{skillName}</h4>
                {proficiencyLevel && (
                  <Badge className="mt-2 bg-tier-gold/20 text-tier-gold border-tier-gold/30">
                    {proficiencyLevel}
                  </Badge>
                )}
              </div>

              {verifiedDate && (
                <p className="text-xs text-muted-foreground">
                  Verified on {new Date(verifiedDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground font-mono">{certificationId}</p>
              </div>
            </div>
          </div>

          {/* Share options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <input 
                type="text" 
                value={shareUrl} 
                readOnly 
                className="flex-1 bg-transparent text-sm text-muted-foreground outline-none"
              />
              <Button size="sm" variant="ghost" onClick={handleCopy}>
                {copied ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" variant="outline" onClick={handleCopy}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Link
              </Button>
              <Button className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
