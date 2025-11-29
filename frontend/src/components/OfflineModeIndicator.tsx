import { useHybridAuth } from "@/hooks/useHybridAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { WifiOff, CheckCircle } from "lucide-react";

export const OfflineModeIndicator = () => {
  const { isOfflineMode } = useHybridAuth();

  if (!isOfflineMode) {
    return null;
  }

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
      <WifiOff className="h-4 w-4 text-yellow-600" />
      <div className="flex items-center justify-between">
        <AlertDescription className="text-yellow-800">
          <div className="flex items-center">
            <Badge variant="secondary" className="mr-2">Offline Mode</Badge>
            Core features available without database connection
          </div>
        </AlertDescription>
        <div className="flex items-center text-sm text-yellow-700">
          <CheckCircle className="h-4 w-4 mr-1" />
          Fully Functional
        </div>
      </div>
    </Alert>
  );
};