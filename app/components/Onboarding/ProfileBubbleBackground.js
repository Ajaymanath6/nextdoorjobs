"use client";

import { useEffect, useRef } from "react";

const PROFILES = [
  { name: "Alex", initials: "AK", hue: 330, avatar: "/avatars/avatar1.png" },
  { name: "Sam", initials: "SJ", hue: 200, avatar: "/avatars/avatar2.png" },
  { name: "Jordan", initials: "JR", hue: 45, avatar: "/avatars/avatar3.png" },
  { name: "Taylor", initials: "TW", hue: 160, avatar: "/avatars/avatar4.png" },
  { name: "Morgan", initials: "MG", hue: 270, avatar: "/avatars/avatar5.png" },
  { name: "Casey", initials: "CL", hue: 15, avatar: "/avatars/avatar6.png" },
  { name: "Riley", initials: "RD", hue: 190, avatar: "/avatars/avatar1.png" },
  { name: "Quinn", initials: "QP", hue: 340, avatar: "/avatars/avatar2.png" },
  { name: "Avery", initials: "AB", hue: 120, avatar: "/avatars/avatar3.png" },
  { name: "Drew", initials: "DH", hue: 55, avatar: "/avatars/avatar4.png" },
  { name: "Reese", initials: "RM", hue: 290, avatar: "/avatars/avatar5.png" },
  { name: "Blair", initials: "BN", hue: 0, avatar: "/avatars/avatar6.png" },
];

