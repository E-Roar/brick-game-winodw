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

// @ts-ignore
import store from "../react-game/store/index.jsx";
// @ts-ignore
import control from "../react-game/control/index.jsx";
// @ts-ignore
import { Music } from "../react-game/utils/music.jsx";

const CANVAS_W = 256;
const CANVAS_H = 330;
const COLS = 10;
const ROWS = 20;
const BLK = Math.floor(Math.min(CANVAS_W / COLS, CANVAS_H / ROWS));
const GRID_OX = Math.floor((CANVAS_W - COLS * BLK) / 2);
const GRID_OY = Math.floor((CANVAS_H - ROWS * BLK) / 2);

export class BrickGameButton extends Behaviour implements IPointerClickHandler {
    public action: string = "";

    onPointerClick(_evt: PointerEventData) {
        if (!store) return;
        
        // Initialize Audio context on user interaction
        if (Music && Music.startState === false && Music.start) {
             Music.start();
        }

        const state = store.getState();
        const pause = state.pause;
        const game = state.game;
        const games = state.games;
        
        const actionType = this.action;
        
        if (pause === 0) {
            if (control['todo'] && control['todo'][actionType]) {
                control['todo'][actionType]();
            }
        } else {
            const gameName = games[game].name;
            if (control[gameName] && control[gameName][actionType]) {
                control[gameName][actionType]();
            } else if (actionType === 'p' || actionType === 'r' || actionType === 's') {
                if (control['todo'] && control['todo'][actionType]) {
                    control['todo'][actionType]();
                }
            }
        }
    }
}

// Node-name → action map (mapped to React keyboard types)
const BUTTON_MAP: Record<string, string> = {
    "borao right_4":  "right",
    "botao down_5":   "down",
    "botao left_6":   "left",
    "Botao rotate_7": "rotate",
    "botao up_8":     "up",
    "on off_9":       "p",
    "Reset_10":       "r",
    "S/P_11":         "s",
};

export class BrickGameScreen extends Behaviour {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private tex: CanvasTexture;
    private applied = false;
    private retryTimer = 0;
    private unsubscribe: (() => void) | null = null;

    constructor() {
        super();
        this.canvas      = document.createElement("canvas");
        this.canvas.width  = CANVAS_W;
        this.canvas.height = CANVAS_H;
        this.ctx           = this.canvas.getContext("2d")!;
        this.tex           = new CanvasTexture(this.canvas);
        this.tex.flipY     = true;
        this.tex.minFilter = LinearFilter;
        this.tex.magFilter = NearestFilter;
    }

    start() {
        this.unsubscribe = store.subscribe(() => {
            this.drawReduxState();
        });
        this.drawReduxState();
        this.tryApply();
    }
    
    onDestroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    private drawReduxState() {
        const state = store.getState();
        const c = this.ctx;
        const W = CANVAS_W, H = CANVAS_H;

        // Background — retro LCD green
        c.fillStyle = "#8ba870";
        c.fillRect(0, 0, W, H);

        // Border around the grid
        c.strokeStyle = "#3a4a30";
        c.lineWidth = 2;
        c.strokeRect(GRID_OX - 1, GRID_OY - 1, COLS * BLK + 2, ROWS * BLK + 2);
        
        if (state.pause === 0) {
             c.fillStyle = "#1a2a10";
             c.font = `bold ${BLK}px monospace`;
             c.fillText("RETRO GAME", GRID_OX + 2, GRID_OY + ROWS * BLK / 2 - BLK * 2);
             c.font = `${BLK - 1}px monospace`;
             const gameName = state.games[state.game]?.name?.toUpperCase() || "TETRIS";
             c.fillText(gameName, GRID_OX + 4, GRID_OY + ROWS * BLK / 2);
             c.fillText("PRESS START", GRID_OX + 4, GRID_OY + ROWS * BLK / 2 + BLK * 2);
        } else {
            // Draw matrix from window exported state (React calculates the active piece + animations locally)
            const matrix = (window as any).__BRICK_MATRIX__;
            c.fillStyle = "#1a2a10";
            if (matrix) {
                for (let r = 0; r < matrix.length; r++) {
                    const row = matrix[r];
                    for (let col = 0; col < row.length; col++) {
                        const val = row[col];
                        if (val !== 0) {
                            c.fillRect(GRID_OX + col * BLK + 1, GRID_OY + r * BLK + 1, BLK - 2, BLK - 2);
                        }
                    }
                }
            }
            
            // HUD
            c.fillStyle = "#1a2a10";
            c.font = `bold ${BLK - 1}px monospace`;
            const score = state.games[state.game].score;
            c.fillText(`SCR:${score}`, GRID_OX, GRID_OY - 4);
        }

        this.tex.needsUpdate = true;
    }

    private tryApply() {
        this.context.scene.traverse((node: any) => {
            if (this.applied) return;
            if (node.isMesh && node.name === "Object_8") {
                this.patchMesh(node);
            }
        });

        if (this.applied) {
            this.context.scene.traverse((node: any) => {
                const action = BUTTON_MAP[node.name];
                if (!action) return;
                if (!GameObject.getComponent(node, BrickGameButton)) {
                    const btn = GameObject.addComponent(node, BrickGameButton) as BrickGameButton;
                    btn.action = action;
                    console.log("[BrickGame] Wired 3D button:", node.name, "→", action);
                }
            });
        }
    }

    private patchMesh(mesh: Mesh) {
        let mat: MeshStandardMaterial;
        if (Array.isArray(mesh.material)) {
            mat = (mesh.material[0] as MeshStandardMaterial).clone();
            mesh.material = mat;
        } else {
            mat = (mesh.material as MeshStandardMaterial).clone();
            mesh.material = mat;
        }
        mat.map              = this.tex;
        mat.emissiveMap      = this.tex; 
        mat.emissive.set(0.25, 0.35, 0.15); 
        mat.emissiveIntensity = 0.4;
        mat.roughness        = 0.15;
        mat.metalness        = 0.0;
        mat.needsUpdate      = true;
        this.applied = true;
    }

    update() {
        if (!this.applied) {
            this.retryTimer += this.context.time.deltaTime;
            if (this.retryTimer >= 0.5) {
                this.retryTimer = 0;
                this.tryApply();
            }
        }
        // Force redraw every frame to capture React's local state animations (like the falling piece)
        this.drawReduxState();
    }
}
