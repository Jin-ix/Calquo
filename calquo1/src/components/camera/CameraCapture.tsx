import React, { useRef, useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export function CameraCapture({ isOpen, onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setError(null);
      setCameraStarted(false);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraStarted(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access was denied. Please allow camera permissions and try again.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Failed to access camera. Please try again.');
        }
      }
      toast.error('Failed to access camera');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraStarted(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
      toast.success('Photo captured successfully!');
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Capture Product Photo
          </DialogTitle>
          <DialogDescription>
            Use your device's camera to take a photo of your product. Make sure the product is well-lit and centered in the frame.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="text-center py-12">
              <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
                <p className="mb-4">{error}</p>
                <Button onClick={startCamera} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : !cameraStarted ? (
            <div className="text-center py-12">
              <div className="bg-muted rounded-lg p-8">
                <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Camera Access Required</h3>
                <p className="text-muted-foreground mb-6">
                  Click the button below to start your camera and take a photo of your product.
                </p>
                <Button onClick={startCamera} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting Camera...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Camera Preview */}
              {!capturedImage && (
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto max-h-96 object-cover"
                    style={{ transform: 'scaleX(-1)' }} // Mirror the video for better UX
                  />
                  
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p>Starting camera...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Camera grid overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full text-white/30" viewBox="0 0 100 100">
                      <line x1="33" y1="0" x2="33" y2="100" stroke="currentColor" strokeWidth="0.5" />
                      <line x1="67" y1="0" x2="67" y2="100" stroke="currentColor" strokeWidth="0.5" />
                      <line x1="0" y1="33" x2="100" y2="33" stroke="currentColor" strokeWidth="0.5" />
                      <line x1="0" y1="67" x2="100" y2="67" stroke="currentColor" strokeWidth="0.5" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Captured Photo Preview */}
              {capturedImage && (
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="Captured photo"
                    className="w-full h-auto max-h-96 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Hidden canvas for photo capture */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          )}

          {/* Camera Controls */}
          {!error && (
            <div className="flex justify-center gap-4">
              {!capturedImage ? (
                <Button
                  onClick={capturePhoto}
                  disabled={isLoading || !stream}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Take Photo
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button
                    onClick={retakePhoto}
                    variant="outline"
                    size="lg"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Retake
                  </Button>
                  <Button
                    onClick={confirmCapture}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Use Photo
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground">
            {!capturedImage ? (
              <p>Position your product in the frame and tap "Take Photo" to capture</p>
            ) : (
              <p>Review your photo and choose to retake or use it</p>
            )}
          </div>

          {/* Close button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleClose} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
