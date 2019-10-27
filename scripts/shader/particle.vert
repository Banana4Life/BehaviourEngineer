attribute vec4 vertexPosition;
attribute vec4 color;
attribute mediump float size;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform lowp float scale;

varying vec4 pointColor;
varying mediump float radius;
varying mediump float pSize;

void main() {
    vec4 rounded = vec4(floor(vertexPosition.x + 0.5), floor(vertexPosition.y + 0.5), vertexPosition.z, vertexPosition.w);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * rounded;
    gl_PointSize = scale * 200.0;
    pSize = gl_PointSize / 2.0;
    radius = size * scale / 2.0;
    pointColor = color.rgba;
}