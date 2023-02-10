import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import {gsap} from 'gsap'
import CANNON from 'cannon' 
import { DoubleSide } from 'three'
import Terrain from './terrain'

import vertexShader from './shaders/grass/vertex.glsl'
import fragmentShader from './shaders/grass/fragment.glsl'

let childrenScene

var keyboard = new THREEx.KeyboardState();
/**
 * Base
 */
// Debug
const debugObject = {}
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
				scene.fog = new THREE.Fog( 0x000000, 150, 400 );
                

/**
 * Physics
 */
//  const world = new CANNON.World()
//  world.gravity.set(0, - 9.82, 0)
//  const sphereShape = new CANNON.Sphere(0.5)

//  const sphereBody = new CANNON.Body({
//     mass: 1,
//     position: new CANNON.Vec3(0, 3, 0),
//     shape: sphereShape
// })

// world.addBody(sphereBody)



// Floor
const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body()
floorBody.mass = 0
floorBody.addShape(floorShape)
floorBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(- 1, 0, 0),
    Math.PI * 0.5
)
// world.addBody(floorBody)

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()

// Grass
const grassColorTexture = textureLoader.load('/textures/grass01/color.jpg')
const grassAmbientOcclusionTexture = textureLoader.load('/textures/grass01/ambientOcclusion.jpg')
const grassNormalTexture = textureLoader.load('/textures/grass01/normal.jpg')
const grassRoughnessTexture = textureLoader.load('/textures/grass01/roughness.jpg')
const grassHeightTexture = textureLoader.load('/textures/grass01/height.png')

grassColorTexture.repeat.set(20,20)
grassAmbientOcclusionTexture.repeat.set(20,20)
grassNormalTexture.repeat.set(20,20)
grassRoughnessTexture.repeat.set(20,20)
grassHeightTexture.repeat.set(20,20)

grassColorTexture.wrapS = THREE.RepeatWrapping
grassAmbientOcclusionTexture.wrapS = THREE.RepeatWrapping
grassNormalTexture.wrapS = THREE.RepeatWrapping
grassRoughnessTexture.wrapS = THREE.RepeatWrapping
grassHeightTexture.wrapS = THREE.RepeatWrapping

grassColorTexture.wrapT = THREE.RepeatWrapping
grassAmbientOcclusionTexture.wrapT = THREE.RepeatWrapping
grassNormalTexture.wrapT = THREE.RepeatWrapping
grassRoughnessTexture.wrapT = THREE.RepeatWrapping
grassHeightTexture.wrapT = THREE.RepeatWrapping


// Load the heightmap image
const heightMap = textureLoader.load("/textures/landscape/uluru-heightmap.png");
// Apply some properties to ensure it renders correctly
heightMap.encoding = THREE.sRGBEncoding;
heightMap.wrapS = THREE.RepeatWrapping;
heightMap.wrapT = THREE.RepeatWrapping;
heightMap.anisotropy = 16;

/**
 * Models
 */
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

const wolf = new THREE.Group()
wolf.name = 'Wolf'
wolf.position.set(0, 0.35, 0)
scene.add(wolf)

let mixer = null
let actions = {}
gltfLoader.load(
    '/models/Wolf/scene.gltf',
    (gltf) => {


        childrenScene = gltf.scene.children[0].children[0].children[0].children[0].children[0];
        const planeMesh = childrenScene.children.find((child) => child.name === 'Plane')


        childrenScene
        .remove(planeMesh)
        planeMesh.children[0].geometry.dispose()
        planeMesh.children[0].material.dispose()
        

        console.log('animation: ', gltf);
        mixer = new THREE.AnimationMixer(gltf.scene)

        actions.run = mixer.clipAction(gltf.animations[0])
        actions.walk = mixer.clipAction(gltf.animations[1])
        actions.backwards = mixer.clipAction(gltf.animations[1])
        actions.creep = mixer.clipAction(gltf.animations[2])
        actions.idle = mixer.clipAction(gltf.animations[3])
        actions.site = mixer.clipAction(gltf.animations[4])
        
        actions.current = actions.idle
        actions.current.play()

        // mixer = new THREE.AnimationMixer(gltf.scene)
        // const action = mixer.clipAction(gltf.animations[0])

        // action.play()

        const children = [...childrenScene.children]
        for(const child of children)
        {
            if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
            {
                // ...

                child.receiveShadow = true
                child.castShadow = true
                // child.scale.set(0.025, 0.025, 0.025)
            }
            child.position.set(0, 0, 0)
            child.rotation.y = Math.PI
            wolf.add(child)
        }


    }
)

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(1024, 1024, 256, 256),
    new THREE.ShaderMaterial({
        uniforms: {
            // Feed the heightmap
            bumpTexture: { value: heightMap},
            // Feed the scaling constant for the heightmap
            bumpScale: {value: 50},
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: DoubleSide
    })
    // new THREE.MeshStandardMaterial({ 
    //     map: grassColorTexture,
    //     transparent: true,
    //     aoMap: grassAmbientOcclusionTexture,
    //     normalMap: grassNormalTexture,
    //     roughnessMap: grassRoughnessTexture,
    //     displacementMap: grassHeightTexture,
    //     displacementScale: 0.1,
    // })
)
floor.scale.set(1/1024 * 15, 1/1024 * 15, 1/1024* 15)
floor.receiveShadow = true
floor.position.set(0,0,0)
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024*4, 1024*4)
directionalLight.shadow.camera.far = 700
directionalLight.shadow.camera.left = - 350
directionalLight.shadow.camera.top = 200
directionalLight.shadow.camera.right = 350
directionalLight.shadow.camera.bottom = - 200
directionalLight.position.set(20, 20, 20)
scene.add(directionalLight)

