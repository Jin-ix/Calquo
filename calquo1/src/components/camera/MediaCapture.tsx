import React, { useRef, useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Camera, Video, X, RotateCcw, Check, Square, Play, Pause, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface MediaCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapturePhoto: (imageDataUrl: string) => void;
  onCaptureVideo: (videoDataUrl: string, duration: number) => void;
  maxVideoDuration?: number; // in seconds, default 60
}

export function MediaCapture({ 
  isOpen, 
  onClose, 
  onCapturePhoto, 
  onCaptureVideo,
  maxVideoDuration = 60 
}: MediaCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'photo' | 'video'>('photo');
  const [cameraStarted, setCameraStarted] = useState(false);
  
  // Video recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoDuration, setVideoDuration] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetStates();
      setCameraStarted(false);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxVideoDuration) {
            stopRecording();
            return maxVideoDuration;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, maxVideoDuration]);

  const resetStates = () => {
    setCapturedImage(null);
    setRecordedVideo(null);
    setError(null);
    setIsRecording(false);
    setRecordingTime(0);
    setRecordedChunks([]);
    setVideoDuration(0);
  };

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true // Enable audio for video recording
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
          setError('Camera and microphone access was denied. Please allow permissions and try again.');
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
    if (isRecording) {
      stopRecording();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
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

  const startRecording = () => {
    if (!stream) return;

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        // Will be handled in stopRecording
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      toast.error('Failed to start video recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Create video blob and URL
      setTimeout(() => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideo(videoUrl);
        setVideoDuration(recordingTime);
        
        // Convert blob to data URL for storage
        const reader = new FileReader();
        reader.onload = () => {
          // Keep the data URL for potential use
        };
        reader.readAsDataURL(blob);
      }, 100);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const retakeVideo = () => {
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo);
    }
    setRecordedVideo(null);
    setRecordingTime(0);
    setVideoDuration(0);
    setRecordedChunks([]);
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapturePhoto(capturedImage);
      onClose();
      toast.success('Photo captured successfully!');
    }
  };

  const confirmVideo = () => {
    if (recordedVideo && recordedChunks.length > 0) {
      // Convert blob to data URL for storage
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          onCaptureVideo(reader.result as string, videoDuration);
          onClose();
          toast.success('Video captured successfully!');
        }
      };
      reader.readAsDataURL(blob);
    }
  };

  const handleClose = () => {
    stopCamera();
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo);
    }
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentage = (recordingTime / maxVideoDuration) * 100;
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-orange-500';
    return 'text-green-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Capture Product Media
          </DialogTitle>
          <DialogDescription>
            Capture photos and videos of your product to showcase it to potential buyers. Switch between photo and video modes using the tabs below.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'photo' | 'video')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photo" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photo
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video (1 min max)
            </TabsTrigger>
          </TabsList>

          <div className="space-y-4 mt-4">
            {error ? (
              <div className="text-center py-12">
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  <p className="mb-4">{error}</p>
                  <Button onClick={startCamera} variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Camera Preview */}
                {!capturedImage && !recordedVideo && (
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
                    
                    {/* Recording indicator */}
                    {isRecording && (
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">REC</span>
                        </div>
                        <div className={`bg-black/70 text-white px-3 py-1 rounded-full ${getTimeColor()}`}>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span className="font-mono">{formatTime(recordingTime)}</span>
                            <span className="text-xs">/ {formatTime(maxVideoDuration)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Camera grid overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <svg className="w-full h-full text-white/20" viewBox="0 0 100 100">
                        <line x1="33" y1="0" x2="33" y2="100" stroke="currentColor" strokeWidth="0.5" />
                        <line x1="67" y1="0" x2="67" y2="100" stroke="currentColor" strokeWidth="0.5" />
                        <line x1="0" y1="33" x2="100" y2="33" stroke="currentColor" strokeWidth="0.5" />
                        <line x1="0" y1="67" x2="100" y2="67" stroke="currentColor" strokeWidth="0.5" />
                      </svg>
                    </div>
                  </div>
                )}

                <TabsContent value="photo" className="mt-0">
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
                </TabsContent>

                <TabsContent value="video" className="mt-0">
                  {/* Recorded Video Preview */}
                  {recordedVideo && (
                    <div className="relative">
                      <video
                        src={recordedVideo}
                        controls
                        className="w-full h-auto max-h-96 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-black/70 text-white">
                          Duration: {formatTime(videoDuration)}
                        </Badge>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Hidden canvas for photo capture */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
            )}

            {/* Controls */}
            {!error && (
              <div className="space-y-4">
                <TabsContent value="photo" className="mt-0">
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
                          onClick={confirmPhoto}
                          size="lg"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="h-5 w-5 mr-2" />
                          Use Photo
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="video" className="mt-0">
                  <div className="flex justify-center gap-4">
                    {!recordedVideo ? (
                      <div className="flex gap-3">
                        {!isRecording ? (
                          <Button
                            onClick={startRecording}
                            disabled={isLoading || !stream}
                            size="lg"
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Video className="h-5 w-5 mr-2" />
                            Start Recording
                          </Button>
                        ) : (
                          <Button
                            onClick={stopRecording}
                            size="lg"
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Square className="h-5 w-5 mr-2" />
                            Stop Recording
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Button
                          onClick={retakeVideo}
                          variant="outline"
                          size="lg"
                        >
                          <RotateCcw className="h-5 w-5 mr-2" />
                          Retake
                        </Button>
                        <Button
                          onClick={confirmVideo}
                          size="lg"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="h-5 w-5 mr-2" />
                          Use Video
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Instructions */}
                <div className="text-center text-sm text-muted-foreground">
                  {activeTab === 'photo' ? (
                    !capturedImage ? (
                      <p>Position your product in the frame and tap "Take Photo" to capture</p>
                    ) : (
                      <p>Review your photo and choose to retake or use it</p>
                    )
                  ) : (
                    !recordedVideo ? (
                      !isRecording ? (
                        <div className="space-y-1">
                          <p>Record a short video showcasing your product (max 1 minute)</p>
                          <p className="text-xs">Show different angles, features, and material quality</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p>Recording in progress... Show your product from different angles</p>
                          <p className="text-xs">Video will automatically stop at 1 minute</p>
                        </div>
                      )
                    ) : (
                      <p>Review your video and choose to retake or use it</p>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Close button */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleClose} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
