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
// Contact Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const contactForms = document.querySelectorAll('form.contact-form');
    
    contactForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form elements
            const nameInput = form.querySelector('input[name="name"]');
            const emailInput = form.querySelector('input[name="email"]');
            const phoneInput = form.querySelector('input[name="phone"]');
            const messageInput = form.querySelector('textarea[name="message"]');
            
            // Validate form
            let isValid = true;
            
            if (!nameInput || !nameInput.value.trim()) {
                markInvalid(nameInput);
                isValid = false;
            } else {
                markValid(nameInput);
            }
            
            if (!emailInput || !isValidEmail(emailInput.value)) {
                markInvalid(emailInput);
                isValid = false;
            } else {
                markValid(emailInput);
            }
            
            if (!phoneInput || !phoneInput.value.trim()) {
                markInvalid(phoneInput);
                isValid = false;
            } else {
                markValid(phoneInput);
            }
            
            if (!messageInput || !messageInput.value.trim()) {
                markInvalid(messageInput);
                isValid = false;
            } else {
                markValid(messageInput);
            }
            
            if (!isValid) {
                return;
            }
            
            // Prepare data for submission
            const formData = {
                name: nameInput ? nameInput.value.trim() : '',
                email: emailInput ? emailInput.value.trim() : '',
                phone: phoneInput ? phoneInput.value.trim() : '',
                message: messageInput ? messageInput.value.trim() : '',
                source: window.location.href,
                timestamp: new Date().toISOString(),
                language: document.documentElement.lang || 'en'
            };
            
            // Disable form during submission
            toggleFormState(form, true);
            
            // Show loading state
            const submitBtn = form.querySelector('.submit-btn');
            const originalBtnText = submitBtn ? submitBtn.textContent : 'Send Message';
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + 
                    (document.documentElement.lang === 'es' ? 'Enviando...' : 'Sending...');
            }
            
            // Submit form
            fetch('https://hook.eu2.make.com/ru1mnhhsxy2dzbavygmhr5th4j3harhx', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                // Don't try to parse as JSON, just return the response
                return response.text();
            })
            .then(data => {
                // Show success message
                showFormMessage(
                    form, 
                    document.documentElement.lang === 'es' 
                        ? '¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.' 
                        : 'Message sent successfully! We\'ll be in touch soon.', 
                    'success'
                );
                
                // Reset form
                form.reset();
                form.classList.add('form-success');
            })
            .catch(error => {
                // Show error message
                showFormMessage(
                    form, 
                    document.documentElement.lang === 'es' 
                        ? 'Ocurrió un error. Por favor, intenta nuevamente.' 
                        : 'An error occurred. Please try again.', 
                    'error'
                );
                console.error('Error:', error);
            })
            .finally(() => {
                // Re-enable form
                toggleFormState(form, false);
                if (submitBtn) {
                    submitBtn.textContent = originalBtnText;
                }
            });
        });
    });
    
    // Helper functions
    function isValidEmail(email) {
        if (!email) return false;
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    
    function markInvalid(element) {
        if (!element) return;
        element.classList.add('invalid');
        const parent = element.parentElement;
        if (parent) parent.classList.add('error');
    }
    
    function markValid(element) {
        if (!element) return;
        element.classList.remove('invalid');
        const parent = element.parentElement;
        if (parent) parent.classList.remove('error');
    }
    
    function toggleFormState(form, isDisabled) {
        if (!form) return;
        const elements = form.querySelectorAll('input, textarea, button');
        elements.forEach(element => {
            if (element) element.disabled = isDisabled;
        });
    }
    
    function showFormMessage(form, message, type) {
        if (!form) return;
        
        // Remove any existing message
        const existingMessages = document.querySelectorAll('.form-message');
        existingMessages.forEach(msg => {
            if (msg) msg.remove();
        });
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `form-message ${type || 'success'}`;
        messageElement.textContent = message;
        
        // Add success icon for better visibility
        if (type === 'success') {
            const icon = document.createElement('i');
            icon.className = 'fas fa-check-circle';
            icon.style.display = 'block';
            icon.style.fontSize = '24px';
            icon.style.marginBottom = '10px';
            messageElement.prepend(icon);
        } else if (type === 'error') {
            const icon = document.createElement('i');
            icon.className = 'fas fa-exclamation-circle';
            icon.style.display = 'block';
            icon.style.fontSize = '24px';
            icon.style.marginBottom = '10px';
            messageElement.prepend(icon);
        }
        
        // Style the message for better visibility
        messageElement.style.padding = '20px';
        messageElement.style.borderRadius = '10px';
        messageElement.style.textAlign = 'center';
        messageElement.style.margin = '20px 0';
        messageElement.style.fontWeight = '600';
        messageElement.style.position = 'relative';
        messageElement.style.animation = 'fadeIn 0.5s ease-in-out';
        
        if (type === 'success') {
            messageElement.style.backgroundColor = 'rgba(39, 174, 96, 0.9)';
            messageElement.style.color = 'white';
            messageElement.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            messageElement.style.boxShadow = '0 10px 30px rgba(39, 174, 96, 0.2)';
        } else {
            messageElement.style.backgroundColor = 'rgba(231, 76, 60, 0.9)';
            messageElement.style.color = 'white';
            messageElement.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            messageElement.style.boxShadow = '0 10px 30px rgba(231, 76, 60, 0.2)';
        }
        
        // Add animation style
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
        
        // Insert after the form
        if (form.parentNode) {
            form.parentNode.insertBefore(messageElement, form.nextSibling);
        } else {
            // Fallback - append to the form itself
            form.appendChild(messageElement);
        }
        
        // Remove message after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.style.opacity = '0';
                messageElement.style.transform = 'translateY(-10px)';
                messageElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        messageElement.remove();
                    }
                }, 500);
            }
        }, 5000);
    }
});