import { useEffect, useRef } from "react";
import p5 from "p5";

interface HeroBackgroundProps {
  className?: string;
}

export function HeroBackground({ className }: HeroBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check for performance preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const sketch = (p: p5) => {
      const particles: Particle[] = [];
      const numParticles = 40; // Optimized for performance
      const maxSpeed = 0.8; // Reduced for smoother animation
      const connectionDistance = 120; // Reduced for less computation
      const nodeSize = 2.5; // Smaller particles

      class Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        targetX: number;
        targetY: number;

        constructor() {
          // Use default values, will be set in setup after canvas is created
          this.x = 0;
          this.y = 0;
          this.vx = p.random(-maxSpeed, maxSpeed);
          this.vy = p.random(-maxSpeed, maxSpeed);
          this.targetX = 0;
          this.targetY = 0;
        }

        initialize() {
          // Initialize position after canvas is created
          this.x = p.random(p.width);
          this.y = p.random(p.height);
          this.targetX = this.x;
          this.targetY = this.y;
        }

        update() {
          // Smooth movement to target with damping
          this.x += (this.targetX - this.x) * 0.02;
          this.y += (this.targetY - this.y) * 0.02;

          // Add slight drift
          this.x += this.vx;
          this.y += this.vy;

          // Wrap around edges
          if (this.x < 0) this.x = p.width;
          if (this.x > p.width) this.x = 0;
          if (this.y < 0) this.y = p.height;
          if (this.y > p.height) this.y = 0;

          // Occasionally set new target
          if (p.random() < 0.005) {
            this.targetX = p.random(p.width);
            this.targetY = p.random(p.height);
          }
        }

        draw() {
          p.noStroke();
          p.fill(15, 23, 42, 30); // slate-900 with low opacity
          p.circle(this.x, this.y, nodeSize);
        }
      }

      p.setup = () => {
        const canvas = p.createCanvas(
          containerRef.current?.clientWidth || 1200,
          containerRef.current?.clientHeight || 600
        );
        canvas.elt.style.position = "absolute";
        canvas.elt.style.top = "0";
        canvas.elt.style.left = "0";
        canvas.elt.style.zIndex = "0";
        p.noLoop(); // Start paused for LCP optimization
        
        // Initialize particles AFTER canvas is created
        for (let i = 0; i < numParticles; i++) {
          particles.push(new Particle());
        }
        
        // Set initial positions now that p.width and p.height are available
        particles.forEach(particle => particle.initialize());
      };

      p.draw = () => {
        p.clear();
        
        // Draw connections
        p.stroke(15, 23, 42, 15); // Very subtle connections
        p.strokeWeight(0.5);
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const particleI = particles[i];
            const particleJ = particles[j];
            if (!particleI || !particleJ) continue;
            
            const d = p.dist(
              particleI.x,
              particleI.y,
              particleJ.x,
              particleJ.y
            );
            if (d < connectionDistance) {
              const opacity = p.map(d, 0, connectionDistance, 30, 0);
              p.stroke(15, 23, 42, opacity);
              p.line(particleI.x, particleI.y, particleJ.x, particleJ.y);
            }
          }
        }

        // Update and draw particles
        for (const particle of particles) {
          if (particle) {
            particle.update();
            particle.draw();
          }
        }
      };

      // Handle window resize
      p.windowResized = () => {
        p.resizeCanvas(
          containerRef.current?.clientWidth || 1200,
          containerRef.current?.clientHeight || 600
        );
      };

      // Delayed animation start for LCP optimization
      animationTimeoutRef.current = window.setTimeout(() => {
        p.loop();
      }, 1000); // Start animation 1s after load
    };

    // Create p5 instance
    p5Instance.current = new p5(sketch, containerRef.current);

    // Cleanup
    return () => {
      // Clear timeout if component unmounts before animation starts
      if (animationTimeoutRef.current !== null) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
      
      if (p5Instance.current) {
        p5Instance.current.remove();
        p5Instance.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className || ""}`}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      {/* Fallback gradient for when animation is disabled */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-slate-900/5" />
    </div>
  );
}

