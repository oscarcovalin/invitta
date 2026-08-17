import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  fadeSpeed: number;
  color: string;
  wobble: number;
  wobbleSpeed: number;
}

export function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    // Luxury color palette for particles (Champagne gold, sparkling dust, soft blush gold)
    const goldTones = [
      "rgba(223, 186, 107, ",  // #dfba6b
      "rgba(207, 166, 83, ",   // #cfa653
      "rgba(241, 219, 156, ",  // #f1db9c
      "rgba(232, 180, 168, ",  // Blush Rose #e8b4a8
      "rgba(250, 220, 212, "   // Cream Rose #fadcd4
    ];

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      // Account for device pixel ratio for super-crisp high-DPI rendering
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Helper to create a single particle with random properties
    const createParticle = (initBottom = false): Particle => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.random() * rect.width;
      // Start at the bottom if initializing during simulation, or random height if first load
      const y = initBottom ? rect.height + 10 : Math.random() * rect.height;
      const size = Math.random() * 2.5 + 0.8; // fine elegant dust
      const speedY = -(Math.random() * 0.4 + 0.2); // drifting upwards
      const speedX = (Math.random() - 0.5) * 0.15; // gentle breeze
      const rotation = Math.random() * Math.PI * 2;
      const rotationSpeed = (Math.random() - 0.5) * 0.01;
      const opacity = Math.random() * 0.4 + 0.2; // delicate transparency
      const fadeSpeed = Math.random() * 0.002 + 0.0005;
      const wobble = Math.random() * Math.PI * 2;
      const wobbleSpeed = Math.random() * 0.01 + 0.005;
      const color = goldTones[Math.floor(Math.random() * goldTones.length)];

      return {
        x,
        y,
        size,
        speedY,
        speedX,
        rotation,
        rotationSpeed,
        opacity,
        fadeSpeed,
        color,
        wobble,
        wobbleSpeed,
      };
    };

    // Initialize initial pool of floating dust
    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(false));
    }

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      particles.forEach((p, index) => {
        // Move particle
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.wobble) * 0.12; // gentle sway/wobble
        p.wobble += p.wobbleSpeed;
        p.rotation += p.rotationSpeed;

        // Fade out slightly over time, or fade in when starting
        // If it drifts too high, recycle it
        if (p.y < -10 || p.x < -10 || p.x > rect.width + 10) {
          particles[index] = createParticle(true);
        } else {
          // Soft pulse/fade glow effect
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          
          // Draw sparkling luxury dust
          // Draw either a soft round light or a microscopic leaf/petal
          ctx.beginPath();
          if (index % 3 === 0) {
            // Tiny diamond spark
            ctx.moveTo(0, -p.size * 1.5);
            ctx.lineTo(p.size, 0);
            ctx.lineTo(0, p.size * 1.5);
            ctx.lineTo(-p.size, 0);
          } else if (index % 3 === 1) {
            // Microscopic petal/leaf
            ctx.ellipse(0, 0, p.size * 1.2, p.size * 0.7, 0, 0, Math.PI * 2);
          } else {
            // Round soft glow
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          }

          ctx.fillStyle = `${p.color}${p.opacity})`;
          
          // Add a very subtle blur/glow for organic look
          if (p.size > 2) {
            ctx.shadowBlur = 6;
            ctx.shadowColor = "rgba(223, 186, 107, 0.4)";
          }
          
          ctx.fill();
          ctx.restore();
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden opacity-80"
    />
  );
}
