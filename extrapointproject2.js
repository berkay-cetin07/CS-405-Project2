/**Berkay Cetin-30697-3/12/2024-extrapointquestion-task4
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
        this.prog = InitShaderProgram(meshVS, meshFS);
    
        this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
        this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');
        this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
        this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');
        this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
        this.specularIntLoc = gl.getUniformLocation(this.prog, 'specularInt');
        this.viewPosLoc = gl.getUniformLocation(this.prog, 'viewPos');
    
        // Multiple texture support
        this.textures = []; // Array to store multiple textures
        this.blendFactorLoc = gl.getUniformLocation(this.prog, 'blendFactor');
    
        this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
        this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');
    
        this.vertbuffer = gl.createBuffer();
        this.texbuffer = gl.createBuffer();
    
        this.numTriangles = 0;
    
        // Default lighting parameters
        this.ambient = 0.5;
        this.specularInt = 1.0; // Default specular intensity
        this.lightPos = [1.0, 1.0, 1.0];
        this.viewPos = [0.0, 0.0, 3.0]; // Camera position
    }
    
	setAdditionalTexture(img) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
    
        // Set the texture image data
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    
        // Handle non-power-of-2 textures
        if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
    
        this.textures.push(texture);
    }
    
	

	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
	
		// Update normal buffer for lighting
		if (normalCoords) {
			this.normalBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);
			this.normalLoc = gl.getAttribLocation(this.prog, 'normal');
		}
	
		this.numTriangles = vertPos.length / 3;
	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
        gl.useProgram(this.prog);
    
        gl.uniformMatrix4fv(this.mvpLoc, false, trans);
        gl.uniform1f(this.ambientLoc, this.ambient);
        gl.uniform1f(this.specularIntLoc, this.specularInt);
        gl.uniform3fv(this.lightPosLoc, new Float32Array(this.lightPos));
        gl.uniform3fv(this.viewPosLoc, new Float32Array(this.viewPos));
    
        // Bind and activate textures
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textures[0]); // First texture
        gl.uniform1i(gl.getUniformLocation(this.prog, 'tex1'), 0);
    
        if (this.textures.length > 1) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.textures[1]); // Second texture
            gl.uniform1i(gl.getUniformLocation(this.prog, 'tex2'), 1);
    
            // Set blending factor (for example, 0.5 for equal blending)
            gl.uniform1f(this.blendFactorLoc, 0.5);
        }
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.enableVertexAttribArray(this.vertPosLoc);
        gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.enableVertexAttribArray(this.texCoordLoc);
        gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    
        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }
    
	
	

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
	
		// Set the texture image data
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
	
		// Handle non-power-of-2 textures
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			// Set texture wrapping to clamp to edge
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	
			// Set texture filtering to linear
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		}
	
		gl.useProgram(this.prog);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
	
		const sampler = gl.getUniformLocation(this.prog, 'tex');
		gl.uniform1i(sampler, 0);
	}
	

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

	enableLighting(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.enableLightingLoc, show);
	}
	
	
	setAmbientLight(ambient) {
		this.ambient = ambient;
	}
	setSpecularLight(specular) {
		this.specularInt = specular;
	}
	
}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 

			void main()
			{
				v_texCoord = texCoord;
				v_normal = normal;

				gl_Position = mvp * vec4(pos,1);
			}`;

// Fragment shader source code

const meshFS = `
			precision mediump float;

            uniform bool showTex;
            uniform bool enableLighting;
            uniform sampler2D tex1; // First texture
            uniform sampler2D tex2; // Second texture
            uniform float blendFactor; // Blend factor (0.0 to 1.0)

            uniform vec3 lightPos;     // Light position
            uniform float ambient;     // Ambient light intensity
            uniform float specularInt; // Specular intensity
            uniform vec3 viewPos;      // Viewer position (camera)

            varying vec2 v_texCoord;
            varying vec3 v_normal;

            void main() {
                vec3 normal = normalize(v_normal);
                vec3 lightDir = normalize(lightPos - vec3(0.0)); // Direction to the light
                vec3 viewDir = normalize(viewPos - vec3(0.0));   // Direction to the viewer
                vec3 reflectDir = reflect(-lightDir, normal);    // Reflection direction

                // Ambient lighting
                vec3 ambientLight = ambient * vec3(1.0, 1.0, 1.0);

                // Diffuse lighting
                float diff = max(dot(normal, lightDir), 0.0);
                vec3 diffuseLight = diff * vec3(1.0, 1.0, 1.0);

                // Specular lighting
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0); // Shininess exponent
                vec3 specularLight = specularInt * spec * vec3(1.0, 1.0, 1.0);

                // Combine textures
                vec4 texColor1 = texture2D(tex1, v_texCoord);
                vec4 texColor2 = texture2D(tex2, v_texCoord);
                vec3 blendedColor = mix(texColor1.rgb, texColor2.rgb, blendFactor);

                // Combine lighting
                vec3 finalColor = blendedColor * (ambientLight + diffuseLight + specularLight);

                if (enableLighting) {
                    gl_FragColor = vec4(finalColor, texColor1.a);
                } else if (showTex) {
                    gl_FragColor = vec4(blendedColor, texColor1.a);
                } else {
                    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Default fallback color
                }
            }


`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
    const translationSpeed = 0.1;
    if (keys['ArrowUp']) meshDrawer.lightPos[1] += translationSpeed;
    if (keys['ArrowDown']) meshDrawer.lightPos[1] -= translationSpeed;
    if (keys['ArrowRight']) meshDrawer.lightPos[0] += translationSpeed;
    if (keys['ArrowLeft']) meshDrawer.lightPos[0] -= translationSpeed;
}
function SetSpecularLight(param) {
    meshDrawer.setSpecularLight(param.value / 100.0); // Scale slider value
    DrawScene();
}
function LoadAdditionalTexture(param) {
    if (param.files && param.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                meshDrawer.setAdditionalTexture(img);
                DrawScene();
            };
        };
        reader.readAsDataURL(param.files[0]);
    }
}



///////////////////////////////////////////////////////////////////////////////////