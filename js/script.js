var camera
var scene
var renderer;
var geometry
var material;
var earthLandMesh;
var earthWaterMesh;
var t;

function init() {
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
    camera.position.z = 2;

    scene = new THREE.Scene();

    //geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    materialEarthLand = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    materialEarthWater = new THREE.MeshBasicMaterial( { color: 0x0000ff } );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // Load earth
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
    
    scene.background = new THREE.Color( 0x222222 ); // UPDATED
    t = 0;
    
    // Create donate button
    var button = document.createElement("button");
    button.innerHTML = "Donate.";
    
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(button);

    button.addEventListener('click', redirectDonate(), false);

    animate();
}

function drawline(x1, y1, x2, y2) {
}

function redirectDonate() {
    window.location.href = "https://www.wwf.org.au/get-involved/bushfire-emergency#gs.ta69pg";
}

function animate() {
    requestAnimationFrame( animate );

    earthLandMesh.rotation.x = Math.PI * (1 + Math.sin(t));
    earthLandMesh.rotation.y += 0.01;
    t = (t + 0.005) % (2 * Math.PI);

    renderer.render( scene, camera );
}

window.onload = init;
