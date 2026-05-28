//Объявление переменных
var planets = [];
var container;
var camera, scene, renderer;
var skySphere;
var sunObject;
var mercury, venus, earth, mars;
var sunCenter;
var mercuryOrbit, venusOrbit, earthOrbit, marsOrbit;
var currentFocusPlanet = null;
var cameraRotation = { x: 0, y: 0 };
var cloudSphere;
var moon;
var keys;
var clock;
 
// Вызов функций

init();
animate();
 
// Функция инициализации

function init()
{
    container = document.getElementById('container');
 
    // Сцена

    scene = new THREE.Scene();
 
    // Камера

    camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 15000);
    camera.position.set(0, 500, 1400);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
 
    // Отрисовщик

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);
 
    window.addEventListener('resize', onWindowResize, false);
 
    // Таймер для независимости скорости от производительности

    clock = new THREE.Clock();
 
    // Создание объектов сцены

    skySphere = createSky(999, "img/starmap.jpg");
    sunObject = createSun();
    sunCenter = new THREE.Vector3(0, 0, 0);
 
    mercury = createPlanet("img/mercurymap.jpg", "img/mercurybump.jpg",
                           0.383 * 10, new THREE.Vector3(289.5 / 2, 0, 0),
                           0.0161 / 4, 1 / 5, sunCenter);
 
    venus = createPlanet("img/venusmap.jpg", "img/venusbump.jpg",
                         0.949 * 10, new THREE.Vector3(541 / 2, 0, 0),
                         0.012 / 4, 0.5 / 5, sunCenter);
 
    cloudSphere = createEarthCloud();
 
    earth = createPlanet("img/earthmap1k.jpg", "img/earthbump1k.jpg",
                         10, new THREE.Vector3(748 / 2, 0, 0),
                         0.01 / 4, 0.25 / 5, sunCenter);
 
    // Дополнительный материал для Земли с картой огней

    var earthLightsMap = new THREE.TextureLoader().load("img/earthlights1k.jpg");
    earthLightsMap.minFilter = THREE.NearestFilter;
    earth.planet.material = new THREE.MeshPhongMaterial({
        map: earth.planet.material.map,
        bumpMap: earth.planet.material.bumpMap,
        bumpScale: 0.05,
        emissiveMap: earthLightsMap,
        emissive: new THREE.Color('rgb(200, 200, 200)'),
        side: THREE.DoubleSide
    });
 
    // Облачный слой Земли

    earth.planet.add(cloudSphere);
 
    // Луна вращается вокруг Земли

    moon = createMoon("img/moonmap1k.jpg", "img/moonbump1k.jpg",
                      2, new THREE.Vector3(20, 0, 0),
                      0.001, earth.planet.position, 20, 0.47, -0.001);
 
    mars = createPlanet("img/marsmap1k.jpg", "img/marsbump1k.jpg",
                        0.532 * 10, new THREE.Vector3(1139.5 / 2, 0, 0),
                        0.011 / 4, 0.2 / 5, sunCenter);
 
    // Орбиты

    mercuryOrbit = drawOrbit(mercury, 100);
    venusOrbit   = drawOrbit(venus,   100);
    earthOrbit   = drawOrbit(earth,   100);
    marsOrbit    = drawOrbit(mars,    100);
 
    // Освещение

    var sunLight = new THREE.PointLight(0xFFFFFF, 4);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
 
    var ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
 
    // Добавление объектов в сцену

    scene.add(skySphere);
    scene.add(sunObject.sun);
    scene.add(mercury.planet);
    scene.add(venus.planet);
    scene.add(earth.planet);
    scene.add(mars.planet);
    scene.add(moon.moon);
    scene.add(mercuryOrbit);
    scene.add(venusOrbit);
    scene.add(earthOrbit);
    scene.add(marsOrbit);
 
    // Хранение планет в массиве

    planets.push(mercury);
    planets.push(venus);
    planets.push(earth);
    planets.push(mars);
 
    // Обработка клавиш переключения вида

    document.addEventListener('keydown', function(event) {
        switch (event.key) {
            case '1': focusOnPlanet(mercury); break;
            case '2': focusOnPlanet(venus);   break;
            case '3': focusOnPlanet(earth);   break;
            case '4': focusOnPlanet(mars);    break;
            case '0':
                currentFocusPlanet = null;
                camera.position.set(0, 500, 1400);
                camera.lookAt(new THREE.Vector3(0, 0, 0));
                break;
        }
    });
 
    // Обработка клавиш управления камерой
    keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
}
 
