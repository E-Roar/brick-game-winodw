import {
    Behaviour,
    GameObject,
    IPointerClickHandler,
    PointerEventData,
} from "@needle-tools/engine";
import {
    Mesh,
    CanvasTexture,
    MeshStandardMaterial,
    NearestFilter,
    LinearFilter,
} from "three";

// ─────────────────────────────────────────────────────────────────────────────
// RetroAudio
// ─────────────────────────────────────────────────────────────────────────────
class RetroAudio {
    private ctx: AudioContext | null = null;

    public init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === "suspended") this.ctx.resume();
    }

    private playTone(freq: number, type: OscillatorType, dur: number) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    }

    public playMove()     { this.playTone(440, "square",   0.08); }
    public playDrop()     { this.playTone(280, "square",   0.10); }
    public playRotate()   { this.playTone(660, "square",   0.08); }
    public playClear()    { this.playTone(880, "square",   0.20); }
    public playGameOver() { this.playTone(140, "sawtooth", 0.50); }
}

// ─────────────────────────────────────────────────────────────────────────────
// TetrisGame — draws to a canvas that matches the Object_8 UV/aspect ratio
//   Object_8 bounds: width ~38mm, height ~49mm  ⟹  aspect ≈ 0.776 (w/h)
//   Canvas: 256 × 330 (maintains that ratio, power-of-2-ish for GPU)
// ─────────────────────────────────────────────────────────────────────────────
const CANVAS_W = 256;
const CANVAS_H = 330;
const COLS = 10;
const ROWS = 20;
// block size so grid fills most of the canvas
const BLK = Math.floor(Math.min(CANVAS_W / COLS, CANVAS_H / ROWS));
// offsets to centre the grid in the canvas
const GRID_OX = Math.floor((CANVAS_W - COLS * BLK) / 2);
const GRID_OY = Math.floor((CANVAS_H - ROWS * BLK) / 2);

const PIECES = [
    [[1, 1, 1, 1]],                    // I
    [[1, 1], [1, 1]],                  // O
    [[0, 1, 0], [1, 1, 1]],            // T
    [[1, 0, 0], [1, 1, 1]],            // L
    [[0, 0, 1], [1, 1, 1]],            // J
    [[0, 1, 1], [1, 1, 0]],            // S
    [[1, 1, 0], [0, 1, 1]],            // Z
];

export class TetrisGame {
    private ctx: CanvasRenderingContext2D;
    private audio = new RetroAudio();
    private grid: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    private piece: number[][] = [];
    private px = 0;
    private py = 0;
    private dropTimer = 0;
    private dropInterval = 500;

