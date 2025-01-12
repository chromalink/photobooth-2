'use client'

import { useSessionStore } from '@/store/session'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import OrbAnimation from '../components/OrbAnimation'

export default function Orb1() {
  const router = useRouter()
  //Countdown starting number 'useState'
  const [countdown, setCountdown] = useState(5)
  const [shouldNavigate, setShouldNavigate] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const setCapturedPhoto = useSessionStore((state) => state.setCapturedPhoto)
  const setError = useSessionStore((state) => state.setError)
  const setUploadedPhotoUrl = useSessionStore((state) => state.setUploadedPhotoUrl)
  const [isUploading, setIsUploading] = useState(false)
  // Update aspect ratio to match Stability AI requirements (896x1152)
  const targetAspectRatio = 896 / 1152

  // Calculate preview size based on portrait ratio
  const getPreviewSize = () => {
    const vw = Math.min(window.innerWidth, window.innerHeight * targetAspectRatio);
    const previewWidth = 0.5 * vw; // 50% of viewport width
    const previewHeight = previewWidth / targetAspectRatio;
    // Use the smaller dimension for the circle
    const circleDiameter = Math.min(previewWidth, previewHeight);
    return `${circleDiameter}px`;
  }

  const [previewSize, setPreviewSize] = useState('30vw')

  // Update preview size on mount and window resize
  useEffect(() => {
    const updatePreviewSize = () => {
      setPreviewSize(getPreviewSize());
    }
    
    updatePreviewSize();
    window.addEventListener('resize', updatePreviewSize);
    return () => window.removeEventListener('resize', updatePreviewSize);
  }, []);

  // Effect for camera setup
  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      console.log('Setting up camera...');
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 896 },
            height: { ideal: 1152 },
            facingMode: 'user',
            aspectRatio: { ideal: 896/1152 }
          }
        });
        console.log('Camera access granted:', stream.getVideoTracks()[0].label);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('Video element exists, setting stream');
          
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            videoRef.current?.play().then(() => {
              console.log('Video playback started');
            }).catch(err => {
              console.error('Error starting video playback:', err);
            });
          };

          videoRef.current.onplay = () => {
            console.log('Video is playing');
          };

          videoRef.current.onerror = (e) => {
            console.error('Video error:', e);
          };
        } else {
          console.error('Video element not found');
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    };

    setupCamera();

    // Cleanup function to stop camera when component unmounts
    return () => {
      console.log('Cleaning up camera...');
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Camera track stopped');
        });
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Calculate dimensions for target aspect ratio
      let cropWidth;
      let cropHeight;
      let offsetX = 0;
      let offsetY = 0;
      
      if (video.videoWidth / video.videoHeight > targetAspectRatio) {
        // Video is wider than target ratio - crop width
        cropHeight = video.videoHeight;
        cropWidth = video.videoHeight * targetAspectRatio;
        offsetX = (video.videoWidth - cropWidth) / 2;
      } else {
        // Video is taller than target ratio - crop height
        cropWidth = video.videoWidth;
        cropHeight = video.videoWidth / targetAspectRatio;
        offsetY = (video.videoHeight - cropHeight) / 2;
      }
      
      // Set canvas to the target dimensions
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear the canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Flip the context horizontally
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
        
        // Draw the video frame with cropping
        ctx.drawImage(
          video,
          offsetX, offsetY, // Start point in source
          cropWidth, cropHeight, // Width and height to take from source
          0, 0, // Start point in destination
          cropWidth, cropHeight // Width and height in destination
        );
        
        // Reset the transformation
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        try {
          // Convert to base64 with high quality
          const photo = canvas.toDataURL('image/jpeg', 0.95);
          console.log('Photo captured successfully. Data URL length:', photo.length);
          console.log('Photo dimensions:', cropWidth, 'x', cropHeight, 'ratio:', cropWidth/cropHeight);
          setCapturedPhoto(photo);
          setUploadedPhotoUrl(photo); // Use the base64 URL directly
          return true;
        } catch (err) {
          console.error('Error converting canvas to data URL:', err);
          return false;
        }
      }
    }
    console.error('Video or canvas ref not available');
    return false;
  };

  // Effect for countdown and photo capture
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          
          // Attempt to capture photo
          const success = capturePhoto();
          
          if (success) {
            console.log('Photo captured successfully');
            setShouldNavigate(true);
          } else {
            console.error('Failed to capture photo');
            setError('Failed to capture photo. Please try again.');
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setCapturedPhoto, setError]);

  // Separate effect for navigation
  useEffect(() => {
    if (shouldNavigate) {
      // Stop the camera before navigating
      if (videoRef.current?.srcObject instanceof MediaStream) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Camera track stopped before navigation');
        });
      }
      
      router.push('/page3-colorpick');
    }
  }, [shouldNavigate, router]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Camera Preview */}
      <div 
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: previewSize,
          height: previewSize,
          overflow: 'visible',
          borderRadius: '50%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Inner container for feathered mask */}
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '-10px',
          right: '-10px',
          bottom: '-10px',
          overflow: 'hidden',
          WebkitMaskImage: '-webkit-radial-gradient(circle farthest-side, white 0%, white 90%, transparent 100%)',
          maskImage: 'radial-gradient(circle farthest-side, white 0%, white 80%, transparent 100%)'
        }}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ 
              width: 'calc(100% + 20px)',
              height: 'calc(100% + 20px)',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              marginTop: '-10px',
              marginLeft: '-10px'
            }}
          />
        </div>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Countdown Display */}
      {countdown > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl font-bold text-white z-50"
        >
          {countdown}
        </motion.div>
      )}

      {/* Orb Animation */}
      <OrbAnimation />
    </div>
  );
}
