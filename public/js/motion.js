/**
 * SKETCHOID Motion & Transition Engine
 * Clean, tactile, high-performance UI transitions powered by GSAP, Anime.js, and SVG Filters.
 */

class MotionEngine {
    constructor() {
        this.initSVGFilters();
    }

    /**
     * 1. Dynamic SVG Filter Displacement Modulation (Living Ink Effect)
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
     * 2. GSAP Modal Open Transition
     */
    openModal(modalOverlay, modalContent) {
        if (!modalOverlay || !modalContent) return;
        modalOverlay.classList.remove('hidden');

        if (typeof gsap !== 'undefined') {
            gsap.killTweensOf([modalOverlay, modalContent]);
            gsap.set(modalOverlay, { opacity: 0 });
            gsap.set(modalContent, {
                opacity: 0,
                scale: 0.92,
                y: 15
            });

            const tl = gsap.timeline();
            tl.to(modalOverlay, { opacity: 1, duration: 0.2, ease: 'power2.out' })
              .to(modalContent, {
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  duration: 0.35,
                  ease: 'power2.out'
              }, '-=0.1');

            const children = modalContent.querySelectorAll('.feature-pill, .modal-stat-box, .btn-sketch');
            if (children.length > 0) {
                gsap.fromTo(children, 
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.25, stagger: 0.03, ease: 'power2.out', delay: 0.05 }
                );
            }
        } else if (typeof anime !== 'undefined') {
            anime.remove(modalContent);
            anime({
                targets: modalContent,
                opacity: [0, 1],
                scale: [0.95, 1],
                translateY: [15, 0],
                duration: 300,
                easing: 'easeOutQuad'
            });
        }
    }

    /**
     * 3. GSAP Modal Close Transition
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
                scale: 0.95,
                y: -10,
                duration: 0.18,
                ease: 'power2.in'
            })
            .to(modalOverlay, { opacity: 0, duration: 0.12, ease: 'power2.in' }, '-=0.06');
        } else {
            modalOverlay.classList.add('hidden');
            if (onComplete) onComplete();
        }
    }

    /**
     * 4. GSAP Live Number Rolling Tally Animation
     */
    animateNumberRoll(elem, targetVal, prefix = '', suffix = '') {
        if (!elem) return;
        const currentVal = parseInt(elem.innerText.replace(/[^0-9]/g, ''), 10) || 0;

        if (typeof gsap !== 'undefined') {
            const obj = { val: currentVal };
            gsap.to(obj, {
                val: targetVal,
                duration: 0.8,
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
     * 5. Clean Grid Stagger Transition for Tab Items (Without disruptive 3D Tilt)
     */
    animateGridStagger(gridContainer) {
        if (!gridContainer) return;
        const cards = gridContainer.querySelectorAll('.collection-card');
        if (cards.length === 0) return;

        if (typeof gsap !== 'undefined') {
            gsap.fromTo(cards, 
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.25, stagger: 0.02, ease: 'power2.out' }
            );
        } else if (typeof anime !== 'undefined') {
            anime({
                targets: cards,
                opacity: [0, 1],
                translateY: [12, 0],
                delay: anime.stagger(20),
                duration: 250,
                easing: 'easeOutQuad'
            });
        }
    }
}

window.motionEngine = new MotionEngine();
