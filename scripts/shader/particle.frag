#extension GL_OES_standard_derivatives : enable

varying mediump vec4 pointColor;

void main() {
    mediump vec2 diff = 2.0 * gl_PointCoord - 1.0;
    mediump float distance = dot(diff, diff);
    mediump float delta = fwidth(distance);
    mediump float alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, distance);

    gl_FragColor = pointColor;
    gl_FragColor.a *= alpha;
}