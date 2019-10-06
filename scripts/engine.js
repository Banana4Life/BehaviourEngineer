const mat4 = {
    identity: [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ],

    orthographicProjectionFull: function (left, right, top, bottom, near, far) {
        return [
            2 / (right - left), 0, 0, 0,
            0, 2 / (top - bottom), 0, 0,
            0, 0, 2 / (far - near), 0,
            -((right + left) / (right - left)), -((top + bottom) / (top - bottom)), -((far + near) / (far - near)), 1
        ]
    },

    orthographicProjection: function (width, height, depth) {
        return [
            2 / width, 0, 0, 0,
            0, 2 / height, 0, 0,
            0, 0, 2 / depth, 0,
            0, 0, 0, 1,
        ];
    },

    transpose: function (a) {
        return [
            a[0], a[4], a[8], a[12],
            a[1], a[5], a[9], a[13],
            a[2], a[6], a[10], a[14],
            a[3], a[7], a[11], a[15],
        ]
    },

    invert: function (a) {
        const b = new Array(16);
        b[0] = a[5] * a[10] * a[15] - a[5] * a[14] * a[11] - a[6] * a[9] * a[15] + a[6] * a[13] * a[11] + a[7] * a[9] * a[14] - a[7] * a[13] * a[10];
        b[1] = -a[1] * a[10] * a[15] + a[1] * a[14] * a[11] + a[2] * a[9] * a[15] - a[2] * a[13] * a[11] - a[3] * a[9] * a[14] + a[3] * a[13] * a[10];
        b[2] = a[1] * a[6] * a[15] - a[1] * a[14] * a[7] - a[2] * a[5] * a[15] + a[2] * a[13] * a[7] + a[3] * a[5] * a[14] - a[3] * a[13] * a[6];
        b[3] = -a[1] * a[6] * a[11] + a[1] * a[10] * a[7] + a[2] * a[5] * a[11] - a[2] * a[9] * a[7] - a[3] * a[5] * a[10] + a[3] * a[9] * a[6];

        b[4] = -a[4] * a[10] * a[15] + a[4] * a[14] * a[11] + a[6] * a[8] * a[15] - a[6] * a[12] * a[11] - a[7] * a[8] * a[14] + a[7] * a[12] * a[10];
        b[5] = a[0] * a[10] * a[15] - a[0] * a[14] * a[11] - a[2] * a[8] * a[15] + a[2] * a[12] * a[11] + a[3] * a[8] * a[14] - a[3] * a[12] * a[10];
        b[6] = -a[0] * a[6] * a[15] + a[0] * a[14] * a[7] + a[2] * a[4] * a[15] - a[2] * a[12] * a[7] - a[3] * a[4] * a[14] + a[3] * a[12] * a[6];
        b[7] = a[0] * a[6] * a[11] - a[0] * a[10] * a[7] - a[2] * a[4] * a[11] + a[2] * a[8] * a[7] + a[3] * a[4] * a[10] - a[3] * a[8] * a[6];

        b[8] = a[4] * a[9] * a[15] - a[4] * a[13] * a[11] - a[5] * a[8] * a[15] + a[5] * a[12] * a[11] + a[7] * a[8] * a[13] - a[7] * a[12] * a[9];
        b[9] = -a[0] * a[9] * a[15] + a[0] * a[13] * a[11] + a[1] * a[8] * a[15] - a[1] * a[12] * a[11] - a[3] * a[8] * a[13] + a[3] * a[12] * a[9];
        b[10] = a[0] * a[5] * a[15] - a[0] * a[13] * a[7] - a[1] * a[4] * a[15] + a[1] * a[12] * a[7] + a[3] * a[4] * a[13] - a[3] * a[12] * a[5];
        b[11] = -a[0] * a[5] * a[11] + a[0] * a[9] * a[7] + a[1] * a[4] * a[11] - a[1] * a[8] * a[7] - a[3] * a[4] * a[9] + a[3] * a[8] * a[5];

        b[12] = -a[4] * a[9] * a[14] + a[4] * a[13] * a[10] + a[5] * a[8] * a[14] - a[5] * a[12] * a[10] - a[6] * a[8] * a[13] + a[6] * a[12] * a[9];
        b[13] = a[0] * a[9] * a[14] - a[0] * a[13] * a[10] - a[1] * a[8] * a[14] + a[1] * a[12] * a[10] + a[2] * a[8] * a[13] - a[2] * a[12] * a[9];
        b[14] = -a[0] * a[5] * a[14] + a[0] * a[13] * a[6] + a[1] * a[4] * a[14] - a[1] * a[12] * a[6] - a[2] * a[4] * a[13] + a[2] * a[12] * a[5];
        b[15] = a[0] * a[5] * a[10] - a[0] * a[9] * a[6] - a[1] * a[4] * a[10] + a[1] * a[8] * a[6] + a[2] * a[4] * a[9] - a[2] * a[8] * a[5];

        const det = a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12];
        for (let i = 0; i < b.length; i++) {
            b[i] /= det;
        }

        return b;
    },

    multiply: function (a, b) {
        return [
            a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12], a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13], a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14], a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15],
            a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12], a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13], a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14], a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15],
            a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12], a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13], a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14], a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15],
            a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12], a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13], a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14], a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15],
        ];
    },

    multiplyV4: function (m, v) {
        return [
            m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[3] * v[3],
            m[4] * v[0] + m[5] * v[1] + m[6] * v[2] + m[7] * v[3],
            m[8] * v[0] + m[9] * v[1] + m[10] * v[2] + m[11] * v[3],
            m[12] * v[0] + m[13] * v[1] + m[14] * v[2] + m[15] * v[3],
        ];
    },

    translation: function (x, y, z) {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1,
        ];
    },

    scale: function (x, y, z) {
        return [
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1,
        ];
    },

    rotation: function (w, x, y, z) {

        let a = [
            w, z, -y, x,
            -z, w, x, y,
            y, -x, w, z,
            -x, y, -z, w
        ];

        let b = [
            w, z, -y, -x,
            -z, w, x, -y,
            y, -x, w, -z,
            x, y, z, w
        ];

        return mat4.multiply(a, b);

    }

};

