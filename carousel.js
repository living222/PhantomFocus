class Carousel3D {
    constructor(container, centerOffset = 2) {
        // Grab elements relative to this container
        this.container = container;
        this.stage = container.querySelector('.carousel-stage');
        this.images = container.querySelectorAll('.carousel-image');
        this.prevBtn = container.querySelector('.nav-btn[id^="prevBtn"]');
        this.nextBtn = container.querySelector('.nav-btn[id^="nextBtn"]');
        this.indicatorBox = container.querySelector('.carousel-indicators');
        this.currentIndex = centerOffset;
        this.totalImages = this.images.length;
        this.isAnimating = false;
        this.centerOffset = centerOffset; // 0 far-left â€¦ 4 far-right
        
        // Position classes for 3D transforms optimized for 16:9 landscape
        this.positions = [
            'position-far-left',
            'position-left',
            'position-center',
            'position-right',
            'position-far-right'
        ];
        
        this.init();
    }
    
    init() {
        this.setupInitialPositions();
        this.bindEvents();
        this.setupTouchSupport();
        this.setupAutoplay();
    }
    
    setupInitialPositions() {
        // Clear existing indicators first
        this.indicatorBox.innerHTML = '';
        
        this.images.forEach((image, index) => {
            // Remove all position classes first
            this.positions.forEach(pos => image.classList.remove(pos));
            
            // Calculate positionIndex relative to desired centre
           const relativeIndex = (index - this.currentIndex + 5) % 5;
           image.classList.add(this.positions[relativeIndex]);
            image.setAttribute('data-position', relativeIndex);
            // Create indicator dots
            const dot = document.createElement('div');
            dot.className = 'indicator' + (index === 0 ? ' active' : '');
            dot.setAttribute('data-index', index);
            this.indicatorBox.appendChild(dot);
        });
        
        // Update indicators reference after creating them
        this.indicators = this.indicatorBox.querySelectorAll('.indicator');
    }
    
    bindEvents() {
        // Navigation button events
        this.prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.rotate('left');
        });
        
        this.nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.rotate('right');
        });
        
        // Indicator clicks
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Image clicks for navigation
        this.images.forEach((image, index) => {
            image.addEventListener('click', (e) => {
                e.preventDefault();
                const currentPosition = parseInt(image.getAttribute('data-position'));
                
                // If clicking on side images, navigate to center them
                if (currentPosition === 1) { // left position
                    this.rotate('left');
                } else if (currentPosition === 3) { // right position
                    this.rotate('right');
                }
                // Center image doesn't need click handling
            });
        });
        
        // Keyboard navigation (only for the first carousel to avoid conflicts)
        if (this.container.id === 'carousel-1') {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.rotate('left');
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.rotate('right');
                }
            });
        }
    }
    setupTouchSupport() {
    let startX = 0, startY = 0, isDragging = false;
    const threshold = 50;

    // Helper to decide swipe direction
    const handleSwipe = (endX, endY) => {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
            if (deltaX > 0) this.rotate('left');
            else this.rotate('right');
        }
    };

    // TOUCH EVENTS
    this.stage.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches.clientY;
    });
    this.stage.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        handleSwipe(e.changedTouches[0].clientX, e.changedTouches.clientY);
    });
    // Optional: prevent scrolling while swiping
    this.stage.addEventListener('touchmove', (e) => e.preventDefault());

    // MOUSE EVENTS
    this.stage.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        e.preventDefault();  // prevent default image dragging
    });
    this.stage.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        handleSwipe(e.clientX, e.clientY);
    });
    // Optional: track movement so dragging outside still counts
    this.stage.addEventListener('mouseleave', () => { isDragging = false; });
}

    setupAutoplay() {
        this.autoplayInterval = setInterval(() => {
            if (!this.isAnimating && !document.hidden) {
                this.rotate('right');
            }
        }, 4000); // Auto-advance every 4 seconds
        
        // Pause autoplay when page is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearInterval(this.autoplayInterval);
            } else {
                this.setupAutoplay();
            }
        });
        
        // Pause autoplay on hover for this specific carousel
        this.container.addEventListener('mouseenter', () => {
            clearInterval(this.autoplayInterval);
        });
        
        this.container.addEventListener('mouseleave', () => {
            this.setupAutoplay();
        });
    }
    
    rotate(direction) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        // Update current index
        if (direction === 'right') {
            this.currentIndex = (this.currentIndex + 1) % this.totalImages;
        } else {
            this.currentIndex = (this.currentIndex - 1 + this.totalImages) % this.totalImages;
        }
        
        // Rotate position classes
        this.images.forEach((image) => {
            let currentPos = parseInt(image.getAttribute('data-position'));
            let newPos;
            
            if (direction === 'right') {
                newPos = (currentPos - 1 + this.positions.length) % this.positions.length;
            } else {
                newPos = (currentPos + 1) % this.positions.length;
            }
            
            // Remove current position class and add new one
            image.classList.remove(this.positions[currentPos]);
            image.classList.add(this.positions[newPos]);
            image.setAttribute('data-position', newPos);
        });
        
        this.updateIndicators();
        
        // Reset animation flag after transition
        setTimeout(() => {
            this.isAnimating = false;
        }, 700);
    }
    
    goToSlide(targetIndex) {
        if (this.isAnimating || targetIndex === this.currentIndex) return;
        
        const diff = targetIndex - this.currentIndex;
        const steps = Math.abs(diff);
        const direction = diff > 0 ? 'right' : 'left';
        
        // If we need to go more than halfway around, go the other direction
        const actualSteps = steps > this.totalImages / 2 ? 
            this.totalImages - steps : steps;
        const actualDirection = steps > this.totalImages / 2 ? 
            (direction === 'right' ? 'left' : 'right') : direction;
        
        // Rotate step by step
        let currentStep = 0;
        const rotateStep = () => {
            if (currentStep < actualSteps) {
                this.rotate(actualDirection);
                currentStep++;
                setTimeout(rotateStep, 100);
            }
        };
        
        rotateStep();
    }
    
    updateIndicators() {
        this.indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentIndex);
        });
    }
    
    // Method to pause autoplay (can be called externally)
    pauseAutoplay() {
        clearInterval(this.autoplayInterval);
    }
    
    // Method to resume autoplay (can be called externally)
    resumeAutoplay() {
        this.setupAutoplay();
    }
    
    // Method to go to next slide (can be called externally)
    next() {
        this.rotate('right');
    }
    
    // Method to go to previous slide (can be called externally)
    prev() {
        this.rotate('left');
    }
}

