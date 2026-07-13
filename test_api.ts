import { WebGLEngine } from '@galacean/engine';

async function test() {
  const engine = await WebGLEngine.create({ canvas: "canvas" });
  const scene = engine.sceneManager.activeScene;
  
  // Test available methods
  console.log('Scene methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(scene)));
}

test();
