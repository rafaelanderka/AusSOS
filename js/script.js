var camera
var scene
var renderer;
var raycaster;
var overlayMesh;
var requestAnimationFrame;
var viewFocus;
var viewRho;
var viewTheta;
var viewPhi;
var viewOmegaTheta;
var viewOmegaPhi;
var overlayTheta;
var overlayPhi;
var overlayOmegaTheta;
var overlayOmegaPhi;
var canvas;
var mousePos;
var mouseDelta;
var canvasPos;
var isRotating;
var isDragging;
var directionalLight;
var pointLight;
var isFirstTouch;
var pixelRatio;
let fireData = {};

// Global constants
var viewPhiMax = 3.04;
var viewPhiMin = 0.1;
var lightThetaOffset = 0;
var lightPhiOffset = 0;

function init() {
    // Initialise time
    t = 0;

    // Initialise pixel ratio
    pixelRatio = window.devicePixelRatio || 1;

    // Initialise view
    viewFocus = new THREE.Vector3(0, 0, 0);
    viewRho = 1;
    viewTheta = 0;
    viewPhi = Math.PI / 2;
    viewOmegaTheta = 0;
    viewOmegaPhi = 0;

    // Initialise overlay
    overlayTheta = 0;
    overlayPhi = Math.PI / 2;
    overlayOmegaTheta = 0;
    overlayOmegaPhi = 0;
    
    
    // Set up camera
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
    
    // Set up scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x18191D ); // UPDATED
    
    // Set up renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    
    // Set up canvas
    canvas = document.getElementsByTagName("canvas")[0];
    setCanvasPos();

    // Set up sphere
    let geometry = new THREE.SphereGeometry(0.5, 32, 32);
    let material = new THREE.MeshLambertMaterial();
    let earthMesh = new THREE.Mesh(geometry, material);
    scene.add(earthMesh)
    
    // Load Earth textures
    material.map = THREE.ImageUtils.loadTexture('images/Earth_Clouds_6k.jpg');
    material.emissiveMap = THREE.ImageUtils.loadTexture('images/Earth_Fire_6k.png');
    material.emissive = new THREE.Color(0xFF8877);

    // Plane that gets projected on Earth
    let overlayGeometry = new THREE.PlaneGeometry(0.1, 0.1, 10, 10);
    let overlayMaterial = new THREE.MeshPhongMaterial({
                color: 'blue'
    });
    overlayMesh = new THREE.Mesh(overlayGeometry, overlayMaterial);
    overlayMesh.material.side = THREE.DoubleSide;
    scene.add(overlayMesh)

    // Projection stuff
    for (var vertexIndex = 0; vertexIndex < overlayMesh.geometry.vertices.length; vertexIndex++) {
        var localVertex = overlayMesh.geometry.vertices[vertexIndex].clone();
        localVertex.z = 0.61;

        var directionVector = new THREE.Vector3();
        directionVector.subVectors(earthMesh.position, localVertex);
        directionVector.normalize();

        var ray = new THREE.Raycaster(localVertex, directionVector);

        var collisionResults = ray.intersectObject(earthMesh);

        if (collisionResults.length > 0) {
            overlayMesh.geometry.vertices[vertexIndex].z = collisionResults[0].point.z + 0.01;
        }
    }

    // IDK if we need this
    overlayMesh.geometry.verticesNeedUpdate = true;
    overlayMesh.geometry.normalsNeedUpdate = true;

    // Set up scene lighting
    let ambientLight = new THREE.AmbientLight(0x18191D);
    scene.add(ambientLight);
    /*
    directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    let lightPos = transformSphericalToView(viewRho, viewTheta + lightThetaOffset, viewPhi + lightPhiOffset);
    directionalLight.position.set(lightPos.y, lightPos.z, lightPos.x);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    */
    pointLight = new THREE.PointLight(0xFFFFFF, 0.5, 100)
    var lightPos = transformSphericalToView(viewRho, viewTheta + lightThetaOffset, viewPhi + lightPhiOffset);
    pointLight.position.set(0, 0, 0);
    updateLights();
    scene.add(pointLight);

    // Set up global raycaster
    raycaster = new THREE.Raycaster();

    
    // Set up mouse controls
    canvas.addEventListener("mousemove", setMousePos, false);
    canvas.addEventListener("mousedown", onClick, false);
    canvas.addEventListener("mouseup", function(){ isRotating = false; isDragging = false; }, false);
    mousePos = {x: 0, y: 0};
    mouseDelta = {x: 0, y: 0};
    isRotating = false;
    isDragging = false;

    // Set up touch controls
    isFirstTouch = true;

    canvas.addEventListener("touchmove", function(e) { 
        e.preventDefault();
        setMousePos(e.targetTouches[0]);
    }, false);

    canvas.addEventListener("touchstart", function(e) { 
        e.preventDefault();
        onClick(e.targetTouches[0]);
    });

    canvas.addEventListener("touchend", function(e) { 
        e.preventDefault();
        isRotating = false; 
        isDragging = false;
        isFirstTouch = true;
    });

    // Set up requestAnimationFrame
    requestAnimationFrame = window.requestAnimationFrame || 
                            window.mozRequestAnimationFrame || 
                            window.webkitRequestAnimationFrame || 
                            window.msRequestAnimationFrame;
    
    // Start update loop
    update();
}

