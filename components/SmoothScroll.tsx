"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.1,
      lerp: 0.08, // Suavizado extra
    });

    if (typeof window !== "undefined") {
      (window as any).lenis = lenis;
    }

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Forzamos sincronización
    const timer = setInterval(() => {
      ScrollTrigger.refresh();
    }, 1000);

    return () => {
      lenis.destroy();
      if (typeof window !== "undefined") {
        try {
          delete (window as any).lenis;
        } catch (e) {}
      }
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
      clearInterval(timer);
    };
  }, []);

  return null; // El CSS lo manejamos en el Layout o Page
}
