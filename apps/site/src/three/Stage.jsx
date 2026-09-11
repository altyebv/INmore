import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';

/**
 * Lighting and camera behaviour for product viewing.
 *
 * The environment is built from light shapes rather than a downloaded HDRI, so
 * the studio has no external asset dependency and loads instantly. The rig
 * reads as a small photography setup: a broad key from above-front, a cool fill
 * behind, and two narrow strips that pick out the silhouette.
 */
export function Stage({ camera, autoRotate, onInteract, controls = true, ground = 0.05 }) {
  return (
    <>
      <ambientLight intensity={0.35} />

      <directionalLight
        position={[0.3, 0.5, 0.35]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.05}
        shadow-camera-far={2}
        shadow-camera-top={0.2}
        shadow-camera-bottom={-0.2}
        shadow-camera-left={-0.2}
        shadow-camera-right={0.2}
        shadow-bias={-0.0006}
      />
      <directionalLight position={[-0.4, 0.25, -0.3]} intensity={0.7} color="#cfd8e3" />

      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 1.2, 0.8]} scale={[3, 2, 1]} />
        <Lightformer
          form="rect"
          intensity={1.4}
          position={[-1.4, 0.4, -0.6]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[2, 2, 1]}
          color="#dfe6ef"
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          position={[1.4, 0.2, -0.4]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[2, 2, 1]}
          color="#fff1e2"
        />
        <Lightformer form="ring" intensity={0.6} position={[0, -1, 0]} scale={3} />
      </Environment>

      <ContactShadows
        position={[0, -ground, 0]}
        opacity={0.5}
        scale={ground * 11}
        blur={2.4}
        far={ground * 2.8}
        resolution={512}
        color="#000000"
      />

      {controls && (
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.75}
        zoomSpeed={0.6}
        target={camera.target}
        minDistance={camera.minDistance}
        maxDistance={camera.maxDistance}
        minPolarAngle={camera.minPolarAngle}
        maxPolarAngle={camera.maxPolarAngle}
        autoRotate={autoRotate}
        autoRotateSpeed={0.9}
        onStart={onInteract}
      />
      )}
    </>
  );
}

export default Stage;
