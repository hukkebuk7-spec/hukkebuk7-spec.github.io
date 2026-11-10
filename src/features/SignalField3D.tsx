import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type SignalField3DProps = {
  onReady: () => void
  onFail: () => void
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uScroll;
  attribute float aScale;
  varying float vElevation;

  void main() {
    vec3 pos = position;
    float wave =
      sin(pos.x * 0.62 + uTime * 0.9) * 0.34 +
      sin(pos.z * 1.45 - uTime * 0.7) * 0.22 +
      sin((pos.x + pos.z) * 0.95 + uTime * 1.25) * 0.16;

    vec2 target = uPointer * vec2(10.0, 4.2);
    float influence = smoothstep(3.6, 0.0, distance(pos.xz, target));

    pos.y = wave + influence * 1.95 + uScroll * 0.7;
    vElevation = pos.y;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(aScale * (220.0 / max(0.001, -mvPosition.z)), 1.0, 7.5);
  }
`

const fragmentShader = /* glsl */ `
  varying float vElevation;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float radius = length(uv);
    if (radius > 0.5) discard;

    float alpha = smoothstep(0.5, 0.08, radius);
    vec3 paper = vec3(0.949, 0.937, 0.902);
    vec3 acid = vec3(0.867, 0.941, 0.290);
    vec3 signal = vec3(0.898, 0.267, 0.110);

    vec3 color = mix(paper, acid, smoothstep(-0.5, 0.55, vElevation));
    color = mix(color, signal, smoothstep(0.9, 1.55, vElevation));

    float heat = smoothstep(0.15, 1.4, vElevation);
    gl_FragColor = vec4(color, alpha * (0.2 + heat * 0.62));
  }
`

function createGeometry() {
  const columns = 150
  const rows = 46
  const count = columns * rows
  const positions = new Float32Array(count * 3)
  const scales = new Float32Array(count)

  let index = 0
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = (column / (columns - 1) - 0.5) * 18
      const z = (row / (rows - 1) - 0.5) * 8
      positions[index * 3] = x
      positions[index * 3 + 1] = 0
      positions[index * 3 + 2] = z
      scales[index] = 0.55 + Math.random() * 0.9
      index += 1
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
  return geometry
}

export default function SignalField3D({ onReady, onFail }: SignalField3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const readyRef = useRef(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      })
    } catch {
      onFail()
      return
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60)
    camera.position.set(0, 3.4, 11.5)
    camera.lookAt(0, 0.1, 0)

    const geometry = createGeometry()
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uScroll: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const points = new THREE.Points(geometry, material)
    scene.add(points)

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.className = 'signal3d__canvas'
    mount.appendChild(renderer.domElement)

    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
    let frame = 0
    let visible = true
    let stopped = false
    let width = 1
    let height = 1

    const resize = () => {
      const rect = mount.getBoundingClientRect()
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)
    resize()

    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect()
      pointer.targetX = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.targetY = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
    }

    const onPointerLeave = () => {
      pointer.targetX = 0
      pointer.targetY = 0
    }

    mount.addEventListener('pointermove', onPointerMove)
    mount.addEventListener('pointerleave', onPointerLeave)

    const visibility = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true
    })
    visibility.observe(mount)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') start()
    }

    const onContextLost = (event: Event) => {
      event.preventDefault()
      stop()
      onFail()
    }

    renderer.domElement.addEventListener('webglcontextlost', onContextLost)
    document.addEventListener('visibilitychange', onVisibility)

    const start = () => {
      if (stopped || frame) return
      frame = window.requestAnimationFrame(loop)
    }

    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
    }

    const loop = (now: number) => {
      frame = 0
      if (stopped) return

      if (visible && document.visibilityState === 'visible') {
        pointer.x += (pointer.targetX - pointer.x) * 0.06
        pointer.y += (pointer.targetY - pointer.y) * 0.06

        const scroll = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight)))
        material.uniforms.uTime.value = now * 0.001
        material.uniforms.uPointer.value.set(pointer.x, pointer.y)
        material.uniforms.uScroll.value = scroll

        scene.rotation.y = pointer.x * 0.055
        scene.rotation.x = -0.04 + scroll * 0.09 - pointer.y * 0.035
        scene.position.y = -scroll * 0.5

        renderer.render(scene, camera)

        if (!readyRef.current) {
          readyRef.current = true
          onReady()
        }
      }

      frame = window.requestAnimationFrame(loop)
    }

    start()

    return () => {
      stopped = true
      stop()
      resizeObserver.disconnect()
      visibility.disconnect()
      mount.removeEventListener('pointermove', onPointerMove)
      mount.removeEventListener('pointerleave', onPointerLeave)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      document.removeEventListener('visibilitychange', onVisibility)
      geometry.dispose()
      material.dispose()
      if (!renderer.getContext().isContextLost()) renderer.forceContextLoss()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [onFail, onReady])

  return <div ref={mountRef} className="signal3d" aria-hidden="true" />
}
