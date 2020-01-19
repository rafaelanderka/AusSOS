var camera
var scene
var renderer;
var planeMesh;
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
var pointLight;
let fireData = {};

// Global constants
var viewPhiMax = 3.04;
var viewPhiMin = 0.1;
var lightThetaOffset = 0;
var lightPhiOffset = 0;

function init() {
    // Initialise time
    t = 0;

    // Initialise view
    viewFocus = new THREE.Vector3(0, 0, 0);
    viewRho = 1;
    viewTheta = 0;
    viewPhi = Math.PI / 2;
    viewOmegaTheta = 0;
    viewOmegaPhi = 0;

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

    // Set up sphere
    let geometry = new THREE.SphereGeometry(0.5, 32, 32);
    let material = new THREE.MeshPhongMaterial();
    let earthMesh = new THREE.Mesh(geometry, material);

    scene.add(earthMesh)

    // Load Earth textures
    material.map = THREE.ImageUtils.loadTexture('images/8081_earthmap10k.jpg');
    material.bumpMap = THREE.ImageUtils.loadTexture('images/8081_earthbump10k.jpg');
    material.bumpScale = 0.02;


    // Plane that gets projected on Earth
    let planeGeometry = new THREE.PlaneGeometry(0.1, 0.1, 10, 10);
    let planeMaterial = new THREE.MeshPhongMaterial({
                color: 'blue'
    });
    planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.material.side = THREE.DoubleSide;
    scene.add(planeMesh)

    // Projection stuff
    for (var vertexIndex = 0; vertexIndex < planeMesh.geometry.vertices.length; vertexIndex++) {
        var localVertex = planeMesh.geometry.vertices[vertexIndex].clone();
        localVertex.z = 0.61;

        var directionVector = new THREE.Vector3();
        directionVector.subVectors(earthMesh.position, localVertex);
        directionVector.normalize();

        var ray = new THREE.Raycaster(localVertex, directionVector);

        var collisionResults = ray.intersectObject(earthMesh);

        if (collisionResults.length > 0) {
            planeMesh.geometry.vertices[vertexIndex].z = collisionResults[0].point.z + 0.01;
        }
    }

    // IDK if we need this
    planeMesh.geometry.verticesNeedUpdate = true;
    planeMesh.geometry.normalsNeedUpdate = true;

    // Set up scene lighting
    let ambientLight = new THREE.AmbientLight(0x777777);
    scene.add(ambientLight);
    /*
    directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    let lightPos = transformSphericalToView(viewRho, viewTheta + lightThetaOffset, viewPhi + lightPhiOffset);
    directionalLight.position.set(lightPos.y, lightPos.z, lightPos.x);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    */
    pointLight = new THREE.PointLight(0xFFFFFF, 1, 100)
    var lightPos = transformSphericalToView(viewRho, viewTheta + lightThetaOffset, viewPhi + lightPhiOffset);
    pointLight.position.set(0, 0, 0);
    updateLights();
    scene.add(pointLight);

     // Set up canvas
    canvas = document.getElementsByTagName("canvas")[0];
    setCanvasPos();
    
    // Set up mouse controls
    canvas.addEventListener("mousedown", function(){ isRotating = true;  }, false);
    canvas.addEventListener("mouseup", function(){ isRotating = false;  }, false);
    canvas.addEventListener("mousemove", setMousePos, false);
    mousePos = {x: 0, y: 0};
    mouseDelta = {x: 0, y: 0};
    isRotating = false;

    // Set up mouse controls
    let controls = new THREE.OrbitControls( camera, renderer.domElement );
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
    setCanvasPos();

    if (isRotating) {
        viewOmegaTheta = mouseDelta.x * 0.005;
        viewOmegaPhi = mouseDelta.y * 0.005;
    }

    // Rotate the plane
    let axis = new THREE.Vector3(1, 0, 0);
    axis.normalize();
    planeMesh.rotateOnWorldAxis(axis, 0.01);

    updateView();
    updateCameraPosition();
    updateLights();
    renderer.render(scene, camera);
    requestAnimationFrame(update);
    renderer.render(scene, camera);
}

function updateLights() {
    var lightPos = transformSphericalToView(viewRho, viewTheta + lightThetaOffset, viewPhi + lightPhiOffset);
    lightPos.applyQuaternion(camera.quaternion);
    pointLight.position.set(lightPos.x, lightPos.y, lightPos.z);
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
