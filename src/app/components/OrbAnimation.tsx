/* Assume Y axis is Z axis and Z axis is Y Axis */
/* Assume Y axis is Z axis and Z axis is Y Axis */

'use client';

import { useEffect, useRef } from 'react';

// Color palette - modify these hex values to change the animation colors
const PARTICLE_COLORS = {
  primaryColor: "#FF00FF",    // Magenta
  secondaryColor: "#00FFFF",  // Cyan
  accentColor: "#0000FF",     // Blue
};

interface OrbAnimationProps {
  progress?: number;
}

const OrbAnimation: React.FC<OrbAnimationProps> = ({ progress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>();
  const varsRef = useRef<any>();

  // Utility functions
  const project3D = (x: number, y: number, z: number, vars: any) => {
    let p, d;
    x -= vars.camX;
    y -= vars.camY;
    z -= vars.camZ+2;
    p = Math.atan2(x, z);
    d = Math.sqrt(x * x + z * z);
    x = Math.sin(p - vars.yaw) * d;
    z = Math.cos(p - vars.yaw) * d;
    p = Math.atan2(y, z);
    d = Math.sqrt(y * y + z * z);
    y = Math.sin(p - vars.pitch) * d;
    z = Math.cos(p - vars.pitch) * d;
    const rx1 = -1000;
    const ry1 = 1;
    const rx2 = 1000;
    const ry2 = 1;
    const rx3 = 0;
    const ry3 = 0;
    const rx4 = x;
    const ry4 = z;
    const uc = (ry4 - ry3) * (rx2 - rx1) - (rx4 - rx3) * (ry2 - ry1);
    const ua = ((rx4 - rx3) * (ry1 - ry3) - (ry4 - ry3) * (rx1 - rx3)) / uc;
    const ub = ((rx2 - rx1) * (ry1 - ry3) - (ry2 - ry1) * (rx1 - rx3)) / uc;
    if (!z) z = 0.000000001;
    if (ua > 0 && ua < 1 && ub > 0 && ub < 1) {
      return {
        x: vars.cx + (rx1 + ua * (rx2 - rx1)) * vars.scale,
        y: vars.cy + y / z * vars.scale,
        d: (x * x + y * y + z * z)
      };
    }
    return { d: -1 };
  };

  // Helper function to lighten a color
  const lightenColor = (hexColor: string, factor: number) => {
    // Convert hex to rgb
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Lighten each component
    const lighterR = Math.min(255, r + (255 - r) * factor);
    const lighterG = Math.min(255, g + (255 - g) * factor);
    const lighterB = Math.min(255, b + (255 - b) * factor);
    
    // Convert back to hex
    return `#${Math.round(lighterR).toString(16).padStart(2, '0')}${Math.round(lighterG).toString(16).padStart(2, '0')}${Math.round(lighterB).toString(16).padStart(2, '0')}`;
  };

  // Color generation function - creates a smooth transition between colors
  const rgb = (col: number) => {
    // Normalize col to be between 0 and 1
    col = (col + 0.000001) % 1;
    
    // Convert hex colors to RGB components
    const colors = Object.values(PARTICLE_COLORS).map(hex => ({
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16)
    }));
    
    // Calculate which two colors to interpolate between
    const colorCount = colors.length;
    const colorIndex = Math.floor(col * colorCount);
    const nextColorIndex = (colorIndex + 1) % colorCount;
    const colorPos = (col * colorCount) % 1;
    
    // Interpolate between the two colors
    const c1 = colors[colorIndex];
    const c2 = colors[nextColorIndex];
    
    const r = Math.floor(c1.r + (c2.r - c1.r) * colorPos);
    const g = Math.floor(c1.g + (c2.g - c1.g) * colorPos);
    const b = Math.floor(c1.b + (c2.b - c1.b) * colorPos);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const spawnParticle = (vars: any, isSecondary = false) => {
    const pt: any = {};
    const p = Math.PI * 2 * Math.random();
    const ls = Math.sqrt(Math.random() * vars.distributionRadius);
    pt.x = Math.sin(p) * ls;
    pt.y = -vars.vortexHeight / 2;
    pt.vy = vars.initV / 20 + Math.random() * vars.initV;
    if (isSecondary) {
      pt.vy *= 0.5; // Half speed for secondary particles
    }
    pt.z = Math.cos(p) * ls;
    pt.radius = 200 + Math.random() * 400;
    pt.color = pt.radius / 600;
    pt.isSecondary = isSecondary;
    pt.life = 180; // 3 seconds at 60fps
    vars.points.push(pt);
  };

  // Set number of particles for secondary (second line divisor)
  const process = (vars: any) => {
    const mainParticleCount = Math.floor(vars.initParticles);
    const secondaryParticleCount = Math.floor(vars.initParticles / 16);
    
    // Count current particles of each type
    const currentMain = vars.points.filter((p: any) => !p.isSecondary).length;
    const currentSecondary = vars.points.filter((p: any) => p.isSecondary).length;

    // Spawn main particles
    if (currentMain < mainParticleCount) {
      for (let i = 0; i < 5; ++i) spawnParticle(vars, false);
    }

    // Spawn secondary particles
    if (currentSecondary < secondaryParticleCount) {
      for (let i = 0; i < 3; ++i) spawnParticle(vars, true);
    }

    // Fixed camera position looking down
    vars.camX = 0;
    vars.camY = 80; 
    vars.camZ = 0;
    vars.yaw = Math.PI;
    vars.pitch = -Math.PI / 2; // Looking straight down

    let x, y, z, d, t;
    for (let i = vars.points.length - 1; i >= 0; i--) {
      // Decrease life and remove if dead
      vars.points[i].life--;
      if (vars.points[i].life <= 0) {
        vars.points.splice(i, 1);
        continue;
      }

      x = vars.points[i].x;
      y = vars.points[i].y;
      z = vars.points[i].z;
      d = Math.sqrt(x * x + z * z) / 1.0075;
      t = 0.1 / (1 + d * d / 5);
      const p = Math.atan2(x, z) + t;
      vars.points[i].x = Math.sin(p) * d;
      vars.points[i].z = Math.cos(p) * d;
      vars.points[i].y += vars.points[i].vy * t * ((Math.sqrt(vars.distributionRadius) - d) * 2);
      if (vars.points[i].y > vars.vortexHeight / 2 || d < 0.25) {
        vars.points.splice(i, 1);
        if (vars.points[i]?.isSecondary) {
          spawnParticle(vars, true);
        } else {
          spawnParticle(vars, false);
        }
      }
    }
  };

  const drawParticle = (vars: any, point: any, size: number, alpha: number, color: string, isSecondary = false) => {
    if (point.x > -1 && point.x < vars.canvas.width && point.y > -1 && point.y < vars.canvas.height) {
      vars.ctx.globalAlpha = alpha;
      vars.ctx.fillStyle = color;
      
      if (isSecondary) {
        vars.ctx.beginPath();
        vars.ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
        vars.ctx.fill();
      } else {
        vars.ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
      }
    }
  };

  const draw = (vars: any) => {
    if (!vars.ctx) return;

    // Add blur effect to the context
    vars.ctx.shadowBlur = 10;
    vars.ctx.shadowColor = '#000000';

    // Clear the canvas with transparent background
    // vars.ctx.clearRect(0, 0, vars.canvas.width, vars.canvas.height);
    
    // Fade existing content to black
    vars.ctx.globalAlpha = 0.15;  
    vars.ctx.fillStyle = "rgba(0, 0, 0, 1)";
    vars.ctx.fillRect(0, 0, vars.canvas.width, vars.canvas.height);

    // Reset alpha for particles
    vars.ctx.globalAlpha = 1;

    let point, x, y, z, a;
    for (let i = 0; i < vars.points.length; ++i) {
      x = vars.points[i].x;
      y = vars.points[i].y;
      z = vars.points[i].z;
      point = project3D(x, y, z, vars);
      if (point.d !== -1) {
        vars.points[i].dist = point.d;
        let baseSize = 2 + vars.points[i].radius / (1 + point.d * 0.8);
        const d = Math.abs(vars.points[i].y);
        let baseAlpha = 0.9 - Math.pow(d / (vars.vortexHeight / 2), 800) * 0.8;
        
        if (vars.points[i].isSecondary) {
          baseSize *= 8;  // Double size for secondary particles
          baseAlpha *= 0.10;  // 25% opacity for secondary particles
        }
        
        const baseColor = rgb(vars.points[i].color);

        // Set shadow color based on particle color for glow
        vars.ctx.shadowColor = baseColor;

        // Draw outer glow (largest, most transparent, lightest)
        vars.ctx.shadowBlur = 20;
        drawParticle(vars, point, baseSize * 3, baseAlpha * 0.2, lightenColor(baseColor, 0.8), vars.points[i].isSecondary);
        
        // Draw middle glow
        vars.ctx.shadowBlur = 15;
        drawParticle(vars, point, baseSize * 2, baseAlpha * 0.4, lightenColor(baseColor, 0.5), vars.points[i].isSecondary);
        
        // Draw inner glow
        vars.ctx.shadowBlur = 10;
        drawParticle(vars, point, baseSize * 1.5, baseAlpha * 0.6, lightenColor(baseColor, 0.2), vars.points[i].isSecondary);
        
        // Draw core particle (original color)
        vars.ctx.shadowBlur = 5;
        drawParticle(vars, point, baseSize, baseAlpha, baseColor, vars.points[i].isSecondary);
      }
    }
    vars.points.sort((a: any, b: any) => b.dist - a.dist);

    // Draw decorative circle in foreground
    const circleRadius = vars.canvas.width / 2; // Back to half canvas width
    const gradient = vars.ctx.createLinearGradient(
      vars.cx - circleRadius, vars.cy,
      vars.cx + circleRadius, vars.cy
    );
    
    gradient.addColorStop(0, '#FF00FF');   // Magenta
    gradient.addColorStop(0.5, '#00FFFF');  // Cyan
    gradient.addColorStop(1, '#0000FF');    // Blue

    // Set circle styles
    vars.ctx.strokeStyle = gradient;
    vars.ctx.lineWidth = 2; // Thinner line
    vars.ctx.shadowColor = 'rgba(0, 255, 255, 0.5)'; // More transparent shadow
    vars.ctx.shadowBlur = 30; // Reduced blur
    vars.ctx.shadowOffsetX = 0;
    vars.ctx.shadowOffsetY = 0;

    // Draw circle
    vars.ctx.beginPath();
    vars.ctx.arc(vars.cx, vars.cy, circleRadius, 0, Math.PI * 2);
    vars.ctx.stroke();
  };

  const frame = () => {
    if (!varsRef.current) return;
    process(varsRef.current);
    draw(varsRef.current);
    frameRef.current = requestAnimationFrame(frame);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Initialize variables
    varsRef.current = {
      canvas,
      ctx,
      cx: canvas.width / 2,
      cy: canvas.height / 2,
      scale: 1400,
      points: [],
      initParticles: 400,
      initV: 40,
      distributionRadius: 1200,
      vortexHeight: 25,
      camX: 0,
      camY: 80,
      camZ: 0,
      yaw: Math.PI,
      pitch: -Math.PI / 2,
      frameNo: 0
    };

    // Start animation
    frame();

    return () => {
      window.removeEventListener('resize', updateSize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        left: '0',
        top: '0',
        zIndex: 1,
        background: 'transparent',
        filter: 'blur(1px)',
        WebkitFilter: 'blur(1px)'
      }}
    />
  );
};

export default OrbAnimation;
