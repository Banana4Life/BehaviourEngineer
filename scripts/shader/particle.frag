#define M_PI 3.1415926535897932384626433832795

varying mediump vec4 pointColor;
varying mediump float radius;

void main() {
    mediump vec2 diff = 2.0 * gl_PointCoord - 1.0;
    mediump float distance = dot(diff, diff);
    mediump float angle = atan(diff.y, diff.x) + M_PI;

    gl_FragColor = pointColor;

    mediump float pow3Signal = -7.0 * pow(distance - 0.5, 3.0) + -1.0 * pow(distance, 2.0) + 0.7;
    mediump float sinSignal = sin(sin(angle)*angle*angle + radius);
    gl_FragColor.a = pow3Signal + clamp(sinSignal, 0.0, 0.1);

}
