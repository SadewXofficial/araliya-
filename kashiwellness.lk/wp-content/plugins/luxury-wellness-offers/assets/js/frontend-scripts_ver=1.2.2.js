/**
 * Luxury Wellness Offers - Frontend Scripts
 * Enhanced user interactions for offer display
 */

(function($) {
    'use strict';
    
    const LWO_Frontend = {
        
        // Initialize
        init: function() {
            this.bindEvents();
            this.initAnimations();
            this.trackOfferViews();
        },
        
        // Bind all event handlers
        bindEvents: function() {
            // Terms & Conditions toggle
            $('.lwo-terms-toggle').on('click', this.toggleTerms);
            
            // Track booking button clicks
            $('.lwo-book-btn').on('click', this.trackBooking);
            
            // Smooth scroll to offers
            this.initSmoothScroll();
        },
        
        // Track offer views
        trackOfferViews: function() {
            $('.lwo-offer-item').each(function() {
                const $offer = $(this);
                const offerId = $offer.data('offer-id');
                
                if (offerId && 'IntersectionObserver' in window) {
                    const observer = new IntersectionObserver(function(entries) {
                        entries.forEach(function(entry) {
                            if (entry.isIntersecting) {
                                // Track view
                                LWO_Frontend.trackEvent(offerId, 'view');
                                observer.unobserve(entry.target);
                            }
                        });
                    }, { threshold: 0.5 });
                    
                    observer.observe($offer[0]);
                }
            });
        },
        
        // Track events (view/click)
        trackEvent: function(offerId, eventType) {
            if (typeof lwoFrontend !== 'undefined') {
                $.ajax({
                    url: lwoFrontend.ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'lwo_track_event',
                        offer_id: offerId,
                        event_type: eventType
                    }
                });
            }
        },
        
        // Toggle terms and conditions
        toggleTerms: function(e) {
            e.preventDefault();
            const $toggle = $(this);
            const $content = $toggle.siblings('.lwo-terms-content');
            
            $toggle.toggleClass('active');
            $content.toggleClass('active');
            
            // Smooth animation with proper height calculation
            if ($content.hasClass('active')) {
                // Set to scrollHeight to show all content
                const height = $content[0].scrollHeight;
                // Use a high max-height instead of exact height for smoother animation
                $content.css('max-height', Math.min(height + 50, 800) + 'px');
            } else {
                $content.css('max-height', '0');
            }
        },
        
        // Track booking button clicks
        trackBooking: function(e) {
            const $btn = $(this);
            const $offer = $btn.closest('.lwo-offer-item');
            const offerId = $offer.data('offer-id');
            const offerTitle = $offer.find('.lwo-offer-title').text();
            const bookingUrl = $btn.attr('href');
            
            // Track click event
            if (offerId) {
                LWO_Frontend.trackEvent(offerId, 'click');
            }
            
            // Add animation feedback
            $btn.addClass('lwo-booking-clicked');
            
            setTimeout(() => {
                $btn.removeClass('lwo-booking-clicked');
            }, 600);
            
            // You can add analytics tracking here
            console.log('Booking clicked:', offerTitle, bookingUrl);
        },
        
        // Initialize scroll animations
        initAnimations: function() {
            // Intersection Observer for scroll animations
            if ('IntersectionObserver' in window) {
                const observerOptions = {
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px'
                };
                
                const observer = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('lwo-in-view');
                            observer.unobserve(entry.target);
                        }
                    });
                }, observerOptions);
                
                // Observe all offer items
                $('.lwo-offer-item').each(function() {
                    observer.observe(this);
                });
            }
        },
        
        // Initialize smooth scroll
        initSmoothScroll: function() {
            $('a[href^="#"]').on('click', function(e) {
                const target = $(this.getAttribute('href'));
                
                if (target.length) {
                    e.preventDefault();
                    $('html, body').stop().animate({
                        scrollTop: target.offset().top - 100
                    }, 800, 'swing');
                }
            });
        },
        
        // Track offer views (for analytics)
        trackOfferViews: function() {
            // Simple view tracking
            $('.lwo-offer-item').each(function(index) {
                const $offer = $(this);
                const offerTitle = $offer.find('.lwo-offer-title').text();
                
                // Log when offer comes into view
                if ('IntersectionObserver' in window) {
                    const viewObserver = new IntersectionObserver(function(entries) {
                        entries.forEach(function(entry) {
                            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                                console.log('Offer viewed:', offerTitle);
                                viewObserver.unobserve(entry.target);
                            }
                        });
                    }, {
                        threshold: 0.5
                    });
                    
                    viewObserver.observe($offer[0]);
                }
            });
        },
        
        // Add parallax effect to images (optional enhancement)
        initParallax: function() {
            if ($(window).width() > 768) {
                $(window).on('scroll', function() {
                    const scrolled = $(window).scrollTop();
                    
                    $('.lwo-offer-image').each(function() {
                        const $img = $(this);
                        const offsetTop = $img.offset().top;
                        const speed = 0.3;
                        
                        if (offsetTop < scrolled + $(window).height()) {
                            const yPos = -(scrolled - offsetTop) * speed;
                            $img.css('transform', 'translateY(' + yPos + 'px)');
                        }
                    });
                });
            }
        },
        
        // Format dates for better readability
        formatDates: function() {
            $('.lwo-detail-value').each(function() {
                const dateText = $(this).text().trim();
                
                // Check if it looks like a date range
                if (dateText.includes('-') && dateText.match(/\d{4}/)) {
                    // Already formatted, leave as is
                    return;
                }
            });
        },
        
        // Add urgency indicators
        highlightUrgency: function() {
            $('.lwo-urgency-text').each(function() {
                const $text = $(this);
                const daysText = $text.text();
                const days = parseInt(daysText);
                
                if (days <= 3) {
                    $text.closest('.lwo-detail-item').addClass('lwo-high-urgency');
                } else if (days <= 7) {
                    $text.closest('.lwo-detail-item').addClass('lwo-medium-urgency');
                }
            });
        }
    };
    
    // Initialize when document is ready
    $(document).ready(function() {
        LWO_Frontend.init();
        LWO_Frontend.highlightUrgency();
    });
    
    // Handle window resize
    $(window).on('resize', $.debounce(250, function() {
        // Recalculate any responsive elements if needed
    }));
    
    // jQuery debounce function
    $.debounce = function(wait, func) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    };
    
})(jQuery);

