document.addEventListener('DOMContentLoaded', function() {
    // Loading Screen
    class LoadingScreen {
        constructor() {
            this.mainContent = document.querySelector('main');
            this.loadingScreen = document.querySelector('.loading-screen');
            this.initialized = false;

            this.mainContent.style.display = 'none';
            setTimeout(() => this.hideLoadingScreen(), 2000);
        }

        hideLoadingScreen() {
            if (this.initialized) return;
            this.initialized = true;

            this.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                this.mainContent.style.display = 'block';
                this.mainContent.style.opacity = '1';
                document.body.style.overflow = 'visible';
                this.initializeSite();
            }, 500);
        }

        initializeSite() {
            new SiteController();
        }
    }

    // Main Site Controller
    class SiteController {
        constructor() {
            this.initializePortfolio();
            this.initializeTestimonials();
            this.initializeHeader();
            this.initializeScrolling();
            if (typeof AOS !== 'undefined') {
                AOS.init({
                    duration: 800, // Slightly reduced for better performance
                    once: true,
                    offset: 50
                });
            }
        }

        initializeHeader() {
            const header = document.querySelector('header');
            if (header) {
                // Use requestAnimationFrame for better scroll performance
                let lastScrollY = 0;
                let ticking = false;
                
                window.addEventListener('scroll', () => {
                    lastScrollY = window.scrollY;
                    
                    if (!ticking) {
                        window.requestAnimationFrame(() => {
                            header.classList.toggle('scrolled', lastScrollY > 50);
                            ticking = false;
                        });
                        ticking = true;
                    }
                }, { passive: true });
            }
        }

        initializeScrolling() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = document.querySelector(anchor.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        }

        initializePortfolio() {
            new PortfolioSlider();
        }

        initializeTestimonials() {
            new TestimonialSlider();
        }
    }

    // Portfolio Slider
    class PortfolioSlider {
        constructor() {
            this.container = document.querySelector('.portfolio-showcase');
            this.track = this.container?.querySelector('.portfolio-track');
            this.items = Array.from(this.track?.querySelectorAll('.portfolio-item') || []);
            this.prevBtn = this.container?.querySelector('.prev-btn');
            this.nextBtn = this.container?.querySelector('.next-btn');
            this.progressBar = this.container?.querySelector('.slider-progress-bar');
            
            if (!this.track || !this.items.length) return;
            
            this.currentIndex = 0;
            this.itemWidth = 0;
            this.isAnimating = false;
            this.isDragging = false;
            this.startPos = 0;
            this.currentTranslate = 0;
            this.previousTranslate = 0;
            this.isMobile = window.innerWidth < 768;
            
            // Add hardware acceleration
            if (this.track) {
                this.track.style.willChange = 'transform';
                this.track.style.transform = 'translate3d(0,0,0)';
            }
            
            this.init();
        }

        init() {
            this.calculateDimensions();
            this.setupInfiniteLoop();
            this.bindEvents();
            this.updateSlider(true);
        }

        calculateDimensions() {
            const containerWidth = this.container.offsetWidth;
            this.itemWidth = this.isMobile ? 
                Math.min(containerWidth * 0.85, 400) : 
                400;
            
            this.items.forEach(item => {
                item.style.width = `${this.itemWidth}px`;
            });

            // Center first slide
            if (this.isMobile) {
                const offset = (containerWidth - this.itemWidth) / 2;
                this.track.style.paddingLeft = `${offset}px`;
                this.track.style.paddingRight = `${offset}px`;
            }
        }

        setupInfiniteLoop() {
            const firstClone = this.items[0].cloneNode(true);
            const lastClone = this.items[this.items.length - 1].cloneNode(true);
            const secondClone = this.items[1]?.cloneNode(true);
            const secondLastClone = this.items[this.items.length - 2]?.cloneNode(true);

            [firstClone, lastClone, secondClone, secondLastClone].forEach(clone => {
                if (clone) {
                    clone.setAttribute('aria-hidden', 'true');
                    clone.classList.add('clone');
                }
            });

            this.track.appendChild(firstClone);
            secondClone && this.track.appendChild(secondClone);
            this.track.insertBefore(lastClone, this.items[0]);
            secondLastClone && this.track.insertBefore(secondLastClone, this.items[0]);

            this.items = Array.from(this.track.querySelectorAll('.portfolio-item'));
            this.currentIndex = 2;
        }

        updateSlider(immediate = false) {
            const gap = this.isMobile ? 20 : 40;
            const offset = -this.currentIndex * (this.itemWidth + gap);
            
            this.track.style.transition = immediate ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)';
            this.track.style.transform = `translate3d(${offset}px, 0, 0)`;
            
            this.items.forEach((item, index) => {
                item.classList.toggle('active', index === this.currentIndex);
            });
            
            this.updateProgress();
        }

        updateProgress() {
            if (!this.progressBar) return;
            const total = this.items.length - 4;
            const current = this.currentIndex - 2;
            const progress = (current / total) * 100;
            this.progressBar.style.width = `${progress}%`;
        }

        slide(direction) {
            if (this.isAnimating) return;
            this.isAnimating = true;

            this.currentIndex += direction === 'next' ? 1 : -1;
            this.updateSlider();

            this.track.addEventListener('transitionend', () => {
                this.isAnimating = false;
                
                if (this.currentIndex <= 1) {
                    this.currentIndex = this.items.length - 4;
                    this.updateSlider(true);
                } else if (this.currentIndex >= this.items.length - 2) {
                    this.currentIndex = 2;
                    this.updateSlider(true);
                }
            }, { once: true });
        }

        bindEvents() {
            // Button Controls
            this.prevBtn?.addEventListener('click', (e) => {
                e.preventDefault();
                this.slide('prev');
            });

            this.nextBtn?.addEventListener('click', (e) => {
                e.preventDefault();
                this.slide('next');
            });

            // Touch Events
            let startX = 0;
            let isDragging = false;

            const handleStart = (e) => {
                startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
                isDragging = true;
                this.track.style.cursor = 'grabbing';
            };

            const handleMove = (e) => {
                if (!isDragging) return;
                e.preventDefault();
                
                const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
                const diff = currentX - startX;
                
                if (Math.abs(diff) > 50) {
                    this.slide(diff > 0 ? 'prev' : 'next');
                    isDragging = false;
                    this.track.style.cursor = '';
                }
            };

            const handleEnd = () => {
                isDragging = false;
                this.track.style.cursor = '';
            };

            this.track.addEventListener('touchstart', handleStart, { passive: true });
            this.track.addEventListener('touchmove', handleMove, { passive: false });
            this.track.addEventListener('touchend', handleEnd);
            
            if (!this.isMobile) {
                this.track.addEventListener('mousedown', handleStart);
                window.addEventListener('mousemove', handleMove);
                window.addEventListener('mouseup', handleEnd);
            }

            // Resize Handler with debounce for performance
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.isMobile = window.innerWidth < 768;
                    this.calculateDimensions();
                    this.updateSlider(true);
                }, 250);
            }, { passive: true });
        }
    }

    // Testimonial Slider (first implementation)
    class TestimonialSlider {
        constructor() {
            this.slider = document.querySelector('.testimonial-slider');
            this.track = document.querySelector('.testimonial-track');
            this.cards = Array.from(document.querySelectorAll('.testimonial-card'));
            this.prevBtn = document.querySelector('.nav-button.prev');
            this.nextBtn = document.querySelector('.nav-button.next');
            this.dots = document.querySelector('.testimonial-dots');

            if (!this.slider || !this.cards.length) return;

            this.currentIndex = 0;
            this.isAnimating = false;

            this.init();
        }

        init() {
            this.createDots();
            this.updateActiveStates();
            this.bindEvents();
            this.startAutoplay();
        }

        createDots() {
            if (!this.dots) return;

            this.cards.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = `dot ${index === 0 ? 'active' : ''}`;
                dot.addEventListener('click', () => this.goToSlide(index));
                this.dots.appendChild(dot);
            });
        }

        updateActiveStates() {
            this.cards.forEach((card, index) => {
                const isActive = index === this.currentIndex;
                card.classList.toggle('active', isActive);
                card.setAttribute('aria-hidden', !isActive);
            });

            if (this.dots) {
                this.dots.querySelectorAll('.dot').forEach((dot, index) => {
                    dot.classList.toggle('active', index === this.currentIndex);
                });
            }
        }

        bindEvents() {
            this.prevBtn?.addEventListener('click', () => this.slide('prev'));
            this.nextBtn?.addEventListener('click', () => this.slide('next'));

            // Touch support
            let touchStartX = 0;
            this.slider.addEventListener('touchstart', e => {
                touchStartX = e.touches[0].clientX;
                this.stopAutoplay();
            }, { passive: true });

            this.slider.addEventListener('touchend', e => {
                const touchEndX = e.changedTouches[0].clientX;
                const diff = touchStartX - touchEndX;

                if (Math.abs(diff) > 50) {
                    this.slide(diff > 0 ? 'next' : 'prev');
                }
                this.startAutoplay();
            }, { passive: true });

            this.slider.addEventListener('mouseenter', () => this.stopAutoplay());
            this.slider.addEventListener('mouseleave', () => this.startAutoplay());
        }

        slide(direction) {
            if (this.isAnimating) return;
            this.isAnimating = true;

            const nextIndex = direction === 'next'
                ? (this.currentIndex + 1) % this.cards.length
                : (this.currentIndex - 1 + this.cards.length) % this.cards.length;

            this.goToSlide(nextIndex);
        }

        goToSlide(index) {
            if (this.isAnimating || index === this.currentIndex) return;
            this.isAnimating = true;

            const currentSlide = this.cards[this.currentIndex];
            const nextSlide = this.cards[index];
            const direction = index > this.currentIndex ? 'next' : 'prev';

            currentSlide.classList.add(direction === 'next' ? 'slide-out-left' : 'slide-out-right');
            nextSlide.classList.add(direction === 'next' ? 'slide-in-right' : 'slide-in-left');

            setTimeout(() => {
                this.currentIndex = index;
                this.updateActiveStates();
                this.isAnimating = false;

                currentSlide.classList.remove('slide-out-left', 'slide-out-right');
                nextSlide.classList.remove('slide-in-right', 'slide-in-left');
            }, 500);
        }

        startAutoplay(interval = 5000) {
            this.stopAutoplay();
            this.autoplayInterval = setInterval(() => {
                if (!document.hidden && !this.isAnimating) {
                    this.slide('next');
                }
            }, interval);
        }

        stopAutoplay() {
            if (this.autoplayInterval) {
                clearInterval(this.autoplayInterval);
                this.autoplayInterval = null;
            }
        }
    }

    // Initialize everything
    try {
        new LoadingScreen();
    } catch (error) {
        console.error('Error initializing site:', error);
        new SiteController();
    }

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        const sliders = [
            document.querySelector('.portfolio-slider'),
            document.querySelector('.testimonial-slider')
        ];

        sliders.forEach(slider => {
            if (slider?.sliderInstance) {
                if (document.hidden) {
                    slider.sliderInstance.stopAutoplay();
                } else {
                    slider.sliderInstance.startAutoplay();
                }
            }
        });
    });

    // Add passive scroll event for improved performance
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        // Use passive event for better scrolling performance
    }, { passive: true });

    // Handle page load
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });
});

