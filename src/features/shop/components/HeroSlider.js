"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

export default function HeroSlider() {
  const images = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg"];
  const [current, setCurrent] = useState(0);

  // অটো-স্লাইড (প্রতি ৫ সেকেন্ড পর পর)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  const prevSlide = () => {
    setCurrent(current === 0 ? images.length - 1 : current - 1);
  };

  const nextSlide = () => {
    setCurrent(current === images.length - 1 ? 0 : current + 1);
  };

  return (
    <div className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] lg:h-[450px] overflow-hidden rounded-2xl group bg-white flex items-center justify-center">
      {/* Image Slides */}
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex items-center justify-center ${
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <div className="relative w-full h-full">
            <Image
              src={img}
              alt={`Hero Banner ${index + 1}`}
              fill
              priority={index === 0}
              className="object-contain object-center"
            />
          </div>
        </div>
      ))}

      {/* Left Navigation Arrow */}
      <button
        onClick={prevSlide}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
        aria-label="Previous Slide"
      >
        ‹
      </button>

      {/* Right Navigation Arrow */}
      <button
        onClick={nextSlide}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
        aria-label="Next Slide"
      >
        ›
      </button>

      {/* Bottom Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              idx === current
                ? "w-8 bg-emerald-600"
                : "w-2.5 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}