export default function ProfileBubbleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let bubbles = [];
    let particles = [];
    const mouse = { x: -2000, y: -2000 };
    const bubbleCount = 18;
    let animId;
    const imageCache = new Map();

    class Particle {
      constructor(x, y, hue) {
        this.x = x;
        this.y = y;
        this.hue = hue;
        this.size = Math.random() * 4 + 1;
        this.speedX = (Math.random() - 0.5) * 10;
        this.speedY = (Math.random() - 0.5) * 10;
        this.gravity = 0.15;
        this.opacity = 1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.opacity -= 0.02;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.fillStyle = `hsl(${this.hue}, 70%, 65%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `hsl(${this.hue}, 90%, 85%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    class Bubble {
      constructor(first = true) {
        this.x = 0;
        this.y = 0;
        this.r = 0;
        this.speed = 0;
        this.angle = 0;
        this.wobbleSpeed = 0;
        this.popped = false;
        this.profile = PROFILES[0];
        this.prevX = 0;
        this.tailMidY = 0;
        this.tailEndY = 0;
        this.tailVelMid = 0;
        this.tailVelEnd = 0;
        this.init(first);
      }

      init(firstLoad) {
        this.r = Math.random() * 18 + 28;
        this.x = Math.random() * (canvas?.width ?? 800);
        this.y = firstLoad
          ? Math.random() * (canvas?.height ?? 600)
          : (canvas?.height ?? 600) + this.r + 200;
        this.profile = PROFILES[Math.floor(Math.random() * PROFILES.length)];
        this.speed = Math.random() * 0.8 + 0.3;
        this.wobbleSpeed = Math.random() * 0.015 + 0.008;
        this.angle = Math.random() * Math.PI * 2;
        this.popped = false;
        this.prevX = this.x;
        this.tailMidY = this.r + 35;
        this.tailEndY = this.r + 100;
        this.tailVelMid = 0;
        this.tailVelEnd = 0;
      }

      pop() {
        if (this.popped) return;
        this.popped = true;
        for (let i = 0; i < 18; i++)
          particles.push(new Particle(this.x, this.y, this.profile.hue));
        setTimeout(() => this.init(false), 1200 + Math.random() * 1500);
      }

      update() {
        if (this.popped) return;
        this.y -= this.speed;
        this.angle += this.wobbleSpeed;
        this.x += Math.sin(this.angle * 0.6) * 0.7;
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        if (Math.sqrt(dx * dx + dy * dy) < this.r + 12) this.pop();
        if (this.y < -this.r - 200) this.init(false);
        this.draw();
      }

      draw() {
        if (!ctx) return;
        const { hue } = this.profile;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.sin(this.angle) * 0.04);

        // String
        const moveDx = this.x - this.prevX;
        this.prevX = this.x;
        const midTarget = this.r + 35 + Math.abs(moveDx) * 6;
        this.tailVelMid += (midTarget - this.tailMidY) * 0.08;
        this.tailVelMid *= 0.85;
        this.tailMidY += this.tailVelMid;
        const endTarget = this.r + 100 + Math.abs(moveDx) * 12;
        this.tailVelEnd += (endTarget - this.tailEndY) * 0.08;
        this.tailVelEnd *= 0.85;
        this.tailVelEnd += 0.3;
        this.tailEndY += this.tailVelEnd;
        const sway = Math.sin(this.angle * 1.8) * 5 + moveDx * 3;

        ctx.beginPath();
        ctx.moveTo(0, this.r + 3);
        ctx.bezierCurveTo(
          sway,
          this.tailMidY * 0.5,
          -sway,
          this.tailMidY,
          sway * 0.6,
          this.tailEndY
        );
        ctx.strokeStyle = `hsla(${hue}, 40%, 60%, 0.2)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Glow
        const glow = ctx.createRadialGradient(0, 0, this.r * 0.8, 0, 0, this.r * 1.6);
        glow.addColorStop(0, `hsla(${hue}, 60%, 50%, 0.08)`);
        glow.addColorStop(1, `hsla(${hue}, 60%, 50%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, this.r * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Bubble
        const grad = ctx.createRadialGradient(
          -this.r * 0.25,
          -this.r * 0.3,
          this.r * 0.1,
          0,
          0,
          this.r
        );
        grad.addColorStop(0, `hsla(${hue}, 50%, 75%, 0.35)`);
        grad.addColorStop(0.5, `hsla(${hue}, 45%, 40%, 0.25)`);
        grad.addColorStop(1, `hsla(${hue}, 55%, 25%, 0.3)`);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `hsla(${hue}, 50%, 70%, 0.3)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Highlight
        ctx.beginPath();
        ctx.arc(-this.r * 0.25, -this.r * 0.3, this.r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(0, 0%, 100%, 0.18)`;
        ctx.fill();

        // Avatar image or initials fallback
        const img = imageCache.get(this.profile.avatar);
        if (img && img.complete) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, this.r * 0.75, 0, Math.PI * 2);
          ctx.clip();

          const imgSize = this.r * 1.5;
          ctx.drawImage(img, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
          ctx.restore();
        } else {
          // Fallback to initials if image not loaded
          ctx.globalAlpha = 1;
          ctx.fillStyle = `hsl(${hue}, 70%, 85%)`;
          ctx.font = `bold ${this.r * 0.65}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(this.profile.initials, 0, 1);
        }

        // Name
        ctx.globalAlpha = 1;
        ctx.fillStyle = `hsla(${hue}, 50%, 80%, 0.6)`;
        ctx.font = `${Math.max(9, this.r * 0.28)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.profile.name, 0, this.r + 16);

        ctx.restore();
      }
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bubbles = [];
      for (let i = 0; i < bubbleCount; i++) bubbles.push(new Bubble(true));
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter((p) => p.opacity > 0);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      bubbles.forEach((b) => b.update());
      animId = requestAnimationFrame(animate);
    };

    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    // Preload all avatar images before starting animation
    const loadImages = async () => {
      const loadPromises = PROFILES.map((profile) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            imageCache.set(profile.avatar, img);
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load ${profile.avatar}`);
            resolve(); // Continue even if image fails
          };
          img.src = profile.avatar;
        });
      });

      await Promise.all(loadPromises);
      
      // Start animation after images are loaded
      window.addEventListener("resize", resize);
      window.addEventListener("mousemove", onMouseMove);
      resize();
      animate();
    };

    loadImages();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="block w-full h-full pointer-events-auto" />
    </div>
  );
}
