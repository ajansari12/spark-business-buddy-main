import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Rocket, Download, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDocuments } from "@/hooks/useDocuments";
import { format } from "date-fns";
import { toast } from "sonner";

const Documents = () => {
  const navigate = useNavigate();
  const { 
    documents, 
    isLoading, 
    isGenerating, 
    loadUserDocuments, 
    generatePdfForSession 
  } = useDocuments();

  useEffect(() => {
    loadUserDocuments();
  }, [loadUserDocuments]);

  const handleDownload = async (doc: typeof documents[0]) => {
    if (doc.sessionId) {
      const success = await generatePdfForSession(doc.sessionId);
      if (success) {
        toast.success("Report downloaded!");
      }
    } else {
      toast.error("Session not found for this document");
    }
  };

  const handleRefresh = () => {
    loadUserDocuments();
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
            Documents
          </h1>
          <p className="text-muted-foreground text-sm">
            Your PDF reports and exports
          </p>
        </div>
        {documents.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="touch-target"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : documents.length === 0 ? (
        /* Empty State */
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              No documents yet
            </h2>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              Your PDF reports will appear here after you generate business ideas.
            </p>
            <Button
              onClick={() => navigate("/chat")}
              className="touch-target bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Start Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Documents List */
        <div className="space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      Business Ideas Report
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(doc.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    disabled={isGenerating}
                    className="touch-target shrink-0"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;
