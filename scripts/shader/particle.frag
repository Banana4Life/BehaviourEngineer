#extension GL_OES_standard_derivatives : enable
#define M_PI 3.1415926535897932384626433832795

varying mediump vec4 pointColor;
varying mediump float radius;

void main() {
    mediump vec2 diff = 2.0 * gl_PointCoord - 1.0;
    mediump float distance = dot(diff, diff);
    mediump float angle = ((atan(diff.y, diff.x) / M_PI) + 1.0) / 2.0;
    //mediump float delta = fwidth(distance);
    //mediump float alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, distance);

    gl_FragColor = pointColor;
    gl_FragColor.a = 0.2/max(0.0, distance - 0.3) - 0.15;
}