"use client";
import React, { useState } from "react";
import Articulos from "@/components/Articulos";
import Navbar from "@/components/Navbar";

export default function ArticulosPage() {
  return (
    <main className="min-h-screen bg-[#080808] relative overflow-x-hidden">
      {/* Navbar fija */}
      <div className="fixed top-0 left-0 right-0 transition-all duration-700 z-[100]">
        <Navbar />
      </div>

      {/* Contenido Principal */}
      <div className="pt-32 pb-20">
        <Articulos />
      </div>

      {/* Decoración de fondo (Opcional para mantener el estilo oscuro/pro) */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#FF6B00]/5 blur-[150px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-white/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
    </main>
  );
}
