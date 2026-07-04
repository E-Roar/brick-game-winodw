import("@needle-tools/engine") /* async import of needle engine */;
import { Context, GameObject, SceneSwitcher } from "@needle-tools/engine";
import { BrickGameScreen } from "./scripts/BrickGameScreen";
import { setupBrickGameUI } from "./scripts/BrickGameControls";

// Setup the HTML gamepad overlay (D-pad + Start/Rotate buttons)
setupBrickGameUI();

// Wait for the Needle Engine context to be ready, then attach the game component
const waitForScene = setInterval(() => {
    if (Context.Current && Context.Current.scene) {
        clearInterval(waitForScene);
        console.log("[BrickGame] Scene ready — attaching BrickGameScreen");

        // Fix SceneSwitcher: scenes[0] is null in the GLB export, scenes[1] is "Hole"
        // We need to select index 1 and hide the menu buttons
        const switcher = GameObject.findObjectOfType(SceneSwitcher);
        if (switcher) {
            switcher.createMenuButtons = false;
            // Select the actual scene (index 1 = "Hole" node)
            switcher.select(1).then(() => {
                console.log("[BrickGame] SceneSwitcher loaded scene 1 (Hole)");
            });
        }

        // Attach the BrickGameScreen component
        if (!GameObject.getComponent(Context.Current.scene, BrickGameScreen)) {
            GameObject.addComponent(Context.Current.scene, BrickGameScreen);
        }
    }
}, 200);