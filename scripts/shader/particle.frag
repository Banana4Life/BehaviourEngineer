varying mediump vec4 pointColor;

void main() {
    mediump vec2 pos = 2.0 * gl_PointCoord - 1.0;
    mediump float distance = dot(pos, pos);
    if (distance > 1.0) {
        discard;
    }
    gl_FragColor = pointColor;
}