// Обработка изменения размеров окна

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
 
// Анимация

function animate()
{
    requestAnimationFrame(animate);
 
    var delta = clock.getDelta();
 
    // Обновление позиций планет
    for (var i = 0; i < planets.length; i++) {
        updatePlanetPosition(planets[i], delta);
    }
 
    updateMoonPosition(moon, delta);
    updateCameraPosition();
 
    render();
}
 
function render()
{
    renderer.render(scene, camera);
}
 
// Создание звёздного неба

function createSky(radius, texturePath)
{
    var geometry = new THREE.SphereGeometry(radius, 32, 32);
 
    var loader = new THREE.TextureLoader();
    var tex = loader.load(texturePath);
    tex.minFilter = THREE.NearestFilter;
 
    var material = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.BackSide
    });
 
    var sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(0, 0, 0);
    return sphere;
}
 
// Создание Солнца

function createSun()
{
    var geometry = new THREE.SphereGeometry(40, 32, 32);
    var texture  = new THREE.TextureLoader().load("img/sunmap.jpg");
    texture.minFilter = THREE.NearestFilter;
 
    var material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide
    });
 
    var sun = new THREE.Mesh(geometry, material);
    sun.position.set(0, 0, 0);
 
    return { sun: sun, pos: new THREE.Vector3(0, 0, 0) };
}
 
// Создание планеты

function createPlanet(texturePath, bumpPath, size, position, orbitSpeed, axisSpeed, center)
{
    var loader   = new THREE.TextureLoader();
    var geometry = new THREE.SphereGeometry(size, 32, 32);
 
    var tex  = loader.load(texturePath);
    var bump = loader.load(bumpPath);
    tex.minFilter  = THREE.NearestFilter;
    bump.minFilter = THREE.NearestFilter;
 
    var material = new THREE.MeshPhongMaterial({
        map:       tex,
        bumpMap:   bump,
        bumpScale: 0.05,
        side:      THREE.DoubleSide
    });
 
    var planet = new THREE.Mesh(geometry, material);
    planet.position.copy(position);
 
    return {
        planet:          planet,
        pos:             new THREE.Vector3().copy(position),
        orbitSpeed:      orbitSpeed || 0,
        axisSpeed:       axisSpeed  || 0,
        center:          center || new THREE.Vector3(),
        radius:          position.distanceTo(center),
        orbitAngle:      0,
        axisAngle:       0
    };
}
 
// Обновление позиции планеты

function updatePlanetPosition(planet, delta)
{
    planet.orbitAngle += planet.orbitSpeed * delta * 60;
    planet.axisAngle  += planet.axisSpeed  * delta * 60;
 
    var x = planet.center.x + planet.radius * Math.cos(planet.orbitAngle);
    var z = planet.center.z + planet.radius * Math.sin(planet.orbitAngle);
 
    planet.planet.position.set(x, 0, z);
    planet.planet.rotation.y = planet.axisAngle;
}
 
// Отрисовка орбиты пунктирной линией

function drawOrbit(planet, segments)
{
    var material = new THREE.LineDashedMaterial({
        color:    0xffff00,
        dashSize: 3,
        gapSize:  5
    });
 
    var points = [];
    for (var i = 0; i <= segments; i++) {
        var theta = (i / segments) * Math.PI * 2;
        var x = planet.center.x + planet.radius * Math.cos(theta);
        var z = planet.center.z + planet.radius * Math.sin(theta);
        points.push(new THREE.Vector3(x, 0, z));
    }
 
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    return line;
}
 
// Создание Луны

function createMoon(texturePath, bumpPath, size, position, orbitSpeed, center, radius, inclination, axisSpeed)
{
    var loader   = new THREE.TextureLoader();
    var geometry = new THREE.SphereGeometry(size, 32, 32);
 
    var tex  = loader.load(texturePath);
    var bump = loader.load(bumpPath);
    tex.minFilter  = THREE.NearestFilter;
    bump.minFilter = THREE.NearestFilter;
 
    var material = new THREE.MeshPhongMaterial({
        map:       tex,
        bumpMap:   bump,
        bumpScale: 0.05,
        side:      THREE.DoubleSide
    });
 
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
 
    return {
        moon:        mesh,
        pos:         new THREE.Vector3().copy(position),
        orbitSpeed:  orbitSpeed   || 0,
        center:      center       || new THREE.Vector3(),
        radius:      radius       || position.distanceTo(center),
        inclination: inclination  || 0,
        axisSpeed:   axisSpeed    || 0,
        orbitAngle:  0,
        axisAngle:   0
    };
}
 
