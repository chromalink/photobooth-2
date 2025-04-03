'use client'

import { useSessionStore } from '@/store/session'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const PHOTO_PROMPT = "SHOW US A SAMPLE OF YOUR FACE"

export default function Orb1() {
  const router = useRouter()
  //Countdown starting number 'useState'
  const [countdown, setCountdown] = useState(10)
  const [shouldNavigate, setShouldNavigate] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const setCapturedPhoto = useSessionStore((state) => state.setCapturedPhoto)
  const setError = useSessionStore((state) => state.setError)
  const setUploadedPhotoUrl = useSessionStore((state) => state.setUploadedPhotoUrl)
  const [isUploading, setIsUploading] = useState(false)
  // Update aspect ratio to match Stability AI requirements (896x1152)
  const targetAspectRatio = 896 / 1152
  // Add state for screen size
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  // Calculate preview size based on portrait ratio
  const getPreviewSize = () => {
    // Check if window is defined (client-side only)
    if (typeof window === 'undefined') {
      return {
        width: '100%',
        height: '100%'
      };
    }
    
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    
    // For tablets and mobile devices
    if (vw <= 1024) {
      return {
        width: '100vw',
        height: '100vh'
      };
    }
    
    // For desktop (wider screens)
    const maxWidth = Math.min(0.95 * vw, vh);
    const height = maxWidth / targetAspectRatio;
    
    return {
      width: `${maxWidth}px`,
      height: `${height}px`
    };
  }

  const [previewSize, setPreviewSize] = useState(getPreviewSize())

  // Update preview size on mount and window resize
  useEffect(() => {
    const updatePreviewSize = () => {
      setPreviewSize(getPreviewSize());
      // Update screen size state
      setIsSmallScreen(window.innerWidth <= 1024);
    }
    
    updatePreviewSize();
    window.addEventListener('resize', updatePreviewSize);
    return () => window.removeEventListener('resize', updatePreviewSize);
  }, []);

  useEffect(() => {
    // Set the single prompt when component mounts
    setCurrentPrompt(PHOTO_PROMPT)
  }, [])

  // Effect for camera setup
  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      console.log('Setting up camera...');
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 896 },
            height: { ideal: 1152 }
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
      {/* Center webcam preview with enhanced container */}
      <div 
        className="relative flex items-center justify-center w-full h-full"
        style={{ 
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 0
        }}
      >
        {/* Video container */}
        <div 
          className="relative overflow-hidden"
          style={{ 
            width: '100vw',
            height: '100vh',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            boxShadow: countdown < 6 && countdown > 0
              ? '0 0 20px rgba(255,255,255,0.2), 0 0 60px rgba(255,255,255,0.1)'
              : '0 0 20px rgba(255,255,255,0.2), 0 0 60px rgba(255,255,255,0.1)',
            transition: 'box-shadow 0.3s ease'
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
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
        {countdown > 0 && (
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 font-bold"
            style={{ 
              bottom: '5vh',
              width: '18vh',
              height: '18vh',
              borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(3rem, 8vh, 7rem)',
              fontFamily: 'var(--font-b612-mono)',
              color: 'white',
              textShadow: '0 0 10px rgba(255,255,255,0.5)',
              boxShadow: '0 0 30px rgba(255,255,255,0.2), 0 0 80px rgba(255,255,255,0.1)',
              animation: 'pulse 1s infinite',
              border: '3px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            {countdown}
          </div>
        )}
      </div>

      {/* Top text prompt with responsive typography - moved on top of video */}
      <div 
        className="fixed top-0 left-0 w-full z-10"
        style={{
          padding: '4vh 5vw',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)'
        }}
      >
        <div
          className="text-center leading-tight"
          style={{
            fontFamily: 'var(--font-b612-mono)',
            fontSize: 'clamp(1.2rem, 4vw, 2.5rem)',
            maxWidth: '85%',
            margin: '0 auto',
            color: 'white',
            textShadow: '0 0 15px rgba(0,0,0,0.5)',
            opacity: countdown < 6 && countdown > 0 ? '0.8' : '1',
            transition: 'opacity 0.3s ease',
            textTransform: 'uppercase'
          }}
        >
          {currentPrompt}
        </div>
      </div>

      {/* Loading state with enhanced backdrop and animation */}
      {isUploading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center backdrop-blur-md">
          <div 
            className="text-white relative"
            style={{
              fontFamily: 'var(--font-b612-mono)',
              fontSize: 'clamp(1.2rem, 2.5vw, 2rem)',
              textShadow: '0 0 15px rgba(255,255,255,0.5)',
              animation: 'fadeInOut 2s infinite',
              textTransform: 'uppercase'
            }}
          >
            PROCESSING...
          </div>
        </div>
      )}
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

        .countdown {
          font-size: clamp(1.5rem, 6vw, 4rem);
          font-weight: 300;
          font-family: var(--font-aboreto);
          letter-spacing: 0.1em;
          color: white;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          margin: 0;
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

        /* VHS Overlay Effects */
        @keyframes vhsNoise {
          0%, 100% { opacity: 0.2; }
          10% { opacity: 0.1; }
          20% { opacity: 0.3; }
          30% { opacity: 0.2; }
          40% { opacity: 0.3; }
          50% { opacity: 0.1; }
          60% { opacity: 0.3; }
          70% { opacity: 0.2; }
          80% { opacity: 0.1; }
          90% { opacity: 0.3; }
        }

        @keyframes vhsFlicker {
          0%, 100% { opacity: 1; }
          33% { opacity: 0.95; }
          66% { opacity: 0.97; }
        }

        @keyframes vhsScanlines {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }
      `}</style>

      {/* Enhanced VHS Scanlines Overlay */}
      <div className="fixed inset-0 pointer-events-none z-20" style={{ 
        mixBlendMode: 'overlay',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0, 0, 0, 0.1) 3px, rgba(0, 0, 0, 0.1) 6px), linear-gradient(90deg, rgba(255, 0, 0, 0.1), rgba(0, 255, 0, 0.05), rgba(0, 0, 255, 0.1))',
        backgroundSize: '100% 6px, 100% 100%',
        animation: 'vhsNoise 0.2s infinite, vhsFlicker 4s infinite',
        opacity: 0.25
      }}></div>

      {/* 90s VHS Color Filter - More saturated and contrasty */}
      <div className="fixed inset-0 pointer-events-none z-10" style={{ 
        background: 'linear-gradient(135deg, rgba(0, 160, 170, 0.15), rgba(0, 200, 210, 0.3))',
        mixBlendMode: 'color',
        opacity: 0.7
      }}></div>

      {/* 90s VHS Vignette - More pronounced */}
      <div className="fixed inset-0 pointer-events-none z-10" style={{ 
        background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0) 40%, rgba(0, 70, 60, 0.45) 150%)',
        mixBlendMode: 'multiply',
        opacity: 0.6
      }}></div>

      {/* Film Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-15" style={{ 
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%\' height=\'100%\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        mixBlendMode: 'overlay',
        opacity: 0.15,
        animation: 'grainShift 0.5s infinite'
      }}></div>

      {/* VHS Tracking Issues */}
      <div className="fixed inset-0 pointer-events-none z-25" style={{ 
        background: 'linear-gradient(to bottom, transparent 0%, transparent 95%, rgba(255, 255, 255, 0.2) 95%, rgba(255, 255, 255, 0.2) 96%, transparent 96%, transparent 100%)',
        animation: 'trackingShift 8s linear infinite',
        opacity: 0.3
      }}></div>

      {/* 90s VHS Corner Brackets */}
      <div className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center">
        <div className="w-[98%] h-[96%] relative">
          {/* Top Left */}
          <div className="absolute top-0 left-0 w-[30px] h-[30px] border-t-2 border-l-2 border-white opacity-10"></div>
          {/* Top Right */}
          <div className="absolute top-0 right-0 w-[30px] h-[30px] border-t-2 border-r-2 border-white opacity-10"></div>
          {/* Bottom Left */}
          <div className="absolute bottom-0 left-0 w-[30px] h-[30px] border-b-2 border-l-2 border-white opacity-10"></div>
          {/* Bottom Right */}
          <div className="absolute bottom-0 right-0 w-[30px] h-[30px] border-b-2 border-r-2 border-white opacity-10"></div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes grainShift {
          0%, 100% { transform: translate(0, 0) scale(1.0); }
          10% { transform: translate(-1%, 1%) scale(1.01); }
          20% { transform: translate(1%, 1%) scale(0.99); }
          30% { transform: translate(1%, -1%) scale(1.01); }
          40% { transform: translate(0%, 1%) scale(0.99); }
          50% { transform: translate(-1%, -1%) scale(1.01); }
          60% { transform: translate(0%, 0%) scale(0.99); }
          70% { transform: translate(1%, 0%) scale(1.01); }
          80% { transform: translate(-1%, 0%) scale(0.99); }
          90% { transform: translate(0%, -1%) scale(1.01); }
        }
        
        @keyframes trackingShift {
          0%, 100% { transform: translateY(0); }
          5% { transform: translateY(5px); }
          10% { transform: translateY(0); }
          15% { transform: translateY(-3px); }
          20% { transform: translateY(0); }
          80% { transform: translateY(0); }
          85% { transform: translateY(10px); }
          90% { transform: translateY(0); }
          95% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}