const vec2d = {
    squaredLength(x, y) {
        if (Array.isArray(x)) {
            [x, y] = x;
        }
        return x * x + y * y;
    },
    length: function (x, y) {
        if (Array.isArray(x)) {
            [x, y] = x;
        }
        return Math.sqrt(vec2d.squaredLength(x, y));
    },
    normalize: function (x, y) {
        if (Array.isArray(x)) {
            [x, y] = x;
        }
        const len = vec2d.length(x, y);
        return [x / len, y / len];
    },
    normalizeOrZero: function (x, y) {
        if (Array.isArray(x)) {
            [x, y] = x;
        }
        const len = vec2d.length(x, y);
        if (len === 0) {
            return [0, 0]
        }
        return [x / len, y / len];
    },
};

const vec = {
    distance: function(a, b) {
        return [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    },
    squaredLength: function(x, y, z) {
        if (Array.isArray(x)) {
            [x, y, z] = x;
        }
        return x * x + y * y * z * z;
    },

    length: function (x, y, z) {
        if (Array.isArray(x)) {
            [x, y, z] = x;
        }
        return Math.sqrt(vec.squaredLength(x, y, z));
    },
    normalize: function (x, y, z) {
        if (Array.isArray(x)) {
            [x, y, z] = x;
        }
        const len = vec.length(x, y, z);
        return [x / len, y / len, z / len];
    },
    normalizeInPlace: function (v) {
        const len = vec.length(v[0], v[1], v[2]);
        v[0] /= len;
        v[1] /= len;
        v[2] /= len;
    },

    scale(s, x, y, z) {
        if (Array.isArray(x)) {
            [x, y, z] = x;
        }
        return [x * s, y * s, z * s];
    },

    scaleInPlace(v, s) {
        v[0] *= s;
        v[1] *= s;
        v[2] *= s;
    },

    dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    },

    add(a, b) {
        return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    },

    addInPlace(a, b) {
        a[0] += b[0];
        a[1] += b[1];
        a[2] += b[2];
    },

    set(v, x, y = x, z = x) {
        if (Array.isArray(x)) {
            [x, y, z] = x;
        }
        v[0] = x;
        v[1] = y;
        v[2] = z;
    }
};

