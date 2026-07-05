import("@needle-tools/engine") /* async import of needle engine */;
import { Context, GameObject, SceneSwitcher, NeedleXRSession } from "@needle-tools/engine";
import { BrickGameScreen } from "./scripts/BrickGameScreen";
import { setupBrickGameUI } from "./scripts/BrickGameControls";

// Setup the HTML gamepad overlay (D-pad + Start/Rotate buttons)
setupBrickGameUI();

function hideNeedleBranding() {
    const menu = document.querySelector("needle-menu");
    if (!menu?.shadowRoot) return;
    const root = menu.shadowRoot.getElementById("root") as HTMLElement;
    const logoContainer = menu.shadowRoot.querySelector(".logo") as HTMLElement;
    if (!root || !logoContainer) return;

    const hideLogo = () => {
        root.classList.remove("logo-visible");
        root.classList.add("logo-hidden");
        logoContainer.style.setProperty("display", "none", "important");
    };

    hideLogo();

    const guard = new MutationObserver(() => {
        if (root.classList.contains("logo-visible") || !root.classList.contains("logo-hidden")) {
            hideLogo();
        }
        if (logoContainer.style.display !== "none") {
            logoContainer.style.setProperty("display", "none", "important");
        }
    });
    guard.observe(root, { attributes: true, attributeFilter: ["class"] });
    guard.observe(logoContainer, { attributes: true, attributeFilter: ["style"] });
}

// Wait for the Needle Engine context to be ready, then attach the game component
const waitForScene = setInterval(() => {
    if (Context.Current && Context.Current.scene) {
        clearInterval(waitForScene);
        console.log("[BrickGame] Scene ready — attaching BrickGameScreen");

        hideNeedleBranding();

        // Override the document title — Needle injects the Unity scene name
        document.title = "Retro AR Tetris";

        // Disable the spatial menu in AR to hide the "Powered by Needle" watermark
        Context.Current.menu.showSpatialMenu(false);

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



        // Handle AR splash screen interaction
        const splash = document.getElementById("ar-splash");
        if (splash) {
            splash.addEventListener("click", async () => {
                splash.style.display = "none";
                const ui = document.getElementById("brick-game-ui");
                try {
                    await NeedleXRSession.start("ar");
                    console.log("[BrickGame] AR session started");
                    if (ui) ui.style.display = "flex";
                } catch (e) {
                    console.warn("[BrickGame] Could not start AR, falling back to 3D:", e);
                    if (ui) ui.style.display = "flex";
                }
            });
        }
    }
}, 200);