    public score = 0;
    public isPlaying = false;
    public isGameOver = false;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext("2d")!;
    }

    public initAudio() { this.audio.init(); }

    public start() {
        this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        this.score = 0;
        this.dropInterval = 500;
        this.isGameOver = false;
        this.isPlaying = true;
        this.spawn();
    }

    private spawn() {
        this.piece = PIECES[Math.floor(Math.random() * PIECES.length)];
        this.px = Math.floor(COLS / 2) - Math.floor(this.piece[0].length / 2);
        this.py = 0;
        if (this.collides(0, 0, this.piece)) {
            this.isGameOver = true;
            this.isPlaying = false;
            this.audio.playGameOver();
        }
    }

    private collides(ox: number, oy: number, p: number[][]): boolean {
        for (let r = 0; r < p.length; r++) {
            for (let c = 0; c < p[r].length; c++) {
                if (!p[r][c]) continue;
                const nx = this.px + c + ox;
                const ny = this.py + r + oy;
                if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
                if (ny >= 0 && this.grid[ny][nx]) return true;
            }
        }
        return false;
    }

    public move(dir: number) {
        if (!this.isPlaying) return;
        if (!this.collides(dir, 0, this.piece)) {
            this.px += dir;
            this.audio.playMove();
        }
    }

    public drop() {
        if (!this.isPlaying) return;
        if (!this.collides(0, 1, this.piece)) {
            this.py++;
            this.audio.playDrop();
        } else {
            this.lock();
        }
    }

    public rotate() {
        if (!this.isPlaying) return;
        const rot = this.piece[0].map((_: any, i: number) =>
            this.piece.map((row) => row[i]).reverse()
        );
        if (!this.collides(0, 0, rot)) {
            this.piece = rot;
            this.audio.playRotate();
        }
    }

    private lock() {
        for (let r = 0; r < this.piece.length; r++) {
            for (let c = 0; c < this.piece[r].length; c++) {
                if (!this.piece[r][c]) continue;
                if (this.py + r < 0) { this.isGameOver = true; this.isPlaying = false; this.audio.playGameOver(); return; }
                this.grid[this.py + r][this.px + c] = 1;
            }
        }
        // clear lines
        let cleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (this.grid[r].every(v => v)) {
                this.grid.splice(r, 1);
                this.grid.unshift(Array(COLS).fill(0));
                cleared++;
                r++;
            }
        }
        if (cleared) {
            this.score += cleared * 10;
            this.dropInterval = Math.max(80, 500 - this.score * 2);
            this.audio.playClear();
        }
        this.spawn();
    }

    public update(dt: number) {
        if (!this.isPlaying) return;
        this.dropTimer += dt;
        if (this.dropTimer >= this.dropInterval) {
            this.dropTimer = 0;
            if (!this.collides(0, 1, this.piece)) this.py++;
            else this.lock();
        }
    }

    public draw() {
        const c = this.ctx;
        const W = CANVAS_W, H = CANVAS_H;

        // Background — retro LCD green
        c.fillStyle = "#8ba870";
        c.fillRect(0, 0, W, H);

        // Border around the grid
        c.strokeStyle = "#3a4a30";
        c.lineWidth = 2;
        c.strokeRect(GRID_OX - 1, GRID_OY - 1, COLS * BLK + 2, ROWS * BLK + 2);

        // Draw locked cells
        c.fillStyle = "#1a2a10";
        for (let r = 0; r < ROWS; r++) {
            for (let col = 0; col < COLS; col++) {
                if (this.grid[r][col]) {
                    c.fillRect(GRID_OX + col * BLK + 1, GRID_OY + r * BLK + 1, BLK - 2, BLK - 2);
                }
            }
        }

        // Draw active piece
        if (this.isPlaying) {
            c.fillStyle = "#000000";
            for (let r = 0; r < this.piece.length; r++) {
                for (let col = 0; col < this.piece[r].length; col++) {
                    if (this.piece[r][col]) {
                        c.fillRect(
                            GRID_OX + (this.px + col) * BLK + 1,
                            GRID_OY + (this.py + r)  * BLK + 1,
                            BLK - 2, BLK - 2
                        );
                    }
                }
            }
        }

        // HUD
        c.fillStyle = "#1a2a10";
        c.font = `bold ${BLK - 1}px monospace`;
        c.fillText(`SCR:${this.score}`, GRID_OX, GRID_OY - 4);

        if (this.isGameOver) {
            c.fillStyle = "rgba(0,0,0,0.55)";
            c.fillRect(GRID_OX, GRID_OY + ROWS * BLK / 2 - BLK * 2, COLS * BLK, BLK * 4);
            c.fillStyle = "#8ba870";
            c.font = `bold ${BLK + 1}px monospace`;
            c.fillText("GAME OVER", GRID_OX + 2, GRID_OY + ROWS * BLK / 2);
            c.font = `${BLK - 1}px monospace`;
            c.fillText("TAP ON/OFF", GRID_OX + 4, GRID_OY + ROWS * BLK / 2 + BLK + 2);
        } else if (!this.isPlaying) {
            c.fillStyle = "rgba(0,0,0,0.45)";
            c.fillRect(GRID_OX, GRID_OY + ROWS * BLK / 2 - BLK, COLS * BLK, BLK * 2 + 4);
            c.fillStyle = "#8ba870";
            c.font = `bold ${BLK}px monospace`;
            c.fillText("TAP ON/OFF", GRID_OX + 4, GRID_OY + ROWS * BLK / 2 + BLK - 2);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// BrickGameButton — attached to each 3D button mesh to handle taps
// ─────────────────────────────────────────────────────────────────────────────
export class BrickGameButton extends Behaviour implements IPointerClickHandler {
    public action: string = "";

    onPointerClick(_evt: PointerEventData) {
        const game: TetrisGame | undefined = (window as any).brickGame;
        if (!game) return;
        game.initAudio();
        switch (this.action) {
            case "right":  game.move(1);   break;
            case "left":   game.move(-1);  break;
            case "down":   game.drop();    break;
            case "rotate": game.rotate();  break;
            case "start":
                if (!game.isPlaying) game.start();
                break;
            case "reset":
                game.isGameOver = false;
                game.isPlaying  = false;
                game.draw();
                (window as any).brickGameTextureUpdate?.();
                break;
            case "pause":
                if (!game.isGameOver) game.isPlaying = !game.isPlaying;
                break;
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exact node-name → action map (from GLB inspection)
// ─────────────────────────────────────────────────────────────────────────────
const BUTTON_MAP: Record<string, string> = {
    "borao right_4":  "right",
    "botao down_5":   "down",
    "botao left_6":   "left",
    "Botao rotate_7": "rotate",
    "botao up_8":     "up",
    "on off_9":       "start",
    "Reset_10":       "reset",
    "S/P_11":         "pause",
};

// ─────────────────────────────────────────────────────────────────────────────
// BrickGameScreen — main orchestrator component
// ─────────────────────────────────────────────────────────────────────────────
export class BrickGameScreen extends Behaviour {

    private canvas: HTMLCanvasElement;
    private tex: CanvasTexture;
    private game: TetrisGame;
    private applied = false;
    private retryTimer = 0;

    constructor() {
        super();
        this.canvas      = document.createElement("canvas");
        this.canvas.width  = CANVAS_W;
        this.canvas.height = CANVAS_H;
        this.tex           = new CanvasTexture(this.canvas);
        // GLTF UV origin is bottom-left; Three.js default is top-left → must flip
        this.tex.flipY     = true;
        this.tex.minFilter = LinearFilter;
        this.tex.magFilter = NearestFilter;
        this.game = new TetrisGame(this.canvas);
    }

    start() {
        (window as any).brickGame = this.game;
        (window as any).brickGameTextureUpdate = () => { this.tex.needsUpdate = true; };
        this.game.draw();
        this.tex.needsUpdate = true;
        this.tryApply();
    }

    private tryApply() {
        // ── 1. Find Object_8 by name ──────────────────────────────────────────
        this.context.scene.traverse((node: any) => {
            if (this.applied) return;
            if (node.isMesh && node.name === "Object_8") {
                this.patchMesh(node);
            }
        });

        // ── 2. Wire 3D buttons with BrickGameButton components ────────────────
        if (this.applied) {
            this.context.scene.traverse((node: any) => {
                const action = BUTTON_MAP[node.name];
                if (!action) return;
                // Attach component only once
                if (!GameObject.getComponent(node, BrickGameButton)) {
                    const btn = GameObject.addComponent(node, BrickGameButton) as BrickGameButton;
                    btn.action = action;
                    console.log("[BrickGame] Wired 3D button:", node.name, "→", action);
                }
            });
        }
    }

    private patchMesh(mesh: Mesh) {
        console.log("[BrickGame] Patching Object_8 with canvas texture");
        // Clone the existing material so we only override the map
        let mat: MeshStandardMaterial;
        if (Array.isArray(mesh.material)) {
            mat = (mesh.material[0] as MeshStandardMaterial).clone();
            mesh.material = mat;
        } else {
            mat = (mesh.material as MeshStandardMaterial).clone();
            mesh.material = mat;
        }
        mat.map              = this.tex;
        mat.emissiveMap      = this.tex;     // make the screen glow slightly
        mat.emissive.set(0.25, 0.35, 0.15); // subtle green tint
        mat.emissiveIntensity = 0.4;
        mat.roughness        = 0.15;
        mat.metalness        = 0.0;
        mat.needsUpdate      = true;
        this.applied = true;
    }

    update() {
        // Keep retrying until the GLB hierarchy is fully loaded
        if (!this.applied) {
            this.retryTimer += this.context.time.deltaTime;
            if (this.retryTimer >= 0.5) {
                this.retryTimer = 0;
                this.tryApply();
            }
            return;
        }

        if (this.game.isPlaying) {
            this.game.update(this.context.time.deltaTime * 1000);
            this.game.draw();
            this.tex.needsUpdate = true;
        }
    }
}