const color = {
    red: [1, 0, 0, 1],
    green: [0, 1, 0, 1],
    blue: [0, 0, 1, 1],
    magenta: [1, 0, 1, 1],
    white: [1, 1, 1, 1],

    vec2css: function(r, g, b, a) {
        if (Array.isArray(r)) {
            [r, g, b, a] = r;
        }

        function toCSS(v) {
            return Math.floor((v * 255.0) % 256);
        }


        return `rgba(${toCSS(r)}, ${toCSS(g)}, ${toCSS(b)}, ${a})`;
    },

    hsv2rgb: function (hue, saturation, value, alpha = 1) {
        if (Array.isArray(hue)) {
            [hue, saturation, value, alpha] = hue;
        }
        const chroma = value * saturation;
        const hueSection = ((hue + 360) % 360) / 60;
        const x = chroma * (1 - Math.abs((hueSection % 2) - 1));
        const m = value - chroma;

        let r = 0;
        let g = 0;
        let b = 0;

        if (0 <= hueSection && hueSection <= 1) {
            r = chroma;
            g = x;
        } else if (1 <= hueSection && hueSection <= 2) {
            r = x;
            g = chroma;
        } else if (2 <= hueSection && hueSection <= 3) {
            g = chroma;
            b = x;
        } else if (3 <= hueSection && hueSection <= 4) {
            g = x;
            b = chroma;
        } else if (4 <= hueSection && hueSection <= 5) {
            r = x;
            b = chroma;
        } else if (5 <= hueSection && hueSection <= 6) {
            r = chroma;
            b = x;
        }

        return [r + m, g + m, b + m, alpha];
    },

    rgb2hsv: function (red, green, blue, alpha = 1) {
        if (Array.isArray(red)) {
            [red, green, blue, alpha] = red;
        }
        const max = Math.max(red, Math.min(green, blue));
        const min = Math.min(red, Math.min(green, blue));

        const delta = max - min;

        let hue = 0;
        let saturation = 0;
        const value = max;

        if (min === max) {
            hue = 0;
        } else if (max === red) {
            hue = 60 * (((green - blue) % 6) / delta);
        } else if (max === green) {
            hue = 60 * ((blue - red) / delta + 2);
        } else if (max === blue) {
            hue = 60 * ((red - green) / delta + 4);
        } else {
            throw "Hue calculation failed!"
        }

        if (max > 0) {
            saturation = delta / max;
        }

        if (hue < 0) {
            hue += 360;
        }

        return [hue, saturation, value, alpha]
    },

    temperature2rgb: function (kelvin, alpha = 1) {
        function clamp(x, min, max) {
            if (x < min) {
                return min;
            }
            if (x > max) {
                return max;
            }
            return x;
        }

        let temp = kelvin / 100;
        let red, green, blue;

        if (temp <= 66) {

            red = 255;

            green = temp;
            green = 99.4708025861 * Math.log(green) - 161.1195681661;


            if (temp <= 19) {

                blue = 0;

            } else {

                blue = temp - 10;
                blue = 138.5177312231 * Math.log(blue) - 305.0447927307;

            }

        } else {

            red = temp - 60;
            red = 329.698727446 * Math.pow(red, -0.1332047592);

            green = temp - 60;
            green = 288.1221695283 * Math.pow(green, -0.0755148492);

            blue = 255;

        }

        return [clamp(red, 0, 255) / 255, clamp(green, 0, 255) / 255, clamp(blue, 0, 255) / 255, alpha];
    },

    withLightness(c, lightness) {
        let [h, s, v, a] = color.rgb2hsv(c);
        return color.hsv2rgb(h, s, lightness, a);
    }
};

const aabb = {
    findAABB: function (mesh, transform) {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;

        let transformation = mat4.transpose(transform.getTransformation());

        for (let i = 0; i < mesh.vertexCount; ++i) {
            let x = mesh.vertices[i];
            let y = 0;
            let z = 0;

            if (mesh.vertexSize > 1) {
                y = mesh.vertices[i + 1];
            }

            if (mesh.vertexSize > 2) {
                z = mesh.vertices[i + 2];
            }

            let [tx, ty, tz,] = mat4.multiplyV4(transformation, [x, y, z, 1]);
            if (tx < minX) {
                minX = tx;
            }
            if (tx > maxX) {
                maxX = tx;
            }
            if (ty < minY) {
                minY = ty;
            }
            if (ty > maxY) {
                maxY = ty;
            }
            if (tz < minZ) {
                minZ = tz;
            }
            if (tz > maxZ) {
                maxZ = tz;
            }
        }

        return [[minX, minY, minZ], [maxX - minX, maxY - minY, maxZ - minZ]]
    }
};

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        let infoLog = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error('An error occurred compiling the shaders: ' + infoLog);
    }

    return shader;
}

