var VSHADER_SOURCE =
  //transforms
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_transformMatrix;\n' +
  //Shading
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  //color
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  //transforms
  '  gl_Position = u_transformMatrix * a_Position;\n' +
  // Shading
  '  vec3 lightDirection = normalize(vec3(0.0, 0.5, 0.7));\n' + // Light direction
  '  vec4 color = vec4(0.5, 0.4, 0.2, 1.0);\n' +  // Robot color
  '  vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
  '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
  //color
  '  v_Color = vec4(color.rgb * nDotL + vec3(0.1), color.a);\n' +
  '}\n';

var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';


var currentAngleFlap = 0.0;
function main() {
  
  var canvas = document.getElementById('webgl');

  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  var u_transformMatrix = gl.getUniformLocation(gl.program, 'u_transformMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_transformMatrix || !u_NormalMatrix) {
    console.log('Failed to get the storage location');
    return;
  }

  // Set the viewing area of the matrix
  var viewMatrix = new Matrix4();
  viewMatrix.setPerspective(50.0, canvas.width / canvas.height, 1.0, 100.0);
  viewMatrix.lookAt(0.0, 10.0, 30.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

  // Moving creature around
  document.onkeydown = function(ev){ keydown(ev, gl, n, viewMatrix, u_transformMatrix, u_NormalMatrix); };

  // Current rotation angle
  var currentAngle = 0.0;

  // Animate
  var tick = function() {
    //head rotation
    currentAngle = animate(currentAngle);  
    //wing rotation
    currentAngleFlap = aniFlap(currentAngleFlap);
    draw(gl, n, viewMatrix, u_transformMatrix, u_NormalMatrix, currentAngle);
    requestAnimationFrame(tick, canvas); // Request that the browser calls tick
  };
  tick();
}

// Head animation
var tickTime = -80;
function animate(angle) {
  
  tickTime += 1; 
  if (tickTime == 161) console.log('oi')

  if (tickTime > 80 && tickTime < 160){
    return (80 - (tickTime % 80));
  }
  else if (tickTime == 160){
    //tickTime = 0;
    //return tickTime;
    return 0;
  }
  else if (tickTime > 160 && tickTime != 240){
    return (0 - (tickTime % 80));
  }
  else if (tickTime == 240){
    tickTime = -80;
    return tickTime;
  }
  else{
    return tickTime;
  }

}

// Wing animation
var tickTime2 = -22;
function aniFlap(angle) {
  
  tickTime2 += 1; 

  if (tickTime2 > 22 && tickTime2 < 44){
    return (22 - (tickTime2 % 22));
  }
  else if (tickTime2 == 44){
    return 0;
  }
  else if (tickTime2 > 44 && tickTime2 != 66){
    return (0 - (tickTime2 % 22));
  }
  else if (tickTime2 == 66){
    tickTime2 = -22;
    return tickTime2;
  }
  else{
    return tickTime2;
  }	
}

var ANGLE_STEP = 10.0;     // Rotation increment
var g_turn = 90.0;   // body rotation

function keydown(ev, gl, n, viewMatrix, u_transformMatrix, u_NormalMatrix) {
  switch (ev.keyCode) {
    case 39: // Right arrow key
      g_turn = (g_turn + ANGLE_STEP) % 360;
      break;
    case 37: // Left arrow key
      g_turn = (g_turn - ANGLE_STEP) % 360;
      break;
    default: return; // Skip drawing at no effective action
  }
  // Redraw
  draw(gl, n, viewMatrix, u_transformMatrix, u_NormalMatrix);
}

function initVertexBuffers(gl) {
  // cube coordinates
  var vertices = new Float32Array([
    0.5, 1.0, 0.5, -0.5, 1.0, 0.5, -0.5, 0.0, 0.5,  0.5, 0.0, 0.5, // v0-v1-v2-v3 front
    0.5, 1.0, 0.5,  0.5, 0.0, 0.5,  0.5, 0.0,-0.5,  0.5, 1.0,-0.5, // v0-v3-v4-v5 right
    0.5, 1.0, 0.5,  0.5, 1.0,-0.5, -0.5, 1.0,-0.5, -0.5, 1.0, 0.5, // v0-v5-v6-v1 up
   -0.5, 1.0, 0.5, -0.5, 1.0,-0.5, -0.5, 0.0,-0.5, -0.5, 0.0, 0.5, // v1-v6-v7-v2 left
   -0.5, 0.0,-0.5,  0.5, 0.0,-0.5,  0.5, 0.0, 0.5, -0.5, 0.0, 0.5, // v7-v4-v3-v2 down
    0.5, 0.0,-0.5, -0.5, 0.0,-0.5, -0.5, 1.0,-0.5,  0.5, 1.0,-0.5  // v4-v7-v6-v5 back
  ]);

  // Normal for shader
  var normals = new Float32Array([
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0  // v4-v7-v6-v5 back
  ]);

  // Cibe indices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);


  //
  // CREATE BUFFERS
  //  
  if (!initArrayBuffer(gl, 'a_Position', vertices, gl.FLOAT, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, gl.FLOAT, 3)) return -1;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

//
// Default buffer
//
function initArrayBuffer(gl, attribute, data, type, num) {
  
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);

  gl.enableVertexAttribArray(a_attribute);

  return true;
}

// Coordinate transformation matrix
var g_transformMatrix = new Matrix4(), g_mvpMatrix = new Matrix4();

//
// DRAW HIERARCHICAL SYSTEM
//
function draw(gl, n, viewMatrix, u_transformMatrix, u_NormalMatrix, currentAngle) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //
  // BODY
  //
  var body = 15.0;
  g_transformMatrix.setTranslate(0.0, - 10, 0.0);     // Move body on base
  g_transformMatrix.rotate(g_turn, 0.0, 1.0, 0.0);
  drawBox(gl, n, 4.0, body, 7.0, viewMatrix, u_transformMatrix, u_NormalMatrix);

  pushMatrix(g_transformMatrix); // (1)

  //
  // HEAD
  //
  var head = 3.0;
  g_transformMatrix.translate(0.0, body, 0.0);       // right neck joint
  //add a rotate head (left to right) animation
  g_transformMatrix.rotate(currentAngle,0.0, 1.0, 0.0);
  drawBox(gl, n, 3.0, head, 3.6, viewMatrix, u_transformMatrix, u_NormalMatrix);

  pushMatrix(g_transformMatrix); // (2)
  //
  // EARS
  //
  var ear1 = 1.0;
  g_transformMatrix.translate(0.0, head, -1.0);       // right neck joint
  //add a rotate head (left to right) animation
  drawBox(gl, n, 1.0, ear1, 1.0, viewMatrix, u_transformMatrix, u_NormalMatrix);
  g_transformMatrix = popMatrix(); // (2)

  var ear2 = 1.0;
  g_transformMatrix.translate(0.0, head, 1.0);
  drawBox(gl, n, 1.0, ear2, 1.0, viewMatrix, u_transformMatrix, u_NormalMatrix);

  g_transformMatrix = popMatrix(); // (1)


  pushMatrix(g_transformMatrix); // (3)
  //LEGS
  var leg1 = 4.0;
  g_transformMatrix.translate(0.0, -3.0, -2.0);
  drawBox(gl, n, 2.0, leg1, 2.0, viewMatrix, u_transformMatrix, u_NormalMatrix);

  var leg2 = 4.0;
  g_transformMatrix.translate(0.0, 0.0, 4.0);
  drawBox(gl, n, 2.0, leg2, 2.0, viewMatrix, u_transformMatrix, u_NormalMatrix);

  g_transformMatrix = popMatrix(); // (3)

  pushMatrix(g_transformMatrix) // (4)
  
  // 
  // Close arm right
  //
  var closeArmRight = 2.0;
  g_transformMatrix.translate(0.0, body - 2, 5.8);       // Move right shoulder joint
  g_transformMatrix.rotate(currentAngleFlap,0.0, -1.0, 0.0);
  drawBox(gl, n, 2.0, closeArmRight, 6.0, viewMatrix, u_transformMatrix, u_NormalMatrix);

  pushMatrix(g_transformMatrix) // (5)

  //
  // Close wing right
  //
  var closeWingRight = 7.0;
  g_transformMatrix.translate(0.0, -7, 0.0);       // Move right shoulder joint
  drawBox(gl, n, 1.0, closeWingRight, 6.0, viewMatrix, u_transformMatrix, u_NormalMatrix);
  g_transformMatrix = popMatrix(); // (5)

  //
  // Far Arm right
  //
  var farArm1 = 1.0;
  g_transformMatrix.translate(0.0, 0.0, 4.2);       // Move to elbow joint left
  g_transformMatrix.rotate(currentAngleFlap, 0.0, -1.0, 0.0);
  drawBox(gl, n, 1.0, farArm1, 3.0, viewMatrix, u_transformMatrix, u_NormalMatrix);

  //
  // Far wing right
  //
  var farWingRight = 3.5;
  g_transformMatrix.translate(0.0, -3.5, -0.2);       // Move to elbow joint left
  //g_transformMatrix.rotate(currentAngleFlap,0.0, -1.0, 0.0);
  drawBox(gl, n, 0.5, farWingRight, 2.5, viewMatrix, u_transformMatrix, u_NormalMatrix);


  g_transformMatrix = popMatrix(); // (4)

  //
  // Close arm Left
  //
  var closeArmRight = 2.0;
  g_transformMatrix.translate(0.0, body - 2, -5.8);       // Move right shoulder joint
  g_transformMatrix.rotate(currentAngleFlap,0.0, 1.0, 0.0);
  drawBox(gl, n, 2.0, closeArmRight, 6.0, viewMatrix, u_transformMatrix, u_NormalMatrix);

  pushMatrix(g_transformMatrix); // (6)
  var closeWingleft = 7.0;
  g_transformMatrix.translate(0.0, -7, 0.0);       // Move right shoulder joint
  drawBox(gl, n, 1.0, closeWingleft, 6.0, viewMatrix, u_transformMatrix, u_NormalMatrix);
  g_transformMatrix = popMatrix(); // (6)

  //
  // Far Arm left
  //
  var farArm1 = 1.0;
  g_transformMatrix.translate(0.0, 0.0, -4.2);       // Move to elbow joint left
  //g_transformMatrix.rotate(currentAngleFlap, -1.0, 1.0, 1.0);
  g_transformMatrix.rotate(currentAngleFlap, 0.0, 1.0, 0.0);
  
  drawBox(gl, n, 1.0, farArm1, 3.0, viewMatrix, u_transformMatrix, u_NormalMatrix);

  //
  // Far wing Left
  //
  var farWingLeft = 3.5;
  g_transformMatrix.translate(0.0, -3.5, 0.2);       // Move to elbow joint left
  //g_transformMatrix.rotate(currentAngleFlap,0.0, -1.0, 0.0);
  drawBox(gl, n, 0.5, farWingLeft, 2.5, viewMatrix, u_transformMatrix, u_NormalMatrix); 

}


//
//  Stack data structure for matrices
//
var g_matrixStack = [];
function pushMatrix(m) { 
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() {
  return g_matrixStack.pop();
}

var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

// Draw rectangular solid
function drawBox(gl, n, width, height, depth, viewMatrix, u_transformMatrix, u_NormalMatrix) {
  pushMatrix(g_transformMatrix);   // Save the model matrix
    
    // change cube size
    g_transformMatrix.scale(width, height, depth);

    // Calculate the view projection
    g_mvpMatrix.set(viewMatrix);
    g_mvpMatrix.multiply(g_transformMatrix);
    gl.uniformMatrix4fv(u_transformMatrix, false, g_mvpMatrix.elements);

    // Calculate the normal transform matrix
    g_normalMatrix.setInverseOf(g_transformMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
    
    // Draw
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    g_transformMatrix = popMatrix();   // Retrieve the model matrix
}
