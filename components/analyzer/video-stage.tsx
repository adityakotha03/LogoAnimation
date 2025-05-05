import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface VideoUploadProps {
  onVideoSelect: (url: string | null) => void;
}

export function VideoUpload({ onVideoSelect }: VideoUploadProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      onVideoSelect(url);
    }
  };

  const clearVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    onVideoSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          onClick={() => fileInputRef.current?.click()} 
          variant="outline"
          className="flex-1"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Background Video
        </Button>
        {videoUrl && (
          <Button
            onClick={clearVideo}
            variant="outline"
            size="icon"
            className="text-red-500 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      {videoUrl && (
        <div className="rounded-lg overflow-hidden bg-black">
          <video
            src={videoUrl}
            className="w-full h-auto"
            controls
            muted
          />
        </div>
      )}
    </div>
  );
}
