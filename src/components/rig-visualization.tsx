"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { AlertCircle } from "lucide-react"

// Update the interface to include game over properties
interface RigVisualizationProps {
  simulationEngine: any
  isRunning: boolean
  isGameOver?: boolean
  gameOverReason?: string
}

// Update the component definition to include the new props
export default function RigVisualization({
  simulationEngine,
  isRunning,
  isGameOver = false,
  gameOverReason = "",
}: RigVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Add these state variables after the existing ones
  const [blowoutAnimation, setBlowoutAnimation] = useState(false)
  const [collapseAnimation, setCollapseAnimation] = useState(false)
  const [h2sAnimation, setH2sAnimation] = useState(false)

  // Add this useEffect to handle game over animations
  useEffect(() => {
    if (isGameOver && gameOverReason) {
      if (gameOverReason.includes("Blowout") || gameOverReason.includes("Gas Influx")) {
        setBlowoutAnimation(true)
      } else if (gameOverReason.includes("Collapse") || gameOverReason.includes("Stuck Pipe")) {
        setCollapseAnimation(true)
      } else if (gameOverReason.includes("H2S")) {
        setH2sAnimation(true)
      }
    } else {
      setBlowoutAnimation(false)
      setCollapseAnimation(false)
      setH2sAnimation(false)
    }
  }, [isGameOver, gameOverReason])

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    // Create scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a1929)
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.set(15, 15, 15)
    cameraRef.current = camera

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controlsRef.current = controls

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 1)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(10, 20, 10)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Add grid
    const gridHelper = new THREE.GridHelper(50, 50, 0x555555, 0x333333)
    scene.add(gridHelper)

    // Create drilling rig
    createDrillingRig(scene)

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return

      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    window.addEventListener("resize", handleResize)

    // Animation loop
    const animate = () => {
      if (!controlsRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return

      controlsRef.current.update()
      rendererRef.current.render(sceneRef.current, cameraRef.current)

      // Update rig based on simulation data if running
      if (isRunning && simulationEngine) {
        updateRigVisualization(sceneRef.current, simulationEngine)
      }

      // Handle game over animations
      if (isGameOver) {
        if (blowoutAnimation) {
          const blowoutAnim = sceneRef.current.getObjectByName("blowoutAnimation")
          if (!blowoutAnim) {
            createBlowoutAnimation(sceneRef.current)
          } else {
            // Animate existing blowout
            const gasParticles = blowoutAnim.children[0] as THREE.Points
            const fireParticles = blowoutAnim.children[1] as THREE.Points

            if (gasParticles.geometry.attributes.position && fireParticles.geometry.attributes.position) {
              const gasPositions = gasParticles.geometry.attributes.position.array
              const firePositions = fireParticles.geometry.attributes.position.array

              for (let i = 0; i < gasPositions.length; i += 3) {
                // Move particles upward and outward
                gasPositions[i] *= 1.01
                gasPositions[i + 1] += 0.2
                gasPositions[i + 2] *= 1.01

                // Reset particles that go too high
                if (gasPositions[i + 1] > 30) {
                  gasPositions[i] = (Math.random() - 0.5) * 2
                  gasPositions[i + 1] = Math.random() * 5
                  gasPositions[i + 2] = (Math.random() - 0.5) * 2
                }

                // Similar for fire particles
                firePositions[i] *= 1.02
                firePositions[i + 1] += 0.3
                firePositions[i + 2] *= 1.02

                if (firePositions[i + 1] > 25) {
                  firePositions[i] = (Math.random() - 0.5) * 2
                  firePositions[i + 1] = Math.random() * 3
                  firePositions[i + 2] = (Math.random() - 0.5) * 2
                }
              }

              gasParticles.geometry.attributes.position.needsUpdate = true
              fireParticles.geometry.attributes.position.needsUpdate = true
            }
          }
        }

        if (collapseAnimation) {
          const collapseAnim = sceneRef.current.getObjectByName("collapseAnimation")
          if (!collapseAnim) {
            createCollapseAnimation(sceneRef.current)
          } else {
            // Animate existing collapse
            const debrisParticles = collapseAnim as THREE.Points

            if (debrisParticles.geometry.attributes.position) {
              const positions = debrisParticles.geometry.attributes.position.array

              for (let i = 0; i < positions.length; i += 3) {
                // Move debris inward to simulate collapse
                positions[i] *= 0.98
                positions[i + 2] *= 0.98

                // Add some random movement
                positions[i] += (Math.random() - 0.5) * 0.05
                positions[i + 1] += (Math.random() - 0.5) * 0.05
                positions[i + 2] += (Math.random() - 0.5) * 0.05
              }

              debrisParticles.geometry.attributes.position.needsUpdate = true
            }
          }
        }

        if (h2sAnimation) {
          const h2sAnim = sceneRef.current.getObjectByName("h2sAnimation")
          if (!h2sAnim) {
            createH2SAnimation(sceneRef.current)
          } else {
            // Animate existing H2S cloud
            const gasCloud = h2sAnim as THREE.Points

            if (gasCloud.geometry.attributes.position) {
              const positions = gasCloud.geometry.attributes.position.array

              for (let i = 0; i < positions.length; i += 3) {
                // Expand cloud slowly
                positions[i] *= 1.002
                positions[i + 1] += (Math.random() - 0.5) * 0.1
                positions[i + 2] *= 1.002

                // Reset particles that go too far
                const distance = Math.sqrt(positions[i] * positions[i] + positions[i + 2] * positions[i + 2])

                if (distance > 20) {
                  const angle = Math.random() * Math.PI * 2
                  const radius = Math.random() * 5
                  positions[i] = Math.cos(angle) * radius
                  positions[i + 1] = Math.random() * 10
                  positions[i + 2] = Math.sin(angle) * radius
                }
              }

              gasCloud.geometry.attributes.position.needsUpdate = true
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()
    setIsLoaded(true)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
    }
  }, [])

  // Update visualization when simulation state changes
  useEffect(() => {
    if (isRunning && sceneRef.current && simulationEngine) {
      updateRigVisualization(sceneRef.current, simulationEngine)
    }
  }, [isRunning, simulationEngine])

  // Create drilling rig components
  const createDrillingRig = (scene: THREE.Scene) => {
    // Ground/base
    const groundGeometry = new THREE.BoxGeometry(30, 0.5, 30)
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.position.y = -0.25
    ground.receiveShadow = true
    scene.add(ground)

    // Derrick structure
    const derrickGroup = new THREE.Group()
    derrickGroup.position.set(0, 10, 0)
    scene.add(derrickGroup)

    // Derrick base
    const baseGeometry = new THREE.BoxGeometry(8, 1, 8)
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = -9.5
    base.castShadow = true
    base.receiveShadow = true
    derrickGroup.add(base)

    // Derrick legs
    const legGeometry = new THREE.BoxGeometry(0.5, 20, 0.5)
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 })

    const createLeg = (x: number, z: number) => {
      const leg = new THREE.Mesh(legGeometry, legMaterial)
      leg.position.set(x, 0, z)
      leg.castShadow = true
      leg.receiveShadow = true
      derrickGroup.add(leg)
    }

    createLeg(3, 3)
    createLeg(-3, 3)
    createLeg(3, -3)
    createLeg(-3, -3)

    // Derrick cross beams
    const createCrossBeam = (y: number, rotationY = 0) => {
      const beamGeometry = new THREE.BoxGeometry(8.5, 0.3, 0.3)
      const beam = new THREE.Mesh(beamGeometry, legMaterial)
      beam.position.y = y
      beam.rotation.y = rotationY
      beam.castShadow = true
      derrickGroup.add(beam)
    }

    for (let i = -8; i <= 8; i += 4) {
      createCrossBeam(i)
      createCrossBeam(i, Math.PI / 2)
      createCrossBeam(i, Math.PI / 4)
      createCrossBeam(i, -Math.PI / 4)
    }

    // Drill string
    const drillStringGeometry = new THREE.CylinderGeometry(0.2, 0.2, 20, 16)
    const drillStringMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
    const drillString = new THREE.Mesh(drillStringGeometry, drillStringMaterial)
    drillString.position.y = -10
    drillString.castShadow = true
    drillString.name = "drillString"
    scene.add(drillString)

    // Drill bit
    const drillBitGeometry = new THREE.ConeGeometry(0.4, 1, 16)
    const drillBitMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 })
    const drillBit = new THREE.Mesh(drillBitGeometry, drillBitMaterial)
    drillBit.position.y = -20.5
    drillBit.rotation.x = Math.PI
    drillBit.castShadow = true
    drillBit.name = "drillBit"
    scene.add(drillBit)

    // Top drive
    const topDriveGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const topDriveMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 })
    const topDrive = new THREE.Mesh(topDriveGeometry, topDriveMaterial)
    topDrive.position.y = 9
    topDrive.castShadow = true
    topDrive.name = "topDrive"
    scene.add(topDrive)

    // BOP stack
    const bopGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 16)
    const bopMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const bop = new THREE.Mesh(bopGeometry, bopMaterial)
    bop.position.y = -0.5
    bop.castShadow = true
    bop.name = "bop"
    scene.add(bop)

    // Mud pits
    const mudPitGeometry = new THREE.BoxGeometry(5, 1, 3)
    const mudPitMaterial = new THREE.MeshStandardMaterial({ color: 0x0066aa })
    const mudPit = new THREE.Mesh(mudPitGeometry, mudPitMaterial)
    mudPit.position.set(8, 0, 5)
    mudPit.castShadow = true
    mudPit.receiveShadow = true
    mudPit.name = "mudPit"
    scene.add(mudPit)

    // Mud pumps
    const mudPumpGeometry = new THREE.BoxGeometry(2, 1.5, 1.5)
    const mudPumpMaterial = new THREE.MeshStandardMaterial({ color: 0x00aa00 })
    const mudPump = new THREE.Mesh(mudPumpGeometry, mudPumpMaterial)
    mudPump.position.set(8, 0.5, 0)
    mudPump.castShadow = true
    mudPump.receiveShadow = true
    mudPump.name = "mudPump"
    scene.add(mudPump)

    // Choke manifold
    const chokeGeometry = new THREE.BoxGeometry(1.5, 1, 1.5)
    const chokeMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaa00 })
    const choke = new THREE.Mesh(chokeGeometry, chokeMaterial)
    choke.position.set(-5, 0, 0)
    choke.castShadow = true
    choke.receiveShadow = true
    choke.name = "choke"
    scene.add(choke)

    // Formation layers (underground)
    const formationGroup = new THREE.Group()
    formationGroup.position.y = -25
    scene.add(formationGroup)
    formationGroup.name = "formation"

    const createFormationLayer = (depth: number, thickness: number, color: number) => {
      const layerGeometry = new THREE.CylinderGeometry(15, 15, thickness, 32)
      const layerMaterial = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      })
      const layer = new THREE.Mesh(layerGeometry, layerMaterial)
      layer.position.y = -depth - thickness / 2
      formationGroup.add(layer)
      return layer
    }

    createFormationLayer(0, 10, 0xd2b48c).name = "layer1" // Topsoil
    createFormationLayer(10, 20, 0x8b4513).name = "layer2" // Shale
    createFormationLayer(30, 16, 0xf5deb3).name = "layer3" // Reservoir
    createFormationLayer(46, 10, 0xa9a9a9).name = "layer4" // Overpressured Zone

    // Wellbore
    const wellboreGeometry = new THREE.CylinderGeometry(0.5, 0.5, 100, 16)
    const wellboreMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3,
    })
    const wellbore = new THREE.Mesh(wellboreGeometry, wellboreMaterial)
    wellbore.position.y = -50
    wellbore.name = "wellbore"
    scene.add(wellbore)
  }

  // Update rig visualization based on simulation data
  const updateRigVisualization = (scene: THREE.Scene, simulationEngine: any) => {
    if (!simulationEngine) return

    try {
      const data = simulationEngine.getCurrentData()
      if (!data) return

      // Update drill string position based on bit depth
      const drillString = scene.getObjectByName("drillString")
      const drillBit = scene.getObjectByName("drillBit")
      const topDrive = scene.getObjectByName("topDrive")

      if (drillString && drillBit && topDrive && data.bitDepth !== undefined) {
        const maxDepth = 20
        const normalizedDepth = Math.min((data.bitDepth / 10000) * maxDepth, maxDepth)

        // Update drill string
        drillString.position.y = -normalizedDepth / 2
        drillString.scale.y = normalizedDepth / 20

        // Update drill bit position
        drillBit.position.y = -normalizedDepth

        // Update top drive position
        const topDriveHeight = 9 - (normalizedDepth / maxDepth) * 5
        topDrive.position.y = topDriveHeight
      }

      // Update BOP status
      const bop = scene.getObjectByName("bop")
      if (bop && data.bopStatus !== undefined) {
        const bopMaterial = (bop as THREE.Mesh).material as THREE.MeshStandardMaterial
        bopMaterial.color.set(data.bopStatus === "open" ? 0x00ff00 : 0xff0000)
      }

      // Update mud pump activity
      const mudPump = scene.getObjectByName("mudPump")
      if (mudPump && data.pumpPressure !== undefined) {
        const mudPumpMaterial = (mudPump as THREE.Mesh).material as THREE.MeshStandardMaterial
        const normalizedPressure = Math.min(data.pumpPressure / 5000, 1)
        mudPumpMaterial.color.setRGB(1 - normalizedPressure, normalizedPressure, 0)
      }

      // Update mud pit level
      const mudPit = scene.getObjectByName("mudPit")
      if (mudPit && data.pitLevel !== undefined) {
        const mudPitMaterial = (mudPit as THREE.Mesh).material as THREE.MeshStandardMaterial
        const normalizedLevel = Math.min(data.pitLevel / 100, 1)
        mudPitMaterial.color.setRGB(0, 0.4 + normalizedLevel * 0.6, 0.6 + normalizedLevel * 0.4)

        // Adjust mud pit height based on level
        mudPit.scale.y = 0.5 + normalizedLevel
        mudPit.position.y = normalizedLevel / 2
      }

      // Update choke position
      const choke = scene.getObjectByName("choke")
      if (choke && data.chokePosition !== undefined) {
        const chokeMaterial = (choke as THREE.Mesh).material as THREE.MeshStandardMaterial
        const normalizedChoke = data.chokePosition / 100
        chokeMaterial.color.setRGB(normalizedChoke, 1 - normalizedChoke, 0)
      }

      // Update formation visualization based on events
      if (data.events && data.events.length > 0) {
        const formation = scene.getObjectByName("formation")
        if (formation) {
          // Handle kick events
          const kickEvent = data.events.find((e: any) => e.type === "kick")
          if (kickEvent) {
            const kickLayer = formation.getObjectByName(`layer${kickEvent.layer}`)
            if (kickLayer) {
              const material = (kickLayer as THREE.Mesh).material as THREE.MeshStandardMaterial
              material.color.set(0xff0000)
              material.emissive.set(0xff0000)
              material.emissiveIntensity = 0.3
            }
          }

          // Handle lost circulation events
          const lostCircEvent = data.events.find((e: any) => e.type === "lostCirculation")
          if (lostCircEvent) {
            const lostCircLayer = formation.getObjectByName(`layer${lostCircEvent.layer}`)
            if (lostCircLayer) {
              const material = (lostCircLayer as THREE.Mesh).material as THREE.MeshStandardMaterial
              material.color.set(0x0000ff)
              material.opacity = 0.5
            }
          }
        }
      }

      // Visualize lost circulation
      if (data.events && data.events.some((e) => e.type === "lostCirculation" || e.type === "severeLostCirculation")) {
        // Create or update lost circulation visualization
        let lostCircViz = scene.getObjectByName("lostCirculation")

        if (!lostCircViz) {
          // Create particles to represent lost mud
          const particleGeometry = new THREE.BufferGeometry()
          const particleCount = 100
          const positions = new Float32Array(particleCount * 3)

          for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3
            positions[i3] = (Math.random() - 0.5) * 10
            positions[i3 + 1] = -Math.random() * 50 - 20
            positions[i3 + 2] = (Math.random() - 0.5) * 10
          }

          particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

          const particleMaterial = new THREE.PointsMaterial({
            color: 0x8b4513,
            size: 0.5,
            transparent: true,
            opacity: 0.8,
          })

          lostCircViz = new THREE.Points(particleGeometry, particleMaterial)
          lostCircViz.name = "lostCirculation"
          scene.add(lostCircViz)
        }

        // Animate the particles to show mud flowing away
        const positions = (lostCircViz as THREE.Points).geometry.attributes.position.array
        for (let i = 0; i < positions.length; i += 3) {
          // Move particles outward from wellbore
          const x = positions[i]
          const z = positions[i + 2]
          const distance = Math.sqrt(x * x + z * z)

          if (distance > 15) {
            // Reset particle to near wellbore
            positions[i] = (Math.random() - 0.5) * 2
            positions[i + 1] = -Math.random() * 50 - 20
            positions[i + 2] = (Math.random() - 0.5) * 2
          } else {
            // Move particle outward
            const angle = Math.atan2(z, x)
            positions[i] += Math.cos(angle) * 0.1
            positions[i + 2] += Math.sin(angle) * 0.1
          }
        }
        ;(lostCircViz as THREE.Points).geometry.attributes.position.needsUpdate = true
      } else {
        // Remove lost circulation visualization if not needed
        const lostCircViz = scene.getObjectByName("lostCirculation")
        if (lostCircViz) {
          scene.remove(lostCircViz)
        }
      }
    } catch (error) {
      console.error("Error updating rig visualization:", error)
    }
  }

  // Add this function to create blowout animation in the updateRigVisualization function
  const createBlowoutAnimation = (scene: THREE.Scene) => {
    // Remove existing animation if present
    const existingAnimation = scene.getObjectByName("blowoutAnimation")
    if (existingAnimation) {
      scene.remove(existingAnimation)
    }

    // Create particle system for blowout
    const particleCount = 500
    const particleGeometry = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      // Start particles at wellbore
      particlePositions[i3] = (Math.random() - 0.5) * 2
      particlePositions[i3 + 1] = Math.random() * 20 // Height above ground
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 2
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3))

    // Create materials for different particle types
    const gasMaterial = new THREE.PointsMaterial({
      color: 0xcccccc,
      size: 0.8,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    })

    const fireMaterial = new THREE.PointsMaterial({
      color: 0xff5500,
      size: 1.2,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    })

    // Create particle systems
    const gasParticles = new THREE.Points(particleGeometry.clone(), gasMaterial)
    const fireParticles = new THREE.Points(particleGeometry.clone(), fireMaterial)

    // Group particles
    const blowoutGroup = new THREE.Group()
    blowoutGroup.add(gasParticles)
    blowoutGroup.add(fireParticles)
    blowoutGroup.name = "blowoutAnimation"

    scene.add(blowoutGroup)

    // Add point light for fire effect
    const fireLight = new THREE.PointLight(0xff5500, 3, 50)
    fireLight.position.set(0, 2, 0)
    blowoutGroup.add(fireLight)

    // Animation function will be called in the main animation loop
    return blowoutGroup
  }

  // Add this function to create collapse animation
  const createCollapseAnimation = (scene: THREE.Scene) => {
    // Remove existing animation if present
    const existingAnimation = scene.getObjectByName("collapseAnimation")
    if (existingAnimation) {
      scene.remove(existingAnimation)
    }

    // Create debris particles
    const debrisCount = 200
    const debrisGeometry = new THREE.BufferGeometry()
    const debrisPositions = new Float32Array(debrisCount * 3)

    // Get wellbore position
    const wellbore = scene.getObjectByName("wellbore")
    let wellborePosition = new THREE.Vector3(0, -25, 0)
    if (wellbore) {
      wellborePosition = wellbore.position.clone()
    }

    for (let i = 0; i < debrisCount; i++) {
      const i3 = i * 3
      // Position debris around wellbore at various depths
      const angle = Math.random() * Math.PI * 2
      const radius = 0.5 + Math.random() * 2
      const depth = -10 - Math.random() * 40

      debrisPositions[i3] = Math.cos(angle) * radius
      debrisPositions[i3 + 1] = depth
      debrisPositions[i3 + 2] = Math.sin(angle) * radius
    }

    debrisGeometry.setAttribute("position", new THREE.BufferAttribute(debrisPositions, 3))

    const debrisMaterial = new THREE.PointsMaterial({
      color: 0x8b4513,
      size: 0.5,
      transparent: true,
      opacity: 0.9,
    })

    const debrisParticles = new THREE.Points(debrisGeometry, debrisMaterial)
    debrisParticles.name = "collapseAnimation"

    scene.add(debrisParticles)

    return debrisParticles
  }

  // Add this function to create H2S animation
  const createH2SAnimation = (scene: THREE.Scene) => {
    // Remove existing animation if present
    const existingAnimation = scene.getObjectByName("h2sAnimation")
    if (existingAnimation) {
      scene.remove(existingAnimation)
    }

    // Create green gas cloud
    const gasCount = 300
    const gasGeometry = new THREE.BufferGeometry()
    const gasPositions = new Float32Array(gasCount * 3)

    for (let i = 0; i < gasCount; i++) {
      const i3 = i * 3
      // Create a cloud around the wellbore
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 15
      const height = Math.random() * 10

      gasPositions[i3] = Math.cos(angle) * radius
      gasPositions[i3 + 1] = height
      gasPositions[i3 + 2] = Math.sin(angle) * radius
    }

    gasGeometry.setAttribute("position", new THREE.BufferAttribute(gasPositions, 3))

    const gasMaterial = new THREE.PointsMaterial({
      color: 0x00ff00, // Toxic green color
      size: 1.0,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    })

    const gasCloud = new THREE.Points(gasGeometry, gasMaterial)
    gasCloud.name = "h2sAnimation"

    scene.add(gasCloud)

    // Add eerie green light
    const h2sLight = new THREE.PointLight(0x00ff00, 2, 30)
    h2sLight.position.set(0, 5, 0)
    gasCloud.add(h2sLight)

    return gasCloud
  }

  // Update the return statement to include game over overlays
  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {isGameOver && gameOverReason.includes("Blowout") && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-50 z-10 animate-pulse">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-800">BLOWOUT</h3>
            <p className="mt-2">Uncontrolled flow of formation fluids to surface.</p>
            <p className="mt-2 font-semibold">All personnel must evacuate immediately!</p>
          </div>
        </div>
      )}

      {isGameOver && gameOverReason.includes("Collapse") && (
        <div className="absolute inset-0 flex items-center justify-center bg-amber-900 bg-opacity-50 z-10">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
            <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-amber-800">WELLBORE COLLAPSE</h3>
            <p className="mt-2">The wellbore has collapsed, trapping the drill string.</p>
            <p className="mt-2 font-semibold">Unable to circulate or retrieve equipment.</p>
          </div>
        </div>
      )}

      {isGameOver && gameOverReason.includes("H2S") && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-900 bg-opacity-50 z-10 animate-pulse">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
            <AlertCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-800">H2S EXPOSURE</h3>
            <p className="mt-2">Toxic hydrogen sulfide gas has been released.</p>
            <p className="mt-2 font-semibold">Don breathing apparatus and evacuate upwind immediately!</p>
          </div>
        </div>
      )}

      {simulationEngine && simulationEngine.getCurrentData().pitLevel === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-50 z-10">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-800">CRITICAL SITUATION</h3>
            <p className="mt-2">All drilling fluid has been lost. The wellbore is at risk of collapse.</p>
            <p className="mt-2 font-semibold">Drilling operations must stop immediately.</p>
          </div>
        </div>
      )}

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 bg-opacity-80">
          <div className="text-white text-xl">Loading 3D Visualization...</div>
        </div>
      )}
    </div>
  )
}
