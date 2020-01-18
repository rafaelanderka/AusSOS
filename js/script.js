var camera
var scene
var renderer;
var geometry
var material;
var earthLandMesh;
var earthWaterMesh;
var requestAnimationFrame;
var t;

function init() {
    // Initialise time
    t = 0;

    // Set up camera
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
    camera.position.z = 2;

    // Set up scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xfff9e6 ); // UPDATED

    // Set up renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    
    // Set up materials
    materialEarthLand = new THREE.MeshLambertMaterial( { color: 0x89ff4a } );
    materialEarthWater = new THREE.MeshLambertMaterial( { color: 0x4aa1ff } );
    
    // Load OBJs
    var loader = new THREE.OBJLoader();

    // Load land
    loader.load(
        // resource URL
        '/models/earth_land.obj',
        // called when resource is loaded
        function ( object ) {
            earthLandMesh = object;
            object.traverse( function( child ) {
                console.log(child);
                if ( child instanceof THREE.Mesh ) {
                    console.log(child);
                    child.material = materialEarthLand;
                }
            } );
            scene.add( object );
        },
        // called when loading is in progresses
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function ( error ) {
            console.log( 'An error happened' );
        }
    );

    // Load water
    loader.load(
        // resource URL
        '/models/earth_water.obj',
        // called when resource is loaded
        function ( object ) {
            earthWaterMesh = object;
            object.traverse( function( child ) {
                console.log(child);
                if ( child instanceof THREE.Mesh ) {
                    console.log(child);
                    child.material = materialEarthWater;
                }
            } );
            scene.add( object );
            console.log("hi");
        },
        // called when loading is in progresses
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function ( error ) {
            console.log( 'An error happened' );
        }
    );

    // Set up scene lighting
    var ambientLight = new THREE.AmbientLight(0x777777);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(-1, 2, 1.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Set up mouse controls
    var controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.update();

    // Set up requestAnimationFrame
    requestAnimationFrame = window.requestAnimationFrame || 
                            window.mozRequestAnimationFrame || 
                            window.webkitRequestAnimationFrame || 
                            window.msRequestAnimationFrame;
    
    // Start update loop
    update();
}

function redirectDonate() {
    window.location.href = "https://www.wwf.org.au/get-involved/bushfire-emergency#gs.ta7jim";
}

function update() {
    requestAnimationFrame(update);
    
    renderer.render(scene, camera);
}

function getFireData() {
    const proxyurl = "https://cors-anywhere.herokuapp.com/";
    const url = "https://www.rfs.nsw.gov.au/feeds/majorIncidents.json"; // site that doesn’t send Access-Control-*

    fetch(proxyurl + url)
        .then(function (response) {
            return response.text();
        })
        .then(function (text) {
            fireData = JSON.parse(text);
        })
        .catch(function (error) {
            console.log(error);
        });
}

let fireData = {};

window.onload = init;
getFireData();
