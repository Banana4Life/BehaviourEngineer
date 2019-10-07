attribute vec4 vertexPosition;
attribute vec4 color;
attribute mediump float size;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform lowp float scale;

varying vec4 pointColor;
varying mediump float radius;

void main() {
    vec4 rounded = vec4(floor(vertexPosition.x + 0.5), floor(vertexPosition.y + 0.5), vertexPosition.z, vertexPosition.w);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * rounded;
    gl_PointSize = size * scale;
    radius = gl_PointSize / 2.0;
    pointColor = color.rgba;
}