// Initialize multiple carousels when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all elements are properly loaded
    setTimeout(() => {
        // Store carousel instances globally for external access
        window.carousels = {};
        
        // Hero Carousel â€“ center (offset 2 = default)
        const carousel1 = document.getElementById('carousel-1');
        if (carousel1) {
            window.carousels.carousel1 = new Carousel3D(carousel1, 2);
        }
        
        // Carousel #2 â€“ main slide starts on the RIGHT (offset 3)
        const carousel2 = document.getElementById('carousel-2');
        if (carousel2) {
            window.carousels.carousel2 = new Carousel3D(carousel2, 3);
        }
        
        // Carousel #3 â€“ main slide starts on the LEFT (offset 1)
        const carousel3 = document.getElementById('carousel-3');
        if (carousel3) {
            window.carousels.carousel3 = new Carousel3D(carousel3, 1);
        }
        
        // Support for single carousel (backwards compatibility)
        const singleCarousel = document.querySelector('.carousel-container:not([id])');
        if (singleCarousel && !carousel1 && !carousel2 && !carousel3) {
            window.carousel3D = new Carousel3D(singleCarousel, 2);
        }
        
    }, 100);
});

// Handle page visibility changes for better performance
document.addEventListener('visibilitychange', () => {
    if (window.carousels) {
        Object.values(window.carousels).forEach(carousel => {
            if (document.hidden) {
                carousel.pauseAutoplay();
            } else {
                carousel.resumeAutoplay();
            }
        });
    }
    
    // Backwards compatibility
    if (window.carousel3D) {
        if (document.hidden) {
            window.carousel3D.pauseAutoplay();
        } else {
            window.carousel3D.resumeAutoplay();
        }
    }
});

// Optional: Add global functions for external control
window.carouselNext = (carouselId = 'carousel1') => {
    if (window.carousels && window.carousels[carouselId]) {
        window.carousels[carouselId].next();
    } else if (window.carousel3D) {
        window.carousel3D.next();
    }
};

window.carouselPrev = (carouselId = 'carousel1') => {
    if (window.carousels && window.carousels[carouselId]) {
        window.carousels[carouselId].prev();
    } else if (window.carousel3D) {
        window.carousel3D.prev();
    }
};

window.carouselGoTo = (index, carouselId = 'carousel1') => {
    if (window.carousels && window.carousels[carouselId]) {
        window.carousels[carouselId].goToSlide(index);
    } else if (window.carousel3D) {
        window.carousel3D.goToSlide(index);
    }
};