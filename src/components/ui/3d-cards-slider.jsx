import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const ParallaxCardCarousel = ({ 
  cards = [],
  autoplaySpeed = 5000,
  enableAutoplay = true,
  cardWidth = 320,
  cardHeight = 450,
  gap = 30,
  perspective = 1200,
  maxRotation = 25,
  parallaxFactor = 0.2,
  backgroundColor = 'bg-transparent'
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(enableAutoplay);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const carouselRef = useRef(null);
  const autoplayTimerRef = useRef(null);
  const touchStartRef = useRef(0);
  
  // Handle card rotation and parallax on mouse move
  const handleMouseMove = (e) => {
    if (!carouselRef.current) return;
    
    const rect = carouselRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    
    setMousePosition({ x, y });
  };
  
  // Handle autoplay timing
  useEffect(() => {
    if (isAutoPlaying && !isHovered) {
      autoplayTimerRef.current = setTimeout(() => {
        goToNext();
      }, autoplaySpeed);
    }
    
    return () => clearTimeout(autoplayTimerRef.current);
  }, [activeIndex, isAutoPlaying, isHovered]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Navigation methods
  const goToNext = () => setActiveIndex((prev) => (prev + 1) % cards.length);
  const goToPrev = () => setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);
  const goToIndex = (index) => setActiveIndex(index);
  
  // Touch handlers
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  };
  
  // Calculate card positions
  const getCardStyle = (index) => {
    if (cards.length === 0) return {};
    const isActive = index === activeIndex;
    const distance = ((index - activeIndex + cards.length) % cards.length);
    let adjustedDistance = distance;
    if (distance > cards.length / 2) adjustedDistance = distance - cards.length;
    
    const x = adjustedDistance * (cardWidth + gap);
    const scale = isActive ? 1 : 0.85 - Math.min(Math.abs(adjustedDistance), 2) * 0.05;
    const zIndex = cards.length - Math.abs(adjustedDistance);
    const opacity = 1 - Math.min(Math.abs(adjustedDistance) * 0.25, 0.6);
    
    // Apply mouse position effect only to active card
    let rotateY = 0;
    let rotateX = 0;
    let translateZ = 0;
    
    if (isActive && isHovered) {
      rotateY = -mousePosition.x * maxRotation;
      rotateX = mousePosition.y * (maxRotation * 0.5);
      translateZ = 50;
    }
    
    return {
      x,
      scale,
      zIndex,
      opacity,
      rotateY,
      rotateX,
      translateZ,
    };
  };

  // Card layers for parallax effect
  const renderCardLayers = (card, index) => {
    const isActive = index === activeIndex;
    
    return (
      <div className="relative w-full h-full">
        {/* Background Layer */}
        <motion.div 
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden"
          style={{ 
            translateZ: isActive && isHovered ? -20 : 0,
            translateX: isActive && isHovered ? -mousePosition.x * 10 : 0,
            translateY: isActive && isHovered ? -mousePosition.y * 10 : 0,
          }}
        />
        
        {/* Content Layer */}
        <motion.div 
          className="absolute inset-0 p-6 flex flex-col justify-between z-10"
          style={{ 
            translateZ: isActive && isHovered ? 30 : 0,
            translateX: isActive && isHovered ? mousePosition.x * 15 : 0,
            translateY: isActive && isHovered ? mousePosition.y * 15 : 0,
          }}
        >
          {/* Card Header */}
          <div>
            <h3 className="text-xl font-bold text-white mb-1 truncate">{card.title}</h3>
            <p className="text-purple-300 text-sm font-semibold">{card.subtitle}</p>
          </div>
          
          {/* Card Content */}
          {card.imageUrl && (
            <motion.div 
              className="my-4 rounded-lg overflow-hidden flex-1 relative"
              style={{ 
                translateZ: isActive && isHovered ? 60 : 0,
                translateX: isActive && isHovered ? mousePosition.x * 25 : 0,
                translateY: isActive && isHovered ? mousePosition.y * 25 : 0,
              }}
            >
              <img 
                src={card.imageUrl} 
                alt={card.title} 
                className="absolute inset-0 w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-black/20" />
            </motion.div>
          )}
          
          {/* Card Footer */}
          <div>
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">{card.description}</p>
            <div className="flex justify-between items-center">
              {card.price !== undefined && <span className="text-lg font-bold text-white">₹{card.price}</span>}
              <button 
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
                onClick={(e) => { e.stopPropagation(); card.onAction && card.onAction(); }}
              >
                {card.actionLabel || 'Learn More'}
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Glass Reflection Effect */}
        <motion.div 
          className="absolute inset-0 rounded-2xl bg-white opacity-5 pointer-events-none"
          style={{ 
            background: isActive && isHovered 
              ? `linear-gradient(
                  ${135 + (mousePosition.y * 40)}deg, 
                  rgba(255,255,255,0.1) 0%, 
                  rgba(255,255,255,0.15) 50%, 
                  rgba(255,255,255,0) 50.1%
                )`
              : 'none',
            translateZ: isActive && isHovered ? 70 : 0,
          }}
        />
        
        {/* Card border */}
        <motion.div 
          className="absolute inset-0 rounded-2xl border border-white/20 pointer-events-none"
          style={{ 
            boxShadow: isActive && isHovered 
              ? `0 20px 25px -5px rgba(0, 0, 0, 0.4), 
                 0 10px 10px -5px rgba(0, 0, 0, 0.2),
                 inset 0 0 0 1px rgba(255, 255, 255, 0.1)`
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            translateZ: 10,
          }}
        />
      </div>
    );
  };

  if (!cards || cards.length === 0) return null;

  return (
    <div className={`w-full flex flex-col items-center justify-center py-10 ${backgroundColor}`}>
      <div 
        ref={carouselRef}
        className="relative perspective-1200 w-full max-w-6xl mx-auto"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Card Carousel"
        role="region"
        style={{ 
          perspective: `${perspective}px`,
          height: `${cardHeight + 100}px`
        }}
      >
        {/* Cards */}
        <div className="relative h-full flex items-center justify-center">
          {cards.map((card, index) => (
            <motion.div
              key={card.id || index}
              className="absolute rounded-2xl shadow-xl cursor-pointer"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={getCardStyle(index)}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 1
              }}
              onClick={() => goToIndex(index)}
              style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                transformStyle: 'preserve-3d',
              }}
              whileHover={{ scale: index === activeIndex ? 1.02 : undefined }}
              role="button"
              tabIndex={index === activeIndex ? 0 : -1}
              aria-label={`Card ${index + 1}: ${card.title}`}
              aria-current={index === activeIndex ? "true" : "false"}
            >
              {renderCardLayers(card, index)}
            </motion.div>
          ))}
        </div>
        
        {/* Navigation Controls */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 py-6 z-20">
          <button
            className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors duration-300 text-white"
            onClick={goToPrev}
            aria-label="Previous card"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            {cards.map((_, index) => (
              <button
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  activeIndex === index 
                    ? 'bg-white w-6' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                onClick={() => goToIndex(index)}
                aria-label={`Go to card ${index + 1}`}
                aria-current={activeIndex === index ? "true" : "false"}
              />
            ))}
          </div>
          
          <button
            className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors duration-300 text-white"
            onClick={goToNext}
            aria-label="Next card"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button
            className={`p-3 rounded-full backdrop-blur-md transition-colors duration-300 text-white ${
              isAutoPlaying ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'
            }`}
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            aria-label={isAutoPlaying ? "Pause autoplay" : "Start autoplay"}
            title={isAutoPlaying ? "Pause" : "Play"}
          >
            {isAutoPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParallaxCardCarousel;
