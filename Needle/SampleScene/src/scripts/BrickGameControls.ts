export function setupBrickGameUI() {
    const uiContainer = document.createElement("div");
    uiContainer.id = "brick-game-ui";
    
    // Style the container to be at the bottom of the screen
    Object.assign(uiContainer.style, {
        position: "absolute",
        bottom: "120px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        maxWidth: "400px",
        height: "150px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: "9999",
        fontFamily: "monospace"
    });

    // D-Pad container
    const dpad = document.createElement("div");
    Object.assign(dpad.style, {
        position: "relative",
        width: "120px",
        height: "120px",
        pointerEvents: "auto"
    });

    const createBtn = (text: string, left: string, top: string, callback: () => void) => {
        const btn = document.createElement("button");
        btn.innerText = text;
        Object.assign(btn.style, {
            position: "absolute",
            left: left,
            top: top,
            width: "40px",
            height: "40px",
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            border: "2px solid #333",
            borderRadius: "5px",
            fontSize: "16px",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            userSelect: "none"
        });
        
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

    const leftBtn = createBtn("◄", "0px", "40px", () => {
        const game = getGame();
        if (game) { game.initAudio(); game.move(-1); }
    });
    
    const rightBtn = createBtn("►", "80px", "40px", () => {
        const game = getGame();
        if (game) { game.initAudio(); game.move(1); }
    });
    
    const downBtn = createBtn("▼", "40px", "80px", () => {
        const game = getGame();
        if (game) { game.initAudio(); game.drop(); }
    });

    dpad.appendChild(leftBtn);
    dpad.appendChild(rightBtn);
    dpad.appendChild(downBtn);

    // Actions container
    const actions = document.createElement("div");
    Object.assign(actions.style, {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "auto"
    });

    const startBtn = document.createElement("button");
    startBtn.innerText = "START";
    Object.assign(startBtn.style, {
        padding: "10px 20px",
        backgroundColor: "rgba(255, 50, 50, 0.7)",
        color: "white",
        border: "2px solid #333",
        borderRadius: "20px",
        fontWeight: "bold",
        userSelect: "none"
    });
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
    Object.assign(rotateBtn.style, {
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        backgroundColor: "rgba(50, 50, 255, 0.7)",
        color: "white",
        border: "2px solid #333",
        fontWeight: "bold",
        userSelect: "none"
    });
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

    document.body.appendChild(uiContainer);
}