function loadShader(gl, baseName, attributes, uniforms) {

    function location(name, type) {
        switch (type) {
            case gl.VERTEX_SHADER:
                return `${name}.vert`;
            case gl.FRAGMENT_SHADER:
                return `${name}.frag`;
            default:
                throw "unknown type";
        }
    }

    function compile(as) {
        return source => compileShader(gl, as, source);
    }

    let vertex = fetch(location(baseName, gl.VERTEX_SHADER))
        .then(response => response.text())
        .then(compile(gl.VERTEX_SHADER));

    let fragment = fetch(location(baseName, gl.FRAGMENT_SHADER))
        .then(response => response.text())
        .then(compile(gl.FRAGMENT_SHADER));

    return Promise.all([vertex, fragment]).then(([vertexShader, fragmentShader]) => {
        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            let infoLog = gl.getProgramInfoLog(shaderProgram);
            gl.deleteProgram(shaderProgram);
            throw new Error('Unable to initialize the shader program: ' + infoLog);
        }

        let shader = {
            program: shaderProgram,
            attribute: {},
            uniform: {},
        };

        for (let attribute of attributes) {
            shader.attribute[attribute] = gl.getAttribLocation(shaderProgram, attribute);
        }

        for (let uniform of uniforms) {
            shader.uniform[uniform] = gl.getUniformLocation(shaderProgram, uniform);
        }

        return shader;
    });
}

class Mesh {
    constructor(gl, vertexSize, vertices) {
        this.vertexSize = vertexSize;
        this.vertices = vertices;
        this.vertexCount = this.vertices.length / this.vertexSize;
        this.dataType = gl.FLOAT;

        this.buffer = gl.createBuffer();
        this.bind(gl);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    }

    bind(gl) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    }

    static createRect(gl, width, height = width) {
        return new Mesh(gl, 2, [
            0, 0,
            0, height,
            width, height,

            0, 0,
            width, height,
            width, 0
        ]);
    }

    static createCenteredRect(gl, width, height = width) {
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        return new Mesh(gl, 2, [
            -halfWidth, -halfHeight,
            -halfWidth, halfHeight,
            halfWidth, halfHeight,

            -halfWidth, -halfHeight,
            halfWidth, halfHeight,
            halfWidth, -halfHeight
        ]);
    }
}

class Transform {
    constructor() {
        this.setPosition(0, 0, 0);
        this.setScale(1, 1, 1);
        this.setAngleAxis(0, 0, 0, 1);

        this.dirty = true;
        this.transform = mat4.identity;
    }

    set(otherTransform) {
        this.setPosition(otherTransform.getPosition());
        this.setScale(otherTransform.getScale());
        this.setRotationQuaternion(otherTransform.getRotationQuaternion());
    }

    setPosition(x, y, z) {
        if (Array.isArray(x)) {
            [x, y, z] = x;
        }
        this.posX = x;
        this.posY = y;
        this.posZ = z;
        this.translation = mat4.translation(x, y, z);

        this.dirty = true;
    }

    getPosition() {
        return [this.posX, this.posY, this.posZ];
    }

    move(x, y, z = 0) {
        if (Array.isArray(x)) {
            [x, y, z] = x;
        }
        this.setPosition(this.posX + x, this.posY + y, this.posZ + z);
    }

    setScale(x, y = x, z = x) {
        if (Array.isArray(x)) {
            [x, y, z] = x;
        }
        this.scaleX = x;
        this.scaleY = y;
        this.scaleZ = z;
        this.scale = mat4.scale(x, y, z);

        this.dirty = true;
    }

    getScale() {
        return [this.scaleX, this.scaleY, this.scaleZ];
    }

    setRotationQuaternion(w, x, y, z) {
        if (Array.isArray(w)) {
            [w, x, y, z] = w;
        }
        this.rotW = w;
        this.rotX = x;
        this.rotY = y;
        this.rotZ = z;
        this.rotation = mat4.rotation(w, x, y, z);

        this.dirty = true;
    }

    getRotationQuaternion() {
        return [this.rotW, this.rotX, this.rotY, this.rotZ];
    }

    setAngleAxis(angle, x, y, z) {
        let halfAngle = angle / 2.0;
        let s = Math.sin(halfAngle);

        this.setRotationQuaternion(Math.cos(halfAngle), x * s, y * s, z * s);
    }

    getAngleAxis() {
        let angle = 2.0 * Math.acos(this.rotW);
        if (angle === 0) {
            return [0, 0, 1, 0];
        }
        let s = Math.sqrt(1.0 - this.rotW * this.rotW);
        let x = this.rotX / s;
        let y = this.rotY / s;
        let z = this.rotZ / s;

        return [angle, x, y, z];
    }

