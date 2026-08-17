/**
 * SKETCHOID Mobile-First Input Engine
 * Unified input pipeline for Touch, Mouse Pointer, and Keyboard navigation
 */

class InputManager {
    constructor(canvas, gameWidth, gameHeight) {
        this.canvas = canvas;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;

        this.state = {
            left: false,
            right: false,
            action: false,
            paddleTargetX: gameWidth / 2,
            isUsingTouch: false,
            isUsingMouse: true
        };

        this.onActionTrigger = null;
        this.setupListeners();
    }

    setupListeners() {
        // 1. Pointer & Mouse Movement on Canvas
        const handlePointerMove = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            if (rect.width <= 0) return;
            const scaleX = this.gameWidth / rect.width;
            // Center the paddle under the pointer/finger
            const paddleHalfWidth = (window.game?.paddle?.width || 110) / 2;
            const xInGame = ((clientX - rect.left) * scaleX) - paddleHalfWidth;
            this.state.paddleTargetX = Math.max(8, Math.min(this.gameWidth - (paddleHalfWidth * 2) - 8, xInGame));
        };

        this.canvas.addEventListener('mousemove', (e) => {
            this.state.isUsingMouse = true;
            this.state.isUsingTouch = false;
            handlePointerMove(e.clientX, e.clientY);
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.onActionTrigger) {
                this.onActionTrigger();
            }
        });

        // 2. Direct Mobile Touch Controls on Canvas & Container
        let touchActive = false;

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.state.isUsingTouch = true;
            this.state.isUsingMouse = false;
            touchActive = true;
            if (e.touches.length > 0) {
                handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }
            if (this.onActionTrigger) this.onActionTrigger();
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.state.isUsingTouch = true;
            if (e.touches.length > 0) {
                handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (touchActive && e.touches.length > 0) {
                this.state.isUsingTouch = true;
                handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            touchActive = false;
        }, { passive: true });

        // 3. Dedicated Touch Bar underneath canvas
        const touchBar = document.getElementById('mobileTouchBar');
        if (touchBar) {
            const handleBarTouch = (e) => {
                e.preventDefault();
                this.state.isUsingTouch = true;
                if (e.touches.length > 0) {
                    const rect = touchBar.getBoundingClientRect();
                    const ratio = (e.touches[0].clientX - rect.left) / rect.width;
                    this.state.paddleTargetX = Math.max(0, Math.min(this.gameWidth, ratio * this.gameWidth));
                }
            };

            touchBar.addEventListener('touchstart', (e) => {
                handleBarTouch(e);
                if (this.onActionTrigger) this.onActionTrigger();
            }, { passive: false });

            touchBar.addEventListener('touchmove', handleBarTouch, { passive: false });
        }

        // 4. Keyboard Controls
        window.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.state.left = true;
                this.state.isUsingMouse = false;
                this.state.isUsingTouch = false;
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.state.right = true;
                this.state.isUsingMouse = false;
                this.state.isUsingTouch = false;
            }
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                e.preventDefault();
                this.state.action = true;
                if (this.onActionTrigger) this.onActionTrigger();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.state.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.state.right = false;
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.state.action = false;
        });
    }
}

window.InputManager = InputManager;
