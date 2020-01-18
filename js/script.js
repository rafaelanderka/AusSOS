var camera
var scene
var renderer;
var geometry
var material;
var earthLandMesh;
var earthWaterMesh;
var requestAnimationFrame;
var viewFocus;
var viewRho;
var viewTheta;
var viewPhi;
var viewOmegaTheta;
var viewOmegaPhi;
var t;
var canvas;
var mousePos;
var mouseDelta;
var canvasPos;
var isRotating;
var directionalLight;
let fireData = {};

// Global constants
var viewPhiMax = 3.04;
var viewPhiMin = 0.1;
var lightThetaOffset = -0.9;
var lightPhiOffset = 0.6;

function init() {
    // Initialise time
    t = 0;

    // Initialise view
    viewFocus = new THREE.Vector3(0, 0, 0);
    viewRho = 7;
    viewTheta = 0;
    viewPhi = Math.PI / 2;
    viewOmegaTheta = 0;
    viewOmegaPhi = 0;

    // Set up camera
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
    camera.updateMatrixWorld();
    updateCameraPosition();

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
        '/models/earth_land_hq.obj',
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
        '/models/earth_water_hq.obj',
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

    directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    var lightPos = transformSphericalToView(viewRho, viewTheta + lightThetaOffset, viewPhi + lightPhiOffset);
    directionalLight.position.set(lightPos.y, lightPos.z, lightPos.x);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Set up canvas
    canvas = document.getElementsByTagName("canvas")[0];
    setCanvasPos();

    // Set up mouse controls
    canvas.addEventListener("mousedown", function(){ isRotating = true; }, false);
    canvas.addEventListener("mouseup", function(){ isRotating = false; }, false);
    canvas.addEventListener("mousemove", setMousePos, false);
    mousePos = {x: 0, y: 0};
    mouseDelta = {x: 0, y: 0};
    isRotating = false;

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
    setCanvasPos();
    if (isRotating) {
        viewOmegaTheta = mouseDelta.x * 0.005;
        viewOmegaPhi = mouseDelta.y * 0.005;
    }
    updateView();
    updateCameraPosition();
    updateLights();
    renderer.render(scene, camera);
    requestAnimationFrame(update);
}

function updateLights() {
    var lightPos = transformSphericalToView(viewRho, viewTheta + lightThetaOffset, viewPhi + lightPhiOffset);
    directionalLight.position.set(lightPos.y, lightPos.z, lightPos.x);
    scene.add(directionalLight);
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

            let total = 0;
            for (const feature of fireData["features"]) {
                let sizeString = feature["properties"]["description"].match(/SIZE: [0-9]*/gm)[0];
                sizeString = sizeString.slice(6);
                total += parseInt(sizeString);
            }
        })
        .catch(function (error) {
            console.log(error);
        });
}

function sphericalToCartesian(rho, theta, phi) {
    var x = rho * Math.sin(theta) * Math.cos(phi);
    var y = rho * Math.sin(theta) * Math.sin(phi);
    var z = rho * Math.cos(theta);
    return {
        x: x,
        y: y,
        z: z
    };
}

function transformSphericalToView(rho, theta, phi) {
    var centeredTransform = sphericalToCartesian(rho, theta, phi);
    return new THREE.Vector3(centeredTransform.x + viewFocus.x, centeredTransform.y + viewFocus.y,
                             centeredTransform.z + viewFocus.z);
}

function updateCameraPosition() {
    var worldPosition = transformSphericalToView(viewRho, viewPhi, viewTheta);
    camera.position.set(worldPosition.y, worldPosition.z, worldPosition.x);
    camera.lookAt(viewFocus);
}

function updateView() {
    if (viewPhi + viewOmegaPhi > viewPhiMax) {
        viewPhi = viewPhiMax;
    } else if (viewPhi + viewOmegaPhi < viewPhiMin) {
        viewPhi = viewPhiMin;
    } else {
        viewPhi = viewPhi + viewOmegaPhi;
    }

    viewTheta = (viewTheta + viewOmegaTheta) % (2 * Math.PI);
    viewOmegaPhi = viewOmegaPhi * 0.95;
    viewOmegaTheta = viewOmegaTheta * 0.95;
}

function setMousePos(e) {
    prevMousePos = mousePos;
    mousePos = {
        x: scaleByPixelRatio(e.clientX - canvasPos.x),
        y: scaleByPixelRatio(e.clientY - canvasPos.y)
    };
    mouseDelta = {
        x: prevMousePos.x - mousePos.x,
        y: prevMousePos.y - mousePos.y
    }
    console.log(mouseDelta);
}

function scaleByPixelRatio (input) {
    var pixelRatio = window.devicePixelRatio || 1;
    return Math.floor(input * pixelRatio);
}

function setCanvasPos() {
    canvasPos = getPosition(canvas);
}

// Helper function to get an element's exact position
function getPosition(el) {
    var xPos = 0;
    var yPos = 0;
    
    while (el) {
        if (el.tagName == "BODY") {
            // Deal with browser quirks with body/window/document and page scroll
            var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
            var yScroll = el.scrollTop || document.documentElement.scrollTop;
            
            xPos += (el.offsetLeft - xScroll + el.clientLeft);
            yPos += (el.offsetTop - yScroll + el.clientTop);
        } else {
            // For all other non-BODY elements
            xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
            yPos += (el.offsetTop - el.scrollTop + el.clientTop);
        }
        
        el = el.offsetParent;
    }
    return {
        x: xPos,
        y: yPos
    };
}

window.onload = init;

getFireData();
