import { Upload, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileUploadProps {
  label: string;
  accept?: string;
  onFileChange: (file: File | null) => void;
  className?: string;
  resetTrigger?: boolean;
  showClearButton?: boolean;
}

export const FileUpload = ({
  label,
  accept = ".pdf,.doc,.docx,.txt",
  onFileChange,
  className,
  resetTrigger = false,
  showClearButton = true,
}: FileUploadProps) => {
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  // Reset file when resetTrigger changes
  useEffect(() => {
    if (resetTrigger) {
      setFileName("");
      onFileChange(null);
    }
  }, [resetTrigger, onFileChange]);

  const handleClearFile = () => {
    setFileName("");
    onFileChange(null);
    toast.info("File removed");
  };

  const validateFileType = (file: File): boolean => {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast.error(`Invalid file type: ${fileExtension}`, {
        description: `Please upload a resume file. Supported formats: PDF, DOC, DOCX, TXT`,
        duration: 5000,
      });
      return false;
    }
    
    // Additional validation for non-resume files based on common file types
    const suspiciousExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.mp4', '.mp3', '.avi', '.mov', '.wav', '.zip', '.rar', '.exe', '.dmg'];
    if (suspiciousExtensions.includes(fileExtension)) {
      toast.warning(`⚠️ Unusual file type detected: ${fileExtension}`, {
        description: `Are you sure this is a resume? Expected: PDF, DOC, DOCX, or TXT format`,
        duration: 6000,
      });
    }
    
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (validateFileType(file)) {
        setFileName(file.name);
        onFileChange(file);
        
        // Success message for valid resume files
        if (label.toLowerCase().includes('resume')) {
          toast.success(`✅ Resume uploaded: ${file.name}`, {
            description: `File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
            duration: 3000,
          });
        }
      } else {
        // Reset file input if validation fails
        e.target.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (validateFileType(file)) {
        setFileName(file.name);
        onFileChange(file);
        
        // Success message for valid resume files
        if (label.toLowerCase().includes('resume')) {
          toast.success(`✅ Resume uploaded: ${file.name}`, {
            description: `File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
            duration: 3000,
          });
        }
      }
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer group animate-fade-in",
          isDragging
            ? "border-accent bg-accent/5 scale-[1.02]"
            : "border-border hover:border-accent/50 hover:bg-accent/5",
          fileName && "bg-primary/5 border-primary/30"
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={label}
          title={`Upload ${label.toLowerCase()}`}
        />
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
              fileName
                ? "bg-gradient-primary"
                : "bg-muted group-hover:bg-gradient-accent"
            )}
          >
            <Upload
              className={cn(
                "w-7 h-7 transition-colors",
                fileName ? "text-primary-foreground" : "text-muted-foreground"
              )}
            />
          </div>
          {fileName ? (
            <>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{fileName}</p>
                {showClearButton && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearFile();
                    }}
                    className="p-1 rounded-full hover:bg-destructive/20 text-destructive transition-colors"
                    title="Remove file"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Click to change file</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOC, DOCX, TXT
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
