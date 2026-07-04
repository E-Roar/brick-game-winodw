import("@needle-tools/engine") /* async import of needle engine */;
import { Context, GameObject, SceneSwitcher, NeedleXRSession } from "@needle-tools/engine";
import { BrickGameScreen } from "./scripts/BrickGameScreen";
import { setupBrickGameUI } from "./scripts/BrickGameControls";

// Setup the HTML gamepad overlay (D-pad + Start/Rotate buttons)
setupBrickGameUI();

// Wait for the Needle Engine context to be ready, then attach the game component
const waitForScene = setInterval(() => {
    if (Context.Current && Context.Current.scene) {
        clearInterval(waitForScene);
        console.log("[BrickGame] Scene ready — attaching BrickGameScreen");

        const switcher = GameObject.findObjectOfType(SceneSwitcher);
        if (switcher) {
            switcher.createMenuButtons = false;
            switcher.select(1).then(() => {
                console.log("[BrickGame] SceneSwitcher loaded scene 1 (Hole)");
            });
        }

        if (!GameObject.getComponent(Context.Current.scene, BrickGameScreen)) {
            GameObject.addComponent(Context.Current.scene, BrickGameScreen);
        }

        // Generate QR code from a QR API as an image — no extra imports or CDN scripts needed
        const qrContainer = document.getElementById("qr-code-overlay");
        if (qrContainer) {
            const img = document.createElement("img");
            img.src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(window.location.href);
            img.alt = "QR code";
            img.style.width = "180px";
            img.style.height = "180px";
            img.style.display = "block";
            qrContainer.appendChild(img);
            qrContainer.addEventListener("click", () => {
                qrContainer.style.display = "none";
            });
        }

        // Handle AR splash screen interaction
        const splash = document.getElementById("ar-splash");
        if (splash) {
            splash.addEventListener("click", async () => {
                splash.style.display = "none";
                const ui = document.getElementById("brick-game-ui");
                try {
                    await NeedleXRSession.start("ar");
                    console.log("[BrickGame] AR session started");
                    if (qrContainer) qrContainer.style.display = "none";
                    if (ui) ui.style.display = "flex";
                } catch (e) {
                    console.warn("[BrickGame] Could not start AR, falling back to 3D:", e);
                    if (qrContainer) qrContainer.style.display = "block";
                    if (ui) ui.style.display = "flex";
                }
            });
        }
    }
}, 200);