    setEulerAngles(roll, pitch, yaw) {
        if (Array.isArray(roll)) {
            [roll, pitch, yaw] = roll;
        }
        const cy = Math.cos(yaw * 0.5);
        const sy = Math.sin(yaw * 0.5);
        const cp = Math.cos(pitch * 0.5);
        const sp = Math.sin(pitch * 0.5);
        const cr = Math.cos(roll * 0.5);
        const sr = Math.sin(roll * 0.5);

        this.setRotationQuaternion(cy * cp * cr + sy * sp * sr, cy * cp * sr - sy * sp * cr, sy * cp * sr + cy * sp * cr, sy * cp * cr - cy * sp * sr)
    }

    getEulerAngles() {
        const sinr_cosp = 2.0 * (this.rotW * this.rotX + this.rotY * this.rotZ);
        const cosr_cosp = 1.0 - 2.0 * (this.rotX * this.rotX + this.rotY * this.rotY);
        const roll = Math.atan2(sinr_cosp, cosr_cosp);

        const sinp = +2.0 * (this.rotW * this.rotY - this.rotZ * this.rotX);
        let pitch = 0;
        if (Math.abs(sinp) >= 1) {
            pitch = Math.sign(sinp) * (Math.PI / 2); // use 90 degrees if out of range
        } else {
            pitch = Math.asin(sinp);
        }


        const siny_cosp = +2.0 * (this.rotW * this.rotZ + this.rotX * this.rotY);
        const cosy_cosp = +1.0 - 2.0 * (this.rotY * this.rotY + this.rotZ * this.rotZ);
        const yaw = Math.atan2(siny_cosp, cosy_cosp);

        return [roll, pitch, yaw];
    }

    getTransformation() {
        if (this.dirty) {
            this.transform = mat4.multiply(this.rotation, mat4.multiply(this.scale, this.translation));
            this.dirty = false;
        }
        return this.transform;
    }
}

class Simulation {
    constructor(canvas, gl, shader) {
        this.canvas = canvas;
        this.gl = gl;
        this.shader = shader;
        this.view = mat4.identity;

        this.tempParticles = [];
        this.allParticles = [];
        this.deadParticles = [];
        this.particlePoolSize = 5000;

        this.particlePointBuffer = gl.createBuffer();
        this.particleColorBuffer = gl.createBuffer();
        this.particleSizeBuffer = gl.createBuffer();
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseReachable = false;
        this.particleSize = 10;
        this.updateCanvas();

        this.spaceDimension = 1000;
        this.topLeftCorner = [-this.spaceDimension / 2, this.spaceDimension / 2, 0, 1];
        this.bottomRightCorner = [this.spaceDimension / 2, -this.spaceDimension / 2, 0, 1];

        this.updateProjection();

        this.simulationSpeedMulti = 1;
    }

    setPoolSize(size) {
        this.particlePoolSize = size;
    }

    canSpawn() {
        return this.allParticles.length < this.particlePoolSize;
    }


    initWithType(particle, type) {
        particle.type = type;
        this.init(particle);
    }

    init(particle) {

    }

    spawn(type) {
        if (!this.canSpawn()) {
            console.log("Cannot Spawn! :(")
            return null;
        }
        let particle;
        if (this.deadParticles.length > 0) {
            particle = this.deadParticles.shift();
            particle.spawn();
        } else {
            particle = this.createParticle();
            this.allParticles.push(particle);
        }

        // if (this.aliveParticles.filter(p => p.id === particle.id).length > 0) {
        //     debugger
        // }
        this.initWithType(particle, type);

        return particle;
    }

    createParticle() {
        return new Particle();
    }

    kill(particle) {
        if (!particle.alive) {
            debugger
            throw new Error("Dead Particles cannot die! (I think)")
        }
        particle.alive = false;
        this.deadParticles.push(particle);
    }

    updateCanvas() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        let sideLength = Math.min(this.canvas.width, this.canvas.height);