// Add custom styles for animations and interactions
jQuery(document).ready(function($) {
    if (!$('#lwo-frontend-enhancements').length) {
        $('head').append(`
            <style id="lwo-frontend-enhancements">
                /* Booking button click animation */
                .lwo-book-btn.lwo-booking-clicked {
                    transform: scale(0.95);
                    transition: transform 0.2s ease;
                }
                
                /* High urgency styling */
                .lwo-detail-item.lwo-high-urgency {
                    animation: lwoPulse 2s ease-in-out infinite;
                }
                
                @keyframes lwoPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.85; }
                }
                
                /* In-view animation enhancement */
                .lwo-offer-item.lwo-in-view {
                    animation: lwoEnhancedSlideIn 0.6s ease forwards;
                }
                
                @keyframes lwoEnhancedSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(30px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                /* Smooth transitions for all interactive elements */
                .lwo-offer-item * {
                    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                /* Loading state for images */
                .lwo-offer-image {
                    background: linear-gradient(
                        90deg,
                        #f0f0f0 25%,
                        #e0e0e0 50%,
                        #f0f0f0 75%
                    );
                    background-size: 200% 100%;
                }
                
                .lwo-offer-image img {
                    opacity: 0;
                    transition: opacity 0.4s ease;
                }
                
                .lwo-offer-image img.loaded {
                    opacity: 1;
                }
                
                /* Print optimization */
                @media print {
                    .lwo-offer-item {
                        page-break-inside: avoid;
                        box-shadow: none !important;
                        border: 1px solid #ddd !important;
                    }
                    
                    .lwo-book-btn {
                        background: transparent !important;
                        color: #2c5f4f !important;
                        border: 2px solid #2c5f4f !important;
                    }
                }
            </style>
        `);
    }
    
    // Image lazy loading enhancement
    $('.lwo-offer-image img').on('load', function() {
        $(this).addClass('loaded');
    });
    
    // Add accessibility improvements
    $('.lwo-book-btn').attr('aria-label', function() {
        const offerTitle = $(this).closest('.lwo-offer-item').find('.lwo-offer-title').text();
        return 'Book ' + offerTitle;
    });
    
    $('.lwo-terms-toggle').attr('aria-expanded', 'false').on('click', function() {
        const isExpanded = $(this).hasClass('active');
        $(this).attr('aria-expanded', isExpanded);
    });
});
