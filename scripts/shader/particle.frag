#define M_PI 3.1415926535897932384626433832795

varying mediump vec4 pointColor;
varying mediump float radius;

void main() {
    mediump vec2 diff = 2.0 * gl_PointCoord - 1.0;
    mediump float distance = dot(diff, diff);
    mediump float angle = atan(diff.y, diff.x) + M_PI;

    gl_FragColor = pointColor;
    gl_FragColor.a = 1.0 - distance * 0.8 + clamp(sin(angle * 16.0), 0.0, 0.1) / 1.1;
}
