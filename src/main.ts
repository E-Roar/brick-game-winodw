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

        // Auto-enter AR mode as the default experience
        setTimeout(async () => {
            try {
                await NeedleXRSession.start("ar");
                console.log("[BrickGame] AR session started");
                const qr = document.getElementById("qr-code-overlay");
                if (qr) qr.style.display = "none";
            } catch (e) {
                console.warn("[BrickGame] Could not start AR:", e);
            }
        }, 1500);
    }
}, 200);
