attribute vec4 vertexPosition;
attribute vec4 color;
attribute lowp float size;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

varying vec4 pointColor;

void main() {
    vec4 rounded = vec4(floor(vertexPosition.x + 0.5), floor(vertexPosition.y + 0.5), vertexPosition.z, vertexPosition.w);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * rounded;
    gl_PointSize = size;
    pointColor = color.rgba;
}