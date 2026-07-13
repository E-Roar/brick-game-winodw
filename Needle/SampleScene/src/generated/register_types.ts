// Import types from dependencies
import "@needle-tools/samples-scripts/codegen/register_types.ts"

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
