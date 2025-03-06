/* GLOBAL SETTINGS */
const OPTIONS = {
    particleCount: 2000,
    zoneSize: 100,
    maxSpeed: 6,
    trailLength: 20,
    interactionRadius: 150
  };
  
  /* CORE SYSTEM */
  let collaborationModes = [];
  let currentMode;
  let particles;
  let spatialGrid;
  let trailCanvas;
  let modeSelector;
  let colorPalette;
  
  class CollaborationMode {
    constructor(name, description, init, update) {
      this.name = name;
      this.description = description;
      this.init = init;
      this.update = update;
    }
  }
  
  function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    frameRate(60);
    
    // Performance optimizations
    pixelDensity(1);
    smooth();
    rectMode(CENTER).ellipseMode(CENTER);
    
    // Initialize spatial partitioning
    spatialGrid = new Grid(OPTIONS.zoneSize);
    
    // Create offscreen buffer for trails
    trailCanvas = createGraphics(width, height);
    trailCanvas.background(0);
    
    setupModes();
    setupUI();
    initParticles();
    initColorPalette();
  }
  
  function draw() {
    background(0);
    
    // Update systems
    spatialGrid.update(particles);
    currentMode.update();
    
    // Performance-efficient trail effect
    trailCanvas.fill(0, 15);
    trailCanvas.rect(0, 0, width, height);
    image(trailCanvas, -width/2, -height/2);
    
    // Draw particles
    translate(-width/2, -height/2);
    drawParticles();
  }
  
  /* PARTICLE SYSTEM */
  class Particle {
    constructor() {
      this.pos = createVector(random(width), random(height));
      this.vel = p5.Vector.random2D();
      this.acc = createVector();
      this.size = random(2, 5);
      this.color = color(random(200,255), random(150,200), 100);
    }
  
    update() {
      this.vel.add(this.acc);
      this.vel.limit(OPTIONS.maxSpeed);
      this.pos.add(this.vel);
      this.acc.mult(0);
      this.edges();
      this.updateSize();
    }
  
    updateSize() {
      this.size = map(this.vel.mag(), 0, OPTIONS.maxSpeed, 2, 8);
    }
  
    edges() {
      if(this.pos.x < 0) this.pos.x = width;
      if(this.pos.x > width) this.pos.x = 0;
      if(this.pos.y < 0) this.pos.y = height;
      if(this.pos.y > height) this.pos.y = 0;
    }
  }
  
  function initParticles() {
    particles = Array(OPTIONS.particleCount).fill().map(() => new Particle());
  }
  
  function drawParticles() {
    particles.forEach(p => {
      fill(p.color);
      noStroke();
      ellipse(p.pos.x, p.pos.y, p.size);
    });
  }
  
  /* COLLABORATION MODES */
  function setupModes() {
    // ... (existing modes)
  
    // New Mode: Color Harmony
    collaborationModes.push(new CollaborationMode(
      "Color Harmony",
      "Particles change color based on proximity",
      () => { initColorPalette(); },
      () => {
        particles.forEach(p => {
          let neighbors = spatialGrid.getNeighbors(p.pos);
          if (neighbors.length > 0) {
            let avgColor = averageColor(neighbors.map(n => n.color));
            p.color = lerpColor(p.color, avgColor, 0.1);
          }
        });
      }
    ));
  
    currentMode = collaborationModes[0];
  }
  
  /* COLOR PALETTE */
  function initColorPalette() {
    colorPalette = [
      color(255, 100, 100),
      color(100, 255, 100),
      color(100, 100, 255),
      color(255, 255, 100),
      color(255, 100, 255)
    ];
  }
  
  function shiftColorPalette() {
    colorPalette = colorPalette.map(c => {
      return color(
        (red(c) + random(-10, 10) + 255) % 255,
        (green(c) + random(-10, 10) + 255) % 255,
        (blue(c) + random(-10, 10) + 255) % 255
      );
    });
  }
  
  function averageColor(colors) {
    let r = 0, g = 0, b = 0;
    colors.forEach(c => {
      r += red(c);
      g += green(c);
      b += blue(c);
    });
    return color(r / colors.length, g / colors.length, b / colors.length);
  }
  
  /* TOUCH EVENTS */
  function touchStarted() {
    if (touches.length > 0) {
      handleInteraction(touches[0].x, touches[0].y);
    }
    return false;
  }
  
  
  function touchMoved() {
    handleInteraction(touches[0].x, touches[0].y);
    return false;
  }
  
  function handleInteraction(x, y) {
    particles.forEach(p => {
      let d = dist(x, y, p.pos.x, p.pos.y);
      if (d < OPTIONS.interactionRadius) {
        let force = p5.Vector.sub(createVector(x, y), p.pos);
        force.setMag(map(d, 0, OPTIONS.interactionRadius, 0.5, 0));
        p.acc.add(force);
      }
    });
    shiftColorPalette();
  }
  
  /* UI SYSTEM */
  function setupUI() {
    modeSelector = select('#modeSelector');
    collaborationModes.forEach((mode, i) => {
      modeSelector.option(mode.name);
    });
    modeSelector.changed(() => {
      currentMode = collaborationModes[modeSelector.selectedIndex];
      currentMode.init();
    });
  }
  
  /* WINDOW RESIZE */
  function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    trailCanvas.resizeCanvas(windowWidth, windowHeight);
    initParticles();
  }
  