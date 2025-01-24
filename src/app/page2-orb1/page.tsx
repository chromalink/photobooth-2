'use client'

import { useSessionStore } from '@/store/session'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

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
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    
    // On desktop (wider screens), use width as the base for calculations
    const isWideScreen = vw > vh;
    
    if (isWideScreen) {
      // Use 95% of viewport width for wide screens
      const maxWidth = 0.95 * vw;
      // But ensure the height doesn't exceed 75% of viewport height
      const maxHeight = 0.75 * vh;
      
      // For desktop, we'll prioritize width while maintaining minimum height
      return {
        width: `${maxWidth}px`,
        height: `${Math.min(maxWidth / targetAspectRatio, maxHeight)}px`
      };
    }
    
    // For mobile
    const previewHeight = 0.6 * vh;
    const previewWidth = previewHeight * targetAspectRatio;
    return {
      width: `${previewWidth}px`,
      height: `${previewHeight}px`
    };
  }

  const [previewSize, setPreviewSize] = useState(getPreviewSize())

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
      
      router.push('/page4-orb2');
    }
  }, [shouldNavigate, router]);

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-black text-white">
      {/* Main content container with responsive padding */}
      <div className="w-full h-full flex flex-col items-center" 
        style={{ 
          padding: window.innerWidth > window.innerHeight 
            ? '4vh 5vw' // Desktop padding
            : '3vh 4vw'  // Mobile padding
        }}
      >
        {/* Top text prompt with responsive typography */}
        <div 
          className="w-full mb-[3vh] md:mb-[4vh]"
          style={{
            height: window.innerWidth > window.innerHeight ? '12vh' : '15vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            className="text-center leading-tight"
            style={{
              fontFamily: 'Arapey, serif',
              fontStyle: 'italic',
              fontSize: window.innerWidth > window.innerHeight 
                ? 'clamp(2rem, 4vw, 3.5rem)' // Desktop font size
                : 'clamp(1.5rem, 5vw, 2.5rem)', // Mobile font size
              maxWidth: window.innerWidth > window.innerHeight ? '70%' : '85%',
              background: 'linear-gradient(180deg, #ffffff 95%, #d9d9d9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 15px rgba(255,255,255,0.3)',
              opacity: countdown < 6 && countdown > 0 ? '0.8' : '1', // Subtle fade during countdown
              transition: 'opacity 0.3s ease'
            }}
          >
            Pretend like your company just went public
          </div>
        </div>

        {/* Center webcam preview with enhanced container */}
        <div 
          className="relative flex items-center justify-center w-full"
          style={{ 
            height: window.innerWidth > window.innerHeight ? '75vh' : '60vh',
            width: '100%',
            margin: '0 auto',
            padding: window.innerWidth > window.innerHeight ? '0 2vw' : '0',
            marginBottom: '8vh' // Space for the overlapping countdown
          }}
        >
          {/* Video container */}
          <div 
            className="relative rounded-2xl overflow-hidden w-full h-full"
            style={{ 
              width: 'min(90vw, 460px)',
              height: 'min(90vw, 460px)',
              boxShadow: countdown < 6 && countdown > 0
                ? '0 0 30px rgba(255,255,255,0.3), 0 0 80px rgba(255,255,255,0.1)'
                : '0 0 20px rgba(255,255,255,0.2), 0 0 60px rgba(255,255,255,0.1)',
              transition: 'box-shadow 0.3s ease'
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="object-cover w-full h-full"
              style={{ 
                transform: 'scaleX(-1)',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>

          {/* Countdown circle positioned relative to the preview container */}
          {countdown < 6 && countdown > 0 && (
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 font-bold"
              style={{ 
                bottom: '-8vh',
                width: window.innerWidth > window.innerHeight ? '16vh' : '18vh',
                height: window.innerWidth > window.innerHeight ? '16vh' : '18vh',
                borderRadius: '50%',
                backgroundColor: 'black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: window.innerWidth > window.innerHeight 
                  ? 'clamp(3rem, 10vh, 7rem)'
                  : 'clamp(2.5rem, 12vh, 6rem)',
                color: 'white',
                textShadow: '0 0 10px rgba(255,255,255,0.5)',
                boxShadow: '0 0 30px rgba(255,255,255,0.2), 0 0 80px rgba(255,255,255,0.1)',
                animation: 'pulse 1s infinite',
                border: '3px solid rgba(255,255,255,0.15)',
                zIndex: 10
              }}
            >
              {countdown}
            </div>
          )}
        </div>

        {/* Loading state with enhanced backdrop and animation */}
        {isUploading && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center backdrop-blur-md">
            <div 
              className="text-white relative"
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                textShadow: '0 0 15px rgba(255,255,255,0.5)',
                animation: 'fadeInOut 2s infinite'
              }}
            >
              Processing...
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        h1 {
          font-size: min(max(2.5rem, 5vw), 4rem);
          font-weight: 400;
          font-family: var(--font-aboreto);
          letter-spacing: 0.15em;
          line-height: 1.2;
          color: white;
          text-align: center;
          margin: 0 0 min(2rem, 4vh);
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }

        @keyframes pulse {
          0% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(-50%, 0) scale(1.05); }
          100% { transform: translate(-50%, 0) scale(1); }
        }

        @keyframes fadeInOut {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