function onClick(e) {
    // Set state based on raycast intersection
    var centeredMouse = {x: 0, y: 0};
    centeredMouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
    centeredMouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( centeredMouse, camera );    
    var intersects = raycaster.intersectObjects( scene.children );
    
    for ( var i = 0; i < intersects.length; i++ ) {
        if (intersects[i].object == overlayMesh) {
            // If user touched overlay then enter dragging state
            isDragging = true;
            return;
        }
    }
    
    // Else enter rotating state
    isRotating = true;
}

function redirectDonate() {
    window.location.href = "https://www.wwf.org.au/get-involved/bushfire-emergency#gs.ta7jim";
}

function update() {
    // Set canvas position
    // TODO: resize canvas
    setCanvasPos();

    // Handle rotation and dragging
    if (isRotating) {
        // Move the camera
        viewOmegaTheta = viewOmegaTheta * 0.95 + mouseDelta.x * 0.0001;
        viewOmegaPhi = viewOmegaPhi * 0.95 + mouseDelta.y * 0.0001;
    } else if (isDragging) {
        // Move the overlay
        overlayOmegaTheta = overlayOmegaTheta * 0.8 + mouseDelta.x * 0.0003;
        overlayOmegaPhi = overlayOmegaPhi * 0.8 + mouseDelta.y * 0.0003;
    }

    // Call update methods
    updateView();
    updateCameraPosition();
    updateLights();
    updateOverlay();
    renderer.render(scene, camera);
    requestAnimationFrame(update);
}

function updateOverlay() {
    // Theta rotation
    let axis = new THREE.Vector3(0, -1, 0);
    overlayMesh.rotateOnWorldAxis(axis, overlayOmegaTheta);

    // Phi rotation
    overlayPos = getCenterPoint(overlayMesh);
    axis.cross(overlayPos);
    axis.normalize();
    console.log(axis);
    overlayMesh.rotateOnWorldAxis(axis, overlayOmegaPhi);

    // Update angular velocities
    overlayOmegaTheta = overlayOmegaTheta * 0.9;
    overlayOmegaPhi = overlayOmegaPhi * 0.9;
}

function updateLights() {
    var lightPos = transformSphericalToView(viewRho, viewTheta + lightThetaOffset, viewPhi + lightPhiOffset);
    lightPos.applyQuaternion(camera.quaternion);
    pointLight.position.set(lightPos.x, lightPos.y, lightPos.z);
}

function getCenterPoint(mesh) {
    var middle = new THREE.Vector3();
    var geometry = mesh.geometry;

    geometry.computeBoundingBox();

    middle.x = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
    middle.y = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
    middle.z = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;

    mesh.localToWorld( middle );
    return middle;
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

            for (const feature of fireData["features"]) {
                let sizeString = feature["properties"]["description"].match(/SIZE: [0-9]*/gm)[0];
                sizeString = sizeString.slice(6);
                console.log(sizeString);
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
    if (isFirstTouch) {
        mouseDelta = {x: 0, y:0};
    } else {
        mouseDelta = {
            x: prevMousePos.x - mousePos.x,
            y: prevMousePos.y - mousePos.y
        }
    }
    isFirstTouch = false;
    //console.log(mouseDelta);
}

function scaleByPixelRatio (input) {
    var pixelRatio = window.devicePixelRatio || 1;
    return Math.floor(input * pixelRatio);
}

function setCanvasPos() {
    canvasPos = getPosition(canvas);
}

window.onload = init;
getFireData();
