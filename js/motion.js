/**
 * SKETCHOID Advanced 3D Motion & Transition Engine
 * Powered by GSAP, Lenis, Anime.js, Rough.js, and Dynamic SVG Filter Displacement.
 */

class MotionEngine {
    constructor() {
        this.initLenis();
        this.initSVGFilters();
        this.init3DCardInteractions();
    }

    /**
     * 1. Initialize Lenis Smooth Scrolling for Grid Modals
     */
    initLenis() {
        if (typeof Lenis !== 'undefined') {
            try {
                this.lenis = new Lenis({
                    duration: 0.9,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                    smoothWheel: true,
                    wheelMultiplier: 0.85,
                    touchMultiplier: 1.5
                });

                const raf = (time) => {
                    this.lenis?.raf(time);
                    requestAnimationFrame(raf);
                };
                requestAnimationFrame(raf);
            } catch (e) {
                console.warn('Lenis initialized with fallback', e);
            }
        }
    }

    /**
     * 2. Dynamic SVG Filter Displacement Modulation (Living Ink Effect)
     */
    initSVGFilters() {
        const turb = document.getElementById('ink-turb');
        if (!turb) return;

        let seed = 1;
        setInterval(() => {
            seed = (seed + 1) % 100;
            turb.setAttribute('seed', seed);
        }, 120);
    }

    /**
     * 3. Attach 3D Mouse Gyro Parallax / Tilt to Cards
     */
    attach3DTilt(card, maxTilt = 8) {
        if (!card) return;
        card.style.transformStyle = 'preserve-3d';
        card.style.transition = 'transform 0.12s ease-out, box-shadow 0.2s ease';

        const handleMouseMove = (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;

            const rotX = ((y - cy) / cy) * -maxTilt;
            const rotY = ((x - cx) / cx) * maxTilt;

            if (typeof gsap !== 'undefined') {
                gsap.to(card, {
                    rotateX: rotX,
                    rotateY: rotY,
                    transformPerspective: 900,
                    translateZ: 10,
                    duration: 0.25,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
            } else {
                card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(10px)`;
            }
        };

        const handleMouseLeave = () => {
            if (typeof gsap !== 'undefined') {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    translateZ: 0,
                    duration: 0.45,
                    ease: 'elastic.out(1, 0.6)',
                    overwrite: 'auto'
                });
            } else {
                card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
            }
        };

        card.addEventListener('mousemove', handleMouseMove);
        card.addEventListener('mouseleave', handleMouseLeave);
    }

    init3DCardInteractions() {
        document.querySelectorAll('.collection-card, .modal-card, .hud-item').forEach(el => {
            this.attach3DTilt(el, 6);
        });
    }

    /**
     * 4. GSAP 3D Staggered Modal Open Transition
     */
    openModal(modalOverlay, modalContent) {
        if (!modalOverlay || !modalContent) return;
        modalOverlay.classList.remove('hidden');

        if (typeof gsap !== 'undefined') {
            gsap.killTweensOf([modalOverlay, modalContent]);
            gsap.set(modalOverlay, { opacity: 0 });
            gsap.set(modalContent, {
                opacity: 0,
                scale: 0.86,
                rotateX: 16,
                rotateY: -4,
                transformPerspective: 1000,
                y: 30
            });

            const tl = gsap.timeline();
            tl.to(modalOverlay, { opacity: 1, duration: 0.25, ease: 'power2.out' })
              .to(modalContent, {
                  opacity: 1,
                  scale: 1,
                  rotateX: 0,
                  rotateY: 0,
                  y: 0,
                  duration: 0.65,
                  ease: 'elastic.out(1, 0.75)'
              }, '-=0.15');

            // Stagger animate child pills/buttons
            const children = modalContent.querySelectorAll('.feature-pill, .modal-stat-box, .btn-sketch, .collection-card');
            if (children.length > 0) {
                gsap.fromTo(children, 
                    { opacity: 0, y: 15, scale: 0.95 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.04, ease: 'back.out(1.5)', delay: 0.1 }
                );
            }
        } else if (typeof anime !== 'undefined') {
            anime.remove(modalContent);
            anime({
                targets: modalContent,
                opacity: [0, 1],
                scale: [0.9, 1],
                translateY: [25, 0],
                duration: 500,
                easing: 'easeOutElastic(1, 0.7)'
            });
        }
    }

    /**
     * 5. GSAP 3D Modal Close Transition
     */
    closeModal(modalOverlay, modalContent, onComplete) {
        if (!modalOverlay || !modalContent) return;

        if (typeof gsap !== 'undefined') {
            gsap.killTweensOf([modalOverlay, modalContent]);
            const tl = gsap.timeline({
                onComplete: () => {
                    modalOverlay.classList.add('hidden');
                    if (onComplete) onComplete();
                }
            });

            tl.to(modalContent, {
                opacity: 0,
                scale: 0.92,
                rotateX: -10,
                y: -15,
                duration: 0.22,
                ease: 'power2.in'
            })
            .to(modalOverlay, { opacity: 0, duration: 0.15, ease: 'power2.in' }, '-=0.08');
        } else {
            modalOverlay.classList.add('hidden');
            if (onComplete) onComplete();
        }
    }

    /**
     * 6. GSAP Live Number Rolling Tally Animation
     */
    animateNumberRoll(elem, targetVal, prefix = '', suffix = '') {
        if (!elem) return;
        const currentVal = parseInt(elem.innerText.replace(/[^0-9]/g, ''), 10) || 0;

        if (typeof gsap !== 'undefined') {
            const obj = { val: currentVal };
            gsap.to(obj, {
                val: targetVal,
                duration: 1.1,
                ease: 'power2.out',
                onUpdate: () => {
                    elem.innerText = `${prefix}${Math.round(obj.val).toLocaleString()}${suffix}`;
                }
            });
        } else {
            elem.innerText = `${prefix}${targetVal.toLocaleString()}${suffix}`;
        }
    }

    /**
     * 7. Staggered 3D Wave Transition for Tab Items
     */
    animateGridStagger(gridContainer) {
        if (!gridContainer) return;
        const cards = gridContainer.querySelectorAll('.collection-card');
        if (cards.length === 0) return;

        cards.forEach(c => this.attach3DTilt(c, 7));

        if (typeof gsap !== 'undefined') {
            gsap.fromTo(cards, 
                { opacity: 0, y: 20, rotateX: 20, scale: 0.92 },
                { opacity: 1, y: 0, rotateX: 0, scale: 1, duration: 0.45, stagger: 0.035, ease: 'back.out(1.4)' }
            );
        } else if (typeof anime !== 'undefined') {
            anime({
                targets: cards,
                opacity: [0, 1],
                translateY: [20, 0],
                delay: anime.stagger(35),
                duration: 400,
                easing: 'easeOutQuad'
            });
        }
    }
}

window.motionEngine = new MotionEngine();