// Обновление позиции Луны

function updateMoonPosition(moon, delta)
{
    moon.orbitAngle += moon.orbitSpeed * delta * 60;
    moon.axisAngle  += moon.axisSpeed  * delta * 60;
 
    var x = moon.center.x + moon.radius * Math.cos(moon.orbitAngle);
    var y = moon.center.y + moon.radius * Math.sin(moon.inclination) * Math.sin(moon.orbitAngle);
    var z = moon.center.z + moon.radius * Math.cos(moon.inclination) * Math.sin(moon.orbitAngle);
 
    moon.moon.position.set(x, y, z);
    moon.moon.rotation.y = moon.axisAngle;
}
 
// Создание облачного слоя Земли

function createEarthCloud()
{
    var canvasResult  = document.createElement('canvas');
    canvasResult.width  = 1024;
    canvasResult.height = 512;
    var contextResult = canvasResult.getContext('2d');
 
    var imageMap = new Image();
    imageMap.addEventListener("load", function() {
        var canvasMap = document.createElement('canvas');
        canvasMap.width  = imageMap.width;
        canvasMap.height = imageMap.height;
        var contextMap = canvasMap.getContext('2d');
        contextMap.drawImage(imageMap, 0, 0);
        var dataMap = contextMap.getImageData(0, 0, canvasMap.width, canvasMap.height);
 
        var imageTrans = new Image();
        imageTrans.addEventListener("load", function() {
            var canvasTrans = document.createElement('canvas');
            canvasTrans.width  = imageTrans.width;
            canvasTrans.height = imageTrans.height;
            var contextTrans = canvasTrans.getContext('2d');
            contextTrans.drawImage(imageTrans, 0, 0);
            var dataTrans = contextTrans.getImageData(0, 0, canvasTrans.width, canvasTrans.height);
 
            var dataResult = contextMap.createImageData(canvasMap.width, canvasMap.height);
            for (var y = 0, offset = 0; y < imageMap.height; y++) {
                for (var x = 0; x < imageMap.width; x++, offset += 4) {
                    dataResult.data[offset + 0] = dataMap.data[offset + 0];
                    dataResult.data[offset + 1] = dataMap.data[offset + 1];
                    dataResult.data[offset + 2] = dataMap.data[offset + 2];
                    dataResult.data[offset + 3] = 255 - dataTrans.data[offset + 0];
                }
            }
            contextResult.putImageData(dataResult, 0, 0);
            material.map.needsUpdate = true;
        });
        imageTrans.src = 'img/earthcloudmaptrans.jpg';
    });
    imageMap.src = 'img/earthcloudmap.jpg';
 
    var geometry = new THREE.SphereGeometry(10.2, 32, 32);
    var material = new THREE.MeshPhongMaterial({
        map:         new THREE.Texture(canvasResult),
        side:        THREE.DoubleSide,
        transparent: true,
        opacity:     0.8
    });
 
    return new THREE.Mesh(geometry, material);
}
 
// Режим слежения за планетой

function focusOnPlanet(planet)
{
    currentFocusPlanet = planet;
    cameraRotation.x   = 0;
    cameraRotation.y   = 0;
}
 
// Обновление позиции камеры при слежении

function updateCameraPosition()
{
    if (!currentFocusPlanet) return;
 
    var target = currentFocusPlanet.planet.position.clone();
    target.y = 0;
 
    if (keys.ArrowLeft)  cameraRotation.y += 0.02;
    if (keys.ArrowRight) cameraRotation.y -= 0.02;
    if (keys.ArrowUp)    cameraRotation.x += 0.02;
    if (keys.ArrowDown)  cameraRotation.x -= 0.02;
 
    cameraRotation.x = Math.max(Math.min(cameraRotation.x, Math.PI / 2), -Math.PI / 2);
 
    var distance = currentFocusPlanet.radius * 0.2;
    var offset = new THREE.Vector3(0, distance, 0);
    offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), cameraRotation.x);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation.y);
 
    camera.position.copy(target).add(offset);
    camera.lookAt(target);
}
 
// Клавиатура

function onKeyDown(event)
{
    if (event.key in keys) keys[event.key] = true;
}
 
function onKeyUp(event)
{
    if (event.key in keys) keys[event.key] = false;
}