        this.canvasWidthOffset = (this.canvas.width - sideLength) /2;
        this.canvasHeightOffset = (this.canvas.height - sideLength) /2;
        this.gl.viewport(this.canvasWidthOffset, this.canvasHeightOffset, sideLength, sideLength);
    }

    updateProjection() {
        this.zoom = window.devicePixelRatio;
        this.projection = mat4.orthographicProjection(this.spaceDimension, this.spaceDimension, 10);
        this.reverseProjection = mat4.invert(mat4.multiply(this.view, this.projection));
    }

    update(dt) {
        dt *= this.simulationSpeedMulti;
        if (this.canvas.width !== this.canvas.clientWidth || this.canvas.height !== this.canvas.clientHeight) {
            this.updateCanvas();
        }
        if (this.zoom !== window.devicePixelRatio) {
            this.updateProjection();
        }
        this.simulateParticles(dt);
    }

    getMouseInWorld() {
        return this.browserPositionToWorld(this.mouseX, this.mouseY);
    }

    browserPositionToWorld(browserX, browserY) {
        let viewPortSize = Math.min(this.canvas.width, this.canvas.height);
        const x = browserX / (viewPortSize/ 2) - 1 - this.canvasWidthOffset / (viewPortSize / 2) ;
        const y = (this.canvas.height - browserY) / (viewPortSize / 2) - 1 - this.canvasHeightOffset / (viewPortSize / 2) ;
        return mat4.multiplyV4(this.reverseProjection, [x, y, 0, 1]);
    }

    makeDecision(particle, visibleNeighbours, dt) {

    }

    doAction(particle, visibleNeighbours, dt) {

    }

    doMovement(particle, visibleNeighbours, dt) {

        let tooClose = visibleNeighbours.filter(([p,]) => p.team === particle.team && p.type === particleType.CELL)
                         .filter(([p,d]) => d < sqr(particle.size) + sqr(p.size));
        let dxSum = 0;
        let dySum = 0;
        if (tooClose.length > 0) {
            for (let [closeParticle,] of tooClose) {
                let dx = particle.x - closeParticle.x;
                let dy = particle.y - closeParticle.y;
                dxSum += dx;
                dySum += dy;
            }
            if (dxSum !== 0 || dySum !== 0) {
                [dxSum, dySum] = vec2d.normalizeOrZero(dxSum, dySum)
            }
        }

        let [vx, vy] = vec2d.normalizeOrZero(
            particle.vx / particle.speed * 3 + dxSum,
            particle.vy / particle.speed * 3 + dySum);

        if (isNaN(vx)) {
            debugger
        }

        let newX = particle.x + vx * particle.speed * dt;
        let newY = particle.y + vy * particle.speed * dt;

        [particle.x, particle.y] = this.applyTorusWorld(newX, newY);
    }

    applyTorusWorld(newX, newY) {
        if (newX < this.topLeftCorner[0]) {
            newX = this.bottomRightCorner[0] - (this.topLeftCorner[0] - newX);
        } else if (newX >= this.bottomRightCorner[0]) {
            newX = this.topLeftCorner[0] + (newX - this.bottomRightCorner[0]);
        }

        if (newY > this.topLeftCorner[1]) {
            newY = this.bottomRightCorner[1] + (newY - this.topLeftCorner[1]);
        } else if (newY <= this.bottomRightCorner[1]) {
            newY = this.topLeftCorner[1] - (this.bottomRightCorner[1] - newY);
        }
        return [newX, newY];
    }

    simulateParticles(dt) {
        let qt = new ParticleQuadTree(this.topLeftCorner, this.bottomRightCorner);
        let setOfParticles = new Set();

        for (let particle of this.allParticles) {
            if (setOfParticles.has(particle)) {
                debugger
            }
            qt.add(particle);
            setOfParticles.add(particle);
        }

        this.tempParticles = [];
        for (let particle of this.allParticles) {
            if (!particle.alive) {
                continue;
            }

            let visibleNeighborsWithDistance = [];
            qt.forEachInCircle(particle.x, particle.y, particle.sightRange, (p, distanceSqr) => {
                if (p.alive && p.id !== particle.id) {
                    visibleNeighborsWithDistance.push([p, distanceSqr]);
                }
            });

            visibleNeighborsWithDistance.sort((a, b) => a[1] - b[1]);

            // for (let [otherParticle, distSqr] of visibleNeighborsWithDistance) {
            //     if (distSqr <= particle.attackRange * particle.attackRange && otherParticle.strength < particle.strength) {
            //         this.kill(otherParticle);
            //     }
            // }

            // for (let [otherParticle,] of visibleNeighborsWithDistance) {
            //     if (otherParticle.alive && otherParticle.male !== particle.male && this.canSpawn()) {
            //         let child = this.spawn();
            //         Particle.crossover(particle, otherParticle, child);
            //         child.x = particle.x + (otherParticle.x - particle.x);
            //         child.y = particle.y + (otherParticle.y - particle.y);
            //         break;
            //     }
            // }

            particle.decisionTimeout -= dt;
            if (particle.decisionTimeout <= 0) {
                this.makeDecision(particle, visibleNeighborsWithDistance, dt);
                particle.decisionTimeout = particle.decisionDuration;
            }
            this.doAction(particle, visibleNeighborsWithDistance, dt);

            if (particle.alive) {
                this.tempParticles.push(particle);
            }
        }
        this.allParticles = this.tempParticles;

    }



    render() {
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.useProgram(this.shader.program);

        this.uploadParticleAttribute("size", this.particleSizeBuffer, p => p.size, this.gl.FLOAT, 1);
        this.uploadParticleAttribute("vertexPosition", this.particlePointBuffer, p => [p.x, p.y], this.gl.FLOAT, 2);
        this.uploadParticleAttribute("color", this.particleColorBuffer, p => p.color, this.gl.FLOAT, 4);

        this.gl.uniformMatrix4fv(this.shader.uniform["modelMatrix"], false, mat4.identity);
        this.gl.uniformMatrix4fv(this.shader.uniform["viewMatrix"], false, this.view);
        this.gl.uniformMatrix4fv(this.shader.uniform["projectionMatrix"], false, this.projection);
        this.gl.uniform1f(this.shader.uniform["scale"], Math.min(this.canvas.width, this.canvas.height) / this.spaceDimension);

        this.gl.drawArrays(this.gl.POINTS, 0, this.allParticles.length);
    }

    uploadParticleAttribute(name, buffer, particleValue, type, size) {
        let data;
        if (type === this.gl.FLOAT) {
            data = new Float32Array(this.allParticles.length * size);
        } else {
            throw new Error("Unknown attribute data type: " + type)
        }
        for (let particleIndex = 0; particleIndex < this.allParticles.length; ++particleIndex) {
            let bufOffset = particleIndex * size;
            let particle = this.allParticles[particleIndex];
            let attribValue = particleValue(particle);
            if (size === 1 && !Array.isArray(attribValue)) {
                data[bufOffset] = attribValue;
            } else {
                for (let attribIndex = 0; attribIndex < size; ++attribIndex) {
                    data[bufOffset + attribIndex] = attribValue[attribIndex];
                }
            }
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.shader.attribute[name], size, type, false, 0, 0);
        this.gl.enableVertexAttribArray(this.shader.attribute[name]);
    }
}

