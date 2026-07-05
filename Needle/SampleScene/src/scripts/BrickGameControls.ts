export function setupBrickGameUI() {
    const uiContainer = document.createElement("div");
    uiContainer.id = "brick-game-ui";
    uiContainer.className = "retro-ui-container";

    // D-Pad container
    const dpad = document.createElement("div");
    dpad.className = "retro-dpad";

    const createBtn = (text: string, extraClass: string, callback: () => void) => {
        const btn = document.createElement("button");
        btn.innerText = text;
        btn.className = `retro-btn dpad-btn ${extraClass}`;
        
        // Touch and mouse events
        const trigger = (e: Event) => {
            e.preventDefault();
            callback();
        };
        btn.addEventListener("touchstart", trigger);
        btn.addEventListener("mousedown", trigger);
        return btn;
    };

    const getGame = () => (window as any).brickGame;

    const leftBtn = createBtn("◄", "btn-left", () => {
        const game = getGame();
        if (game) { game.initAudio(); game.move(-1); }
    });
    
    const rightBtn = createBtn("►", "btn-right", () => {
        const game = getGame();
        if (game) { game.initAudio(); game.move(1); }
    });
    
    const downBtn = createBtn("▼", "btn-down", () => {
        const game = getGame();
        if (game) { game.initAudio(); game.drop(); }
    });

    dpad.appendChild(leftBtn);
    dpad.appendChild(rightBtn);
    dpad.appendChild(downBtn);

    // Actions container
    const actions = document.createElement("div");
    actions.className = "retro-actions";

    const startBtn = document.createElement("button");
    startBtn.innerText = "START";
    startBtn.className = "retro-btn action-btn-start";
    const triggerStart = (e: Event) => {
        e.preventDefault();
        const game = getGame();
        if (game) {
            game.initAudio();
            if (!game.isPlaying) game.start();
        }
    };
    startBtn.addEventListener("touchstart", triggerStart);
    startBtn.addEventListener("mousedown", triggerStart);

    const rotateBtn = document.createElement("button");
    rotateBtn.innerText = "ROTATE";
    rotateBtn.className = "retro-btn action-btn-rotate";
    const triggerRotate = (e: Event) => {
        e.preventDefault();
        const game = getGame();
        if (game) { game.initAudio(); game.rotate(); }
    };
    rotateBtn.addEventListener("touchstart", triggerRotate);
    rotateBtn.addEventListener("mousedown", triggerRotate);

    actions.appendChild(startBtn);
    actions.appendChild(rotateBtn);

    uiContainer.appendChild(dpad);
    uiContainer.appendChild(actions);

    // Wait until needle-engine is in the DOM to append, so it becomes part of the AR DOM overlay
    const checkEngine = setInterval(() => {
        const engine = document.querySelector("needle-engine");
        if (engine) {
            clearInterval(checkEngine);
            engine.appendChild(uiContainer);
        }
    }, 100);
}
