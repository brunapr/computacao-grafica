/**
 * @file
 * @author Bruna Ribeiro
 * @since 30/04/2023
 * @see https://brunapr.github.io/computacao-grafica/RotatingSquare/index.html
 */

 "use strict";

 /**
	* Raw data for some point positions - this will be a square, consisting
	* of two triangles.  We provide two values per vertex for the x and y coordinates
	* (z will be zero by default).
	* @type {Float32Array}
	*/
 
 // prettier-ignore
 var vertices = new Float32Array([
	 -0.5, -0.5,
	 0.5, -0.5,
	 0.5, 0.5, 
	 -0.5, -0.5,
	 0.5, 0.5, 
	 -0.5, 0.5
 ]);
 
 /**
	* Number of vertices.
	* @type {Number}
	*/
 var numPoints = vertices.length / 2;
 
 /**
	* Index of current corner relative to vertices.
	* @type {Number}
	*/
 var cindex = 0;
 
 /**
	* Whether a key has been clicked.
	* @type {Boolean}
	*/
 var click = false;
 
 /**
	* A color value for each vertex.
	* @type {Float32Array}
	*/
 // prettier-ignore
 var colors = new Float32Array([
	 1.0, 0.5, 0.5, 1.0, // red
	 0.0, 1.0, 0.5, 1.0, // green
	 0.5, 0.5, 1.0, 1.0, // blue
	 1.0, 0.5, 0.5, 1.0, // red
	 0.5, 0.5, 1.0, 1.0, // blue
	 1.0, 1.0, 1.0, 1.0, // white
 ]);
 
 /**
	* The OpenGL context.
	* @type {WebGL2RenderingContext}
	*/
 var gl;
 
 /**
	* Handle to a buffer on the GPU.
	* @type {WebGLBuffer}
	*/
 var vertexbuffer;
 
 /**
	* Handle to a buffer on the GPU.
	* @type {WebGLBuffer}
	*/
 var colorbuffer;
 
 /**
	* Handle to the compiled shader program on the GPU.
	* @type {WebGLShader}
	*/
 var shader;
 
 /**
	* Model transformation matrix.
	* @type {Matrix4}
	*/
 var modelMatrix = new Matrix4(); // identity matrix
 
 /**
	* Window length.
	* @type {Number}
	*/
 var wsize = 5;
 
 /**
	* Projection matrix.
	* @type {Matrix4}
	*/
 var projectionMatrix = new Matrix4().setOrtho(-wsize / 2,
	 wsize / 2, -wsize / 2,
	 wsize / 2,
	 0,
	 1
 );
 var collisionMode = 0;
 var scale = 1.0;
 
 /**
	* Translate keydown events to strings
	* @param {KeyboardEvent} event keyboard event.
	* @see  http://javascript.info/tutorial/keyboard-events
	*/
 function getChar(event) {
	 event = event || window.event;
	 let charCode = event.key || String.fromCharCode(event.which);
	 return charCode;
 }
 
 /**
	* Sets {@link modelMatrix} to rotate by an angle ang,
	* about point (x,y).
	* @param {Number} ang rotation angle.
	* @param {Number} x transformed x coordinate of the pivot vertex.
	* @param {Number} y transformed y coordinate of the pivot vertex.
	* @param {Number} tx translation from the transformed pivot vertex to its original position, in the x axis.
	* @param {Number} ty translation from the transformed pivot vertex to its original position, in the y axis.
	*/
 function rotateAndScaleAboutCorner(ang, x, y, tx, ty) {
	 modelMatrix.setTranslate(x, y, 0.0);
	 modelMatrix.scale(scale, scale, 1);
	 modelMatrix.rotate(ang, 0.0, 0.0, 1.0);
	 modelMatrix.translate(-x, -y, 0.0);
	 // unless clicked this is (0,0)
	 modelMatrix.translate(tx, ty, 0.0);
 }
 
 /**
	* Handler for keydown events that will update {@link modelMatrix} based
	* on key pressed.
	* @param {KeyboardEvent} event keyboard event.
	*/
 function handleKeyPress(event) {
	 var ch = getChar(event);
	 switch (ch) {
		 case "r":
			 console.log("r");
			 cindex = 0;
			 break;
		 case "g":
			 console.log("g");
			 cindex = 1;
			 break;
		 case "b":
			 console.log("b");
			 cindex = 2;
			 break;
		 case "w":
			 console.log("w");
			 cindex = 5;
			 break;
		 case "ArrowUp":
			 console.log("ArrowUp");
			 if(scale < 1.5) scale += 0.1;
			 break;
		 case "ArrowDown":
			 console.log("ArrowDown");
			 if(scale > 0.5) scale -= 0.1;
			 break;
		 case "0":
			 console.log("0");
			 collisionMode = 0;
			 break;
		 case "1":
			 console.log("1");
			 collisionMode = 1;
			 break;
		 default:
			 return;
	 }
	 click = true;
 }
 
 /**
	* Returns the coordinates of the {@link vertices vertex} at index i.
	* @param {Number} i vertex index.
	* @returns {Array<Number>} vertex coordinates.
	*/
 function getVertex(i) {
	 let j = (i % numPoints) * 2;
	 return [vertices[j], vertices[j + 1]];
 }
 
 /**
	* Code to actually render our geometry.
	*/
 function draw() {
	 // clear the framebuffer
	 gl.clear(gl.COLOR_BUFFER_BIT);
 
	 // bind the shader
	 gl.useProgram(shader);
 
	 // bind the buffer
	 gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);
 
	 // get the index for the a_Position attribute defined in the vertex shader
	 var positionIndex = gl.getAttribLocation(shader, "a_Position");
	 if (positionIndex < 0) {
		 console.log("Failed to get the storage location of a_Position");
		 return;
	 }
 
	 // "enable" the a_position attribute
	 gl.enableVertexAttribArray(positionIndex);
 
	 // associate the data in the currently bound buffer with the a_position attribute
	 // (The '2' specifies there are 2 floats per vertex in the buffer.  Don't worry about
	 // the last three args just yet.)
	 gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);
 
	 // we can unbind the buffer now (not really necessary when there is only one buffer)
	 gl.bindBuffer(gl.ARRAY_BUFFER, null);
 
	 // bind the buffer with the color data
	 gl.bindBuffer(gl.ARRAY_BUFFER, colorbuffer);
 
	 // get the index for the a_Color attribute defined in the vertex shader
	 var colorIndex = gl.getAttribLocation(shader, "a_Color");
	 if (colorIndex < 0) {
		 console.log("Failed to get the storage location of a_Color");
		 return;
	 }
 
	 // "enable" the a_Color attribute
	 gl.enableVertexAttribArray(colorIndex);
 
	 // Associate the data in the currently bound buffer with the a_Color attribute
	 // The '4' specifies there are 4 floats per vertex in the buffer
	 gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);
 
	 // set the value of the uniform variable in the shader and draw
	 var transformLoc = gl.getUniformLocation(shader, "transform");
	 let transform = new Matrix4(projectionMatrix).multiply(modelMatrix);
	 gl.uniformMatrix4fv(transformLoc, false, transform.elements);
	 gl.drawArrays(gl.TRIANGLES, 0, numPoints);
 
	 gl.drawArrays(gl.POINTS, cindex, 1);
 
	 // we can unbind the buffer now
	 gl.bindBuffer(gl.ARRAY_BUFFER, null);
 
	 // unbind shader and "disable" the attribute indices
	 // (not really necessary when there is only one shader)
	 gl.disableVertexAttribArray(positionIndex);
	 gl.useProgram(null);
 }
 
 /**
	* Print matrix on the console.
	* @param {Matrix4} matrix 4x4 matrix.
	*/
 function printMatrix(matrix) {
	 var m = matrix.elements;
	 console.log(m[0], m[1], m[2], m[3]);
	 console.log(m[4], m[5], m[6], m[7]);
	 console.log(m[8], m[9], m[10], m[11]);
	 console.log(m[12], m[13], m[14], m[15]);
 }
 
 /**
	* Entry point when page is loaded.
	*
	* Basically this function does setup that "should" only have to be done once,<br>
	* while {@link draw} does things that have to be repeated each time the canvas is
	* redrawn.
	*/
 function mainEntrance() {
	 // retrieve <canvas> element
	 var canvas = document.getElementById("theCanvas");
 
	 // key handler
	 window.onkeydown = handleKeyPress;
	
	 // get the rendering context for WebGL
	 gl = canvas.getContext("webgl2");
	 if (!gl) {
		 console.log("Failed to get the rendering context for WebGL2");
		 return;
	 }
 
	 // load and compile the shader pair, using utility from the teal book
	 var vshaderSource = document.getElementById("vertexShader").textContent;
	 var fshaderSource = document.getElementById("fragmentShader").textContent;
	 if (!initShaders(gl, vshaderSource, fshaderSource)) {
		console.log("Failed to initialize shaders.");
		return;
	 }
 
	 // retain a handle to the shader program, then unbind it
	 // This looks odd, but the way initShaders works is that it "binds" the shader and
	 // stores the handle in an extra property of the gl object.
	 // That's ok, but will really mess things up when we have more than one shader pair.
	 shader = gl.program;
	 gl.useProgram(null);
 
	 // request a handle for a chunk of GPU memory
	 vertexbuffer = gl.createBuffer();
	 if (!vertexbuffer) {
		console.log("Failed to create the buffer object");
		return;
	 }
 
	 // "bind" the buffer as the current array buffer
	 gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);
 
	 // load our data onto the GPU (uses the currently bound buffer)
	 gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
 
	 // now that the buffer is filled with data, we can unbind it
	 // (we still have the handle, so we can bind it again when needed)
	 gl.bindBuffer(gl.ARRAY_BUFFER, null);
 
	 // buffer for the color data
	 colorbuffer = gl.createBuffer();
	 if (!colorbuffer) {
		console.log("Failed to create the buffer object");
		return;
	 }
 
	 // "bind" the buffer as the current array buffer
	 gl.bindBuffer(gl.ARRAY_BUFFER, colorbuffer);
 
	 // load our data onto the GPU (uses the currently bound buffer)
	 gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
 
	 // now that the buffer is set up, we can unbind the buffer
	 // (we still have the handle, so we can bind it again when needed)
	 gl.bindBuffer(gl.ARRAY_BUFFER, null);
 
	 // specify a fill color for clearing the framebuffer
	 gl.clearColor(0.4, 0.4, 0.45, 1.0);
 
	 // set up an animation loop
	 modelMatrix = new Matrix4();
 
	 /**
		* A closure to set up an animation loop in which the
		* angle grows by "increment" each frame.
		* @return {loop} animation loop.
		* @function
		* @global
		*/
	 var runanimation = (() => {
		 // control the rotation angle
		 var ang = 0.0;
 
		 // translation
		 var tx = 0;
		 var ty = 0;
 
		 // angle increment
		 var increment = 2.0;
 
		 // current corner for rotation
		 var corner = new Vector4([...getVertex(cindex), 0.0, 1.0]);

		 var cornersIndexes = [0,1,2,5];
 
		 // detecting collision
		 function detectCollision() {
			for (let i = 0; i < cornersIndexes.length; i++) {
				const cornerIndex = cornersIndexes[i];
				const position = getTransformedPosition(cornerIndex);
		
				const [x, y] = position;
				const halfSize = wsize / 2;
		
				if (x < -halfSize) {
					doCollision(cornerIndex, 0); // Left
				} else if (x > halfSize) {
					doCollision(cornerIndex, 1); // Right
				} else if (y < -halfSize) {
					doCollision(cornerIndex, 3); // Up
				} else if (y > halfSize) {
					doCollision(cornerIndex, 2); // Down
				}
			}
		}

		function getTransformedPosition(cornerIndex) {
			const corner = new Vector4([...getVertex(cornerIndex), 0.0, 1.0]);
			const transformedCorner = modelMatrix.multiplyVector4(corner);
			return transformedCorner.elements.slice(0, 2); // return x y coords
		}

		 // what will happen after collision
		 function doCollision(collidedIndex, collisionType) {
			const translationAmount = 0.08;
			const translateMatrix = new Matrix4();
		
			const translations = {
				0: [translationAmount, 0, 0],   // Left
				1: [-translationAmount, 0, 0],  // Right
				2: [0, -translationAmount, 0],  // Up
				3: [0, translationAmount, 0]    // Down
			};
		
			const translation = translations[collisionType];
			translateMatrix.setTranslate(translation[0], translation[1], translation[2]);
			modelMatrix = translateMatrix.multiply(modelMatrix);
		
			if (collisionMode === 0) {
				cindex = collidedIndex;
				click = true;
			} else {
				increment *= -1;
			}
		}
 
		 /**)
			* <p>Keep drawing frames.</p>
			* Request that the browser calls {@link runanimation} again "as soon as it can".
			* @callback loop
			* @see https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
			*/
		 return () => {
			 detectCollision();
			 ang += increment;
			 ang = ang % 360;
			 if (click) {
				 var [vx, vy] = getVertex(cindex);
				 corner.elements[0] = vx;
				 corner.elements[1] = vy;
				 corner = modelMatrix.multiplyVector4(corner);
				 tx = corner.elements[0] - vx;
				 ty = corner.elements[1] - vy;
 
				 click = false;
			 }
			 rotateAndScaleAboutCorner(ang, corner.elements[0], corner.elements[1], tx, ty);
 
			 draw();
 
			 requestAnimationFrame(runanimation);
		 };
	 })();
 
	 // draw!
	 runanimation();
 }