class Particle {
    constructor() {
        this.spawn();

        this.color = color.blue;
    }

    spawn() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.alive = true;
    }

    static crossover(parentA, parentB, child) {
        let mom;
        let dad;
        if (parentB.male) {
            mom = parentA;
            dad = parentB;
        } else {
            mom = parentB;
            dad = parentA;
        }
        for (let prop in this) {
            if (this.hasOwnProperty(prop)) {
                child[prop] = randomBoolean() ? mom[prop] : dad[prop];
            }
        }
    }
}

class ParticleQuadTree {
    constructor(topLeft, bottomRight, limit = 40, maxDepth = 20, depth = 0) {
        if (depth > maxDepth) {
            throw new Error("tree too deep");
        }
        this.topLeft = topLeft;
        this.bottomRight = bottomRight;
        this.objects = [];
        this.limit = limit;
        this.depth = depth;
        this.maxDepth = maxDepth;
        this.hasChildren = false;

        this.topLeftQuad = null;
        this.topRightQuad = null;
        this.bottomLeftQuad = null;
        this.bottomRightQuad = null;
    }

    contains(x, y) {
        return ParticleQuadTree.rectContains(x, y, this.topLeft, this.bottomRight);
    }

    static rectContains(x, y, tl, br) {
        return x >= tl[0] && x < br[0] && y <= tl[1] && y > br[1];
    }

    rectOverlaps(l, r) {
        return ParticleQuadTree.rectsOverlap(this.topLeft, this.bottomRight, l, r)
    }

    static rectsOverlap(l1, r1, l2, r2) {
        if (l1[0] > r2[0] || l2[0] > r1[0]) {
            return false;
        }

        if (l1[1] < r2[1] || l2[1] < r1[1]) {
            return false;
        }

        return true;
    }

    forEachQuad(f) {
        if (!f(this.topLeftQuad)) {
            return true;
        }
        if (!f(this.topRightQuad)) {
            return true;
        }
        if (!f(this.bottomLeftQuad)) {
            return true;
        }
        if (!f(this.bottomRightQuad)) {
            return true;
        }
        return false;
    }

