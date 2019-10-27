#define M_PI 3.1415926535897932384626433832795

varying mediump vec4 pointColor;
varying mediump float radius;
varying mediump float pSize;

const mediump float circleBorderWidth = 1.0;

void particle(float distance, float angle) {
    gl_FragColor = pointColor;

    mediump float pow3Signal = -7.0 * pow(distance - 0.7, 3.0) + -0.5 * pow(distance, 2.0) + 0.7;
    mediump float sinSignal = sin(sin(angle)*angle*angle + radius);
    gl_FragColor.a = pow3Signal + clamp(sinSignal, 0.0, 0.1);
}

void circle(float at, float distance, vec4 color) {
    mediump float d1 = smoothstep(at + circleBorderWidth, at - circleBorderWidth, distance);
    mediump float d2 = smoothstep(at - circleBorderWidth, at + circleBorderWidth, distance);

    if (d1 * d2 > 0.0) {
        gl_FragColor = color;
        gl_FragColor.a = d1 * d2;
    }
}

void main() {
    mediump vec2 diff = 2.0 * gl_PointCoord - 1.0;
    mediump float distanceSqr = dot(diff, diff);

    mediump float distanceScaled = sqrt(distanceSqr) * pSize;

    if (distanceScaled <= radius) {
        mediump float angle = atan(diff.y, diff.x) + M_PI;
        particle(distanceScaled / radius, angle);
    }

//    circle(20.0, distanceScaled);
//    circle(20.0, distanceScaled);
//    circle(50.0, distanceScaled);
//    circle(40.0 / 2.0, distanceScaled, vec4(1,1,1,1));
//    circle(radius, distanceScaled, vec4(1,0,0,1));
}