// const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
// scene.add(directionalLightCameraHelper)


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.001, 1000)
// // camera lookAt wolf position
scene.add( camera );

camera.position.set(0.5,0.5,0.5);
camera.near = 0.0001
camera.far = 100000000
// camera.lookAt(scene.position);	

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.75, 2.1)
controls.enableDamping = true
controls.update()

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.outputEncoding = THREE.sRGBEncoding
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap


debugObject.clearColor = '#95c4d0'
renderer.setClearColor(debugObject.clearColor)
gui.addColor(debugObject, 'clearColor')
    .onChange(() => {
        renderer.setClearColor(debugObject.clearColor)
    })


// EVENTS
// THREEx.WindowResize(renderer, camera);
// THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });

// TERRAIN
let terrainM;
Terrain.fromImage('images/terrain.png').then(function(terrain) {
    terrainM = terrain;
    var loader = new THREE.TextureLoader();

    var texture = loader.load('images/texture.png');

    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(terrain.width / 100, terrain.height / 100);

    let terainMesh = terrain.build(texture)
    scene.add(terainMesh);

    // Scale terrain peaks
    terrain.mesh.scale.y = 50.0;
    terrain.mesh.position.y = -50;

    console.log('terrain.width', terrain.width); 
    console.log('terrain.height', terrain.height); 
    console.log('wolf position:', wolf.position);
    // Start in middle of terrain
    wolf.position.x = terrain.width / 2;
    wolf.position.z = terrain.height / 2;

    console.log(terrain.mesh.position);
    wolf.position.y = terrain.getHeightAt(terrain.width / 2, terrain.height / 2) + 50
    console.log('wolf.position.y:' , wolf.position.y);

    controls.update()

    // app.start();
}).catch(function(e) {
    throw e;
});

console.log('terrainM', terrainM);
/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

console.log(scene);
console.log(wolf);

// var xSpeed = 0.01;
// var ySpeed = 0.02;


let animation = {}
animation.play = (name, keyCode) => {
    const oldAction = actions.current
    const newAction = actions[name]
    if(oldAction !== newAction) {
        newAction.reset()
        newAction.play()
        newAction.crossFadeFrom(oldAction, 0.5)
    
        actions.current = newAction
    }
}

let moveDistance

const tick = () =>
{
    var delta = clock.getDelta(); // seconds.
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime
    moveDistance = 30 * delta; // 100 pixels per second

    // Update mixer
    if(mixer) {
        mixer.update(deltaTime)
    }


    // Update physics
    // world.step(1 / 60, deltaTime, 3)
    // console.log(sphereBody.position.y)
    // wolf.position.x = sphereBody.position.x
    // wolf.position.y = sphereBody.position.y
    // wolf.position.z = sphereBody.position.z

    // Update controls
    controls.update()


	// move forwards/backwards/left/right
    if(actions) {
        if ( keyboard.pressed("shift+W") ) {
            wolf.translateZ( -moveDistance );
            actions.current.timeScale = 1;
            animation.play('run')
        }
        else if ( keyboard.pressed("W") ) {
            wolf.translateZ( -moveDistance / 4 );
            actions.current.timeScale = 1;
            animation.play('walk')
        }
        else if ( keyboard.pressed("S") ) {
            wolf.translateZ(  moveDistance / 4 );
            actions.current.timeScale = - 1;
            animation.play('walk')
        } else {
            animation.play('idle')
        }

        if(keyboard.pressed("space")) {
            gsap.to(wolf.position, {y: 1, duration: 0.4} )
            gsap.to(wolf.position, {y: 0.35, duration: 0.3, delay: 0.4})
        }

        var rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second
        // rotate left/right/up/down
        var rotation_matrix = new THREE.Matrix4().identity();
        if ( keyboard.pressed("A") )
        wolf.rotateOnAxis( new THREE.Vector3(0,1,0), rotateAngle);
        if ( keyboard.pressed("D") )
        wolf.rotateOnAxis( new THREE.Vector3(0,1,0), -rotateAngle);
        
        if ( keyboard.pressed("Z") )
        {
            wolf.position.set(0,0.35,0);
            wolf.rotation.set(0,0,0);
        }

        var relativeCameraOffset = new THREE.Vector3(0,0.5,2);
        
        if(terrainM != null) {

            wolf.position.y = terrainM.getHeightAt(wolf.position.x, wolf.position.z) * 50 - 49
            console.log('wolf.position.y:' , wolf.position);
        }

        // var cameraOffset = relativeCameraOffset.applyMatrix4( wolf.matrixWorld );

        camera.position.x = wolf.position.x - 1;
        camera.position.y = wolf.position.y + 1;
        camera.position.z = wolf.position.z - 1;
        camera.lookAt( wolf.position );
    }


    // Render
    renderer.render(scene, camera)
    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()