    add(particle) {
        this.addNode(particle);
    }

    addNode(particle) {
        if (this.hasChildren) {
            let success = this.forEachQuad(quad => {
                if (quad.contains(particle.x, particle.y)) {
                    quad.addNode(particle);
                    return false;
                }
                return true;
            });
            if (!success) {
                throw new Error(`Unable to put a particle in any of the quads! This is a bug... ${particle.x}:${particle.y}`)
            }
        } else {
            if (this.objects.length >= this.limit && this.depth < this.maxDepth) {
                let oldObjects = this.objects;
                this.objects = [];
                const [tl, tr, bl, br] = ParticleQuadTree.calculateInnerPoints(this.topLeft, this.bottomRight);
                this.topLeftQuad = new ParticleQuadTree(tl[0], tl[1], this.limit, this.maxDepth, this.depth + 1);
                this.topRightQuad = new ParticleQuadTree(tr[0], tr[1], this.limit, this.maxDepth, this.depth + 1);
                this.bottomLeftQuad = new ParticleQuadTree(bl[0], bl[1], this.limit, this.maxDepth, this.depth + 1);
                this.bottomRightQuad = new ParticleQuadTree(br[0], br[1], this.limit, this.maxDepth, this.depth + 1);
                this.hasChildren = true;

                for (let oldObject of oldObjects) {
                    this.addNode(oldObject)
                }
                this.addNode(particle);
            } else {
                this.objects.push(particle);
            }
        }
    }

    static calculateInnerPoints(tl, br) {
        let midX = (tl[0] + (br[0] - tl[0]) / 2);
        let midY = (tl[1] - (tl[1] - br[1]) / 2);

        let topCenter = [midX, tl[1]];
        let leftCenter = [tl[0], midY];
        let middleCenter = [midX, midY];
        let rightCenter = [br[0], midY];
        let bottomCenter = [midX, br[1]];

        return [
            [tl, middleCenter],
            [topCenter, rightCenter],
            [leftCenter, bottomCenter],
            [middleCenter, br]
        ]
    }

    selectRect(tl, br) {
        let out = [];
        this.forEachInRect(tl, br, p => {
            out.push(p);
        });
        return out;
    }

    forEachInRect(tl, br, f) {
        if (this.hasChildren) {
            this.forEachQuad(q => {
                if (q.rectOverlaps(tl, br)) {
                    q.forEachInRect(tl, br, f);
                }
                return true;
            });
        } else {
            for (let p of this.objects) {
                if (ParticleQuadTree.rectContains(p.x, p.y, tl, br)) {
                    f(p);
                }
            }
        }
    }

    selectCircle(centerX, centerY, radius) {
        const rl = [centerX - radius, centerY + radius];
        const br = [centerX + radius, centerY - radius];

        const radiusSqr = radius * radius;
        const out = [];
        this.forEachInCircle(rl, br, particle => {
            let dx = particle.x - centerX;
            let dy = particle.y - centerY;
            if ((dx * dx + dy * dy) <= radiusSqr) {
                out.push(particle)
            }
        });
        return out;
    }

    forEachInCircle(centerX, centerY, radius, f) {
        if (radius <= 0) {
            return [];
        }
        const rl = [centerX - radius, centerY + radius];
        const br = [centerX + radius, centerY - radius];

        const radiusSqr = radius * radius;
        const out = [];
        this.forEachInRect(rl, br, candidate => {
            let dx = candidate.x - centerX;
            let dy = candidate.y - centerY;
            let distanceSqr = dx * dx + dy * dy;
            if (distanceSqr <= radiusSqr) {
                f(candidate, distanceSqr);
            }
        });
        return out;
    }
}

function randomBoolean() {
    return !Math.floor(Math.random() * 2);
}

function random(min, max) {
    return min + Math.random() * (max - min);
}

function renderLoop(root, pt, f) {
    root.requestAnimationFrame(t => {
        let dt = 0;
        if (pt !== 0) {
            dt = (t - pt) / 1000;
        }
        f(dt);
        renderLoop(root, t, f);
    });
}

function measureTime(label, f) {
    const start = Date.now();
    const r = f();
    const delta = Date.now() - start;
    console.debug(`Time taken for ${label}: ${delta}ms`);
    return r;
}

function gaussianRand() {
    return (Math.random() + Math.random()) / 2;
}

function sqr(number) {
    return number * number;
}