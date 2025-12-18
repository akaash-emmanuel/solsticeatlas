
import { Vector3 } from 'three';
import gsap from 'gsap';

export class CameraManager {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.currentFocus = null;
    this.focusTarget = null; // The Object3D we are currently following
    this.targetPosition = new Vector3(); // For static targets or offset calculations
    this.mode = 'FREE'; // 'FREE', 'ORBIT', 'TRANSITION'
  }

  /**
   * Focuses the camera on a specific object or vector.
   * @param {string} name - Name of the focus target (e.g., 'earth', 'moon').
   * @param {Object3D} targetObject - The Three.js object to focus on.
   * @param {number} viewDistance - Distance from the target center.
   * @param {number} duration - Animation duration in seconds.
   */
  focusOnObject(name, targetObject, viewDistance = 400, duration = 1.5) {
    if (!targetObject) {
        console.warn(`CameraManager: Cannot focus on null object for ${name}`);
        return;
    }

    this.currentFocus = name.toLowerCase();
    this.focusTarget = targetObject;
    this.mode = 'TRANSITION';

    console.log(`CameraManager: Switching focus to ${name}`);

    // Calculate start and end positions
    const startPos = this.camera.position.clone();
    
    // Get world position of the target
    const targetWorldPos = new Vector3();
    targetObject.getWorldPosition(targetWorldPos);

    // Calculate desired camera position
    // We keep the current direction from the object to the camera, but adjust the distance
    const direction = new Vector3().subVectors(this.camera.position, targetWorldPos).normalize();
    const endPos = targetWorldPos.clone().add(direction.multiplyScalar(viewDistance));

    // Animate camera position and controls target
    // Using GSAP for smoother transitions if available, otherwise manual lerp in update
    // But since we want to encompass the transition state, we can use a simple tween here 
    // or set a flag to handle it in update().
    // Let's use a managed transition object to avoid dependency on external tween libraries if possible,
    // but the project uses gsap, so let's use it.
    
    gsap.to(this.camera.position, {
        x: endPos.x,
        y: endPos.y,
        z: endPos.z,
        duration: duration,
        ease: "power2.inOut",
        onUpdate: () => {
            this.camera.lookAt(targetWorldPos);
        },
        onComplete: () => {
            this.mode = 'ORBIT';
            this.controls.target.copy(targetWorldPos);
            this.updateControlsSettings(name, targetObject);
        }
    });

    // Also tween the controls target to the new center
    gsap.to(this.controls.target, {
        x: targetWorldPos.x,
        y: targetWorldPos.y,
        z: targetWorldPos.z,
        duration: duration,
        ease: "power2.inOut"
    });
  }

  resetView(duration = 1.5) {
      this.currentFocus = null;
      this.focusTarget = null;
      this.mode = 'TRANSITION';

      const defaultPos = new Vector3(0, 0, 400); // Standard starting position
      
      gsap.to(this.camera.position, {
          x: defaultPos.x,
          y: defaultPos.y,
          z: defaultPos.z,
          duration: duration,
          ease: "power2.inOut",
          onComplete: () => {
              this.mode = 'FREE';
              this.controls.target.set(0,0,0);
              this.controls.minDistance = 115;
              this.controls.maxDistance = 50000;
          }
      });

      gsap.to(this.controls.target, {
          x: 0,
          y: 0,
          z: 0,
          duration: duration,
          ease: "power2.inOut"
      });
  }

  updateControlsSettings(name, targetObject) {
      // Set specific control limitations based on the object
      if (name === 'moon') {
          const radius = targetObject.geometry?.parameters?.radius || 10;
          this.controls.minDistance = radius * 1.2;
          this.controls.maxDistance = radius * 10;
          this.controls.enableDamping = false;
          this.controls.autoRotate = false;
      } else {
          this.controls.minDistance = 115; // Default minimal distance
          this.controls.maxDistance = 50000;
      }
  }

  update() {
      if (this.mode === 'ORBIT' && this.focusTarget) {
          // Keep the controls target locked to the moving object
          const targetWorldPos = new Vector3();
          this.focusTarget.getWorldPosition(targetWorldPos);
          this.controls.target.copy(targetWorldPos);
          
          // Optionally allow the camera to drift with it? 
          // OrbitControls usually handles the camera position relative to target if we just move the target.
          // BUT, we need to make sure the camera moves WITH the object so relative position stays same.
          
          // Basic following logic:
          // We can't easily modify camera position here without fighting OrbitControls.
          // OrbitControls updates camera position based on target and its internal spherical coordinates.
          // If we change controls.target, OrbitControls will shift the camera on next update() to maintain the angle/distance if we aren't careful.
          // Actually, simply updating controls.target works well for smooth following if called every frame.
      }
      
      this.controls.update();
  }
}
