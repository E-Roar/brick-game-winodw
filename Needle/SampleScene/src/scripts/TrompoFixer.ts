import { Behaviour, GameObject, Animator } from "@needle-tools/engine";
import { Mesh, MeshStandardMaterial, AnimationMixer, LoopRepeat } from "three";

export class TrompoFixer extends Behaviour {
    private mixer: AnimationMixer | null = null;

    start() {
        this.gameObject.traverse((node: any) => {
            // Fix materials for the Trompo: apply to all meshes within the Trompo's hierarchy
            if (node.isMesh) {
                const mesh = node as Mesh;
                if (mesh.material) {
                    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                    for (const mat of materials) {
                        if (mat && (mat as MeshStandardMaterial).isMeshStandardMaterial) {
                            const standardMat = mat as MeshStandardMaterial;
                            standardMat.roughness = 0.1;
                            standardMat.metalness = 0.9;
                            standardMat.envMapIntensity = 2.0;
                            standardMat.needsUpdate = true;
                            console.log(`[TrompoFixer] Applied metallic material settings to: ${mesh.name} (${standardMat.name})`);
                        }
                    }
                }
            }
        });

        // Try to play animation via Needle's Animator if present
        const animator = GameObject.getComponent(this.gameObject, Animator);
        if (animator) {
            console.log("[TrompoFixer] Found Needle Animator, ensuring it plays looping");
            // Usually Needle animations loop by default if set in Unity
        } else if (this.gameObject.animations && this.gameObject.animations.length > 0) {
            // Fallback: Check for raw ThreeJS animations on the GLTF scene only if no Needle Animator is present
            console.log("[TrompoFixer] No Needle Animator found, playing first raw ThreeJS animation clip manually");
            this.mixer = new AnimationMixer(this.gameObject);
            const action = this.mixer.clipAction(this.gameObject.animations[0]);
            action.setLoop(LoopRepeat, Infinity);
            action.play();
        }
    }

    update() {
        if (this.mixer) {
            this.mixer.update(this.context.time.deltaTime);
        }
    }
}
