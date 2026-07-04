import("@needle-tools/engine") /* async import of needle engine */;
import { Context, GameObject, SceneSwitcher, NeedleXRSession, generateQRCode } from "@needle-tools/engine";
import { BrickGameScreen } from "./scripts/BrickGameScreen";
import { setupBrickGameUI } from "./scripts/BrickGameControls";

// Setup the HTML gamepad overlay (D-pad + Start/Rotate buttons)
setupBrickGameUI();

// Generate and show QR code for the current page URL
const qrContainer = document.getElementById("qr-code-overlay");
if (qrContainer) {
  const qr = generateQRCode({ text: window.location.href, size: 180 });
  qr.style.width = "180px";
  qr.style.height = "180px";
  qr.style.display = "block";
  qrContainer.appendChild(qr);
  // Hide QR after clicking
  qrContainer.addEventListener("click", () => {
    qrContainer.style.display = "none";
  });
}

// Wait for the Needle Engine context to be ready, then attach the game component
const waitForScene = setInterval(() => {
    if (Context.Current && Context.Current.scene) {
        clearInterval(waitForScene);
        console.log("[BrickGame] Scene ready — attaching BrickGameScreen");

        // Fix SceneSwitcher: scenes[0] is null in the GLB export, scenes[1] is "Hole"
        const switcher = GameObject.findObjectOfType(SceneSwitcher);
        if (switcher) {
            switcher.createMenuButtons = false;
            switcher.select(1).then(() => {
                console.log("[BrickGame] SceneSwitcher loaded scene 1 (Hole)");
            });
        }

        // Attach the BrickGameScreen component
        if (!GameObject.getComponent(Context.Current.scene, BrickGameScreen)) {
            GameObject.addComponent(Context.Current.scene, BrickGameScreen);
        }

        // Auto-enter AR mode as the default experience
        setTimeout(async () => {
            try {
                await NeedleXRSession.start("ar");
                console.log("[BrickGame] AR session started");
                // Hide QR code once in AR
                const qr = document.getElementById("qr-code-overlay");
                if (qr) qr.style.display = "none";
            } catch (e) {
                console.warn("[BrickGame] Could not start AR:", e);
            }
        }, 1500);
    }
}, 200);