// Second Testimonial Slider implementation
document.addEventListener('DOMContentLoaded', function() {
    class TestimonialSlider {
        constructor() {
            this.slider = document.querySelector('.testimonial-slider');
            this.track = document.querySelector('.testimonial-track');
            this.slides = Array.from(document.querySelectorAll('.testimonial-card'));
            this.prevBtn = document.querySelector('.nav-button.prev');
            this.nextBtn = document.querySelector('.nav-button.next');
            this.dots = document.querySelector('.testimonial-dots');
            
            if (!this.slider || !this.slides.length) return;
            
            this.currentSlide = 0;
            this.isAnimating = false;
            this.autoplayInterval = null;
            
            this.init();
        }

        init() {
            // Reset all slides initially
            this.slides.forEach((slide, index) => {
                slide.style.opacity = '0';
                slide.style.visibility = 'hidden';
                if (index === 0) {
                    slide.style.opacity = '1';
                    slide.style.visibility = 'visible';
                }
            });

            // Create dots
            this.createDots();
            
            // Add event listeners
            this.prevBtn?.addEventListener('click', () => this.prevSlide());
            this.nextBtn?.addEventListener('click', () => this.nextSlide());
            
            // Start autoplay
            this.startAutoplay();

            // Touch events
            let touchStartX = 0;
            this.slider.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                this.stopAutoplay();
            }, { passive: true });

            this.slider.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].clientX;
                const diff = touchStartX - touchEndX;
                
                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        this.nextSlide();
                    } else {
                        this.prevSlide();
                    }
                }
                this.startAutoplay();
            }, { passive: true });

            // Mouse hover
            this.slider.addEventListener('mouseenter', () => this.stopAutoplay());
            this.slider.addEventListener('mouseleave', () => this.startAutoplay());
        }

        createDots() {
            if (!this.dots) return;
            this.dots.innerHTML = '';
            
            this.slides.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = `dot${index === 0 ? ' active' : ''}`;
                dot.setAttribute('aria-label', `Slide ${index + 1}`);
                dot.addEventListener('click', () => this.goToSlide(index));
                this.dots.appendChild(dot);
            });
        }

        updateDots() {
            if (!this.dots) return;
            const dots = this.dots.querySelectorAll('.dot');
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === this.currentSlide);
            });
        }

        goToSlide(index, direction = null) {
            if (this.isAnimating || index === this.currentSlide) return;
            
            this.isAnimating = true;
            const currentSlide = this.slides[this.currentSlide];
            const nextSlide = this.slides[index];
            
            // Determine direction if not specified
            if (!direction) {
                direction = index > this.currentSlide ? 'next' : 'prev';
            }

            // Set initial positions
            currentSlide.style.transition = 'none';
            nextSlide.style.transition = 'none';
            nextSlide.style.visibility = 'visible';
            nextSlide.style.opacity = '0';
            
            requestAnimationFrame(() => {
                currentSlide.style.transition = 'all 0.5s ease-in-out';
                nextSlide.style.transition = 'all 0.5s ease-in-out';
                
                // Animate out current slide
                currentSlide.style.opacity = '0';
                currentSlide.style.transform = `translateX(${direction === 'next' ? '-100px' : '100px'})`;
                
                // Animate in next slide
                nextSlide.style.opacity = '1';
                nextSlide.style.transform = 'translateX(0)';
                
                setTimeout(() => {
                    currentSlide.style.visibility = 'hidden';
                    currentSlide.style.transform = 'translateX(0)';
                    this.currentSlide = index;
                    this.isAnimating = false;
                    this.updateDots();
                }, 500);
            });
        }

        nextSlide() {
            const nextIndex = (this.currentSlide + 1) % this.slides.length;
            this.goToSlide(nextIndex, 'next');
        }

        prevSlide() {
            const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
            this.goToSlide(prevIndex, 'prev');
        }

        startAutoplay(interval = 5000) {
            this.stopAutoplay();
            this.autoplayInterval = setInterval(() => {
                if (!document.hidden && !this.isAnimating) {
                    this.nextSlide();
                }
            }, interval);
        }

        stopAutoplay() {
            if (this.autoplayInterval) {
                clearInterval(this.autoplayInterval);
                this.autoplayInterval = null;
            }
        }
    }

    // Initialize the slider
    new TestimonialSlider();
});