"use client";
import React from "react";
import TestimoniosSection from "@/components/TestimoniosSection";
import Navbar from "@/components/Navbar";

export default function TestimoniosPage() {
  return (
    <main className="min-h-screen bg-[#080808] relative overflow-x-hidden">
      {/* Navbar fija */}
      <div className="fixed top-0 left-0 right-0 transition-all duration-700 z-[100]">
        <Navbar />
      </div>

      {/* Contenido Principal */}
      <div className="pt-32 pb-20">
        <TestimoniosSection />
      </div>

      {/* Decoración de fondo */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#FF6B00]/5 blur-[150px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-[#FF6B00]/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
    </main>
  );
}
