// Import types from dependencies
/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { BrickGameButton } from "../scripts/BrickGameScreen.js";
import { BrickGameScreen } from "../scripts/BrickGameScreen.js";
import { TrompoFixer } from "../scripts/TrompoFixer.js";

// Register types
export function registerTypes() {
	TypeStore.add("BrickGameButton", BrickGameButton);
	TypeStore.add("BrickGameScreen", BrickGameScreen);
	TypeStore.add("TrompoFixer", TrompoFixer);
}
registerTypes();
