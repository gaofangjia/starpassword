import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  life: number;
}

const StarBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const stars: Star[] = [];
    const numStars = 1500; // Increased star count
    const centerX = width / 2;
    const centerY = height / 2;
    const focalLength = width * 0.8;
    
    let shootingStars: ShootingStar[] = [];

    // Initialize stars
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 3,
        y: (Math.random() - 0.5) * height * 3,
        z: Math.random() * width,
        size: Math.random() * 1.5,
        brightness: Math.random(),
        twinkleSpeed: 0.02 + Math.random() * 0.05
      });
    }

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.01;
      // Draw background with slight transparency for trail effect (optional, here we use solid clear to keep it crisp)
      // A radial gradient simulates the "Nebula" depth
      const gradient = ctx.createRadialGradient(centerX, centerY, height * 0.2, centerX, centerY, height * 1.5);
      gradient.addColorStop(0, '#1e293b'); // Slate-800 center
      gradient.addColorStop(1, '#020617'); // Slate-950 edges
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render Stars
      stars.forEach((star) => {
        // Move star closer
        star.z -= 0.5; // Slower, majestic movement

        // Reset if passed screen
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * width * 3;
          star.y = (Math.random() - 0.5) * height * 3;
          star.z = width;
          star.brightness = Math.random();
        }

        // Project 3D to 2D
        const x2d = (star.x / star.z) * focalLength + centerX;
        const y2d = (star.y / star.z) * focalLength + centerY;
        const size2d = (1 - star.z / width) * 2.5;

        if (x2d >= 0 && x2d <= width && y2d >= 0 && y2d <= height) {
          // Twinkle effect
          const twinkle = Math.sin(time * 10 + star.twinkleSpeed * 100) * 0.3 + 0.7;
          const alpha = (1 - star.z / width) * star.brightness * twinkle;
          
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x2d, y2d, Math.max(0.1, size2d), 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Spawn Shooting Stars randomly
      if (Math.random() < 0.02) {
         shootingStars.push({
           x: Math.random() * width,
           y: Math.random() * height * 0.5,
           length: 50 + Math.random() * 100,
           speed: 15 + Math.random() * 10,
           angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
           life: 1.0
         });
      }

      // Render Shooting Stars
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      shootingStars.forEach((star, index) => {
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.life -= 0.02;

        if (star.life <= 0) {
          shootingStars.splice(index, 1);
        } else {
          const tailX = star.x - Math.cos(star.angle) * star.length;
          const tailY = star.y - Math.sin(star.angle) * star.length;

          const grad = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
          grad.addColorStop(0, `rgba(100, 200, 255, ${star.life})`);
          grad.addColorStop(1, `rgba(100, 200, 255, 0)`);

          ctx.strokeStyle = grad;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
      aria-hidden="true"
    />
  );
};

export default StarBackground;