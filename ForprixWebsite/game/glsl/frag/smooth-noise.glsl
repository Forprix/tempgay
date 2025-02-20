#version 300 es
precision highp float;

uniform float uTime;
out vec4 fragColor;

vec3 hsv2rgb(vec3 hsv) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(hsv.xxx + K.xyz) * 6.0 - K.www);
    return hsv.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsv.y);
}

float getRandomFloat(vec2 seed) {
    return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453 + sin(dot(seed.yx, vec2(93.989, 27.345))) * 23456.789);
}

#define SPEED 0.001

void main() {
    vec3 hsv = vec3(0.0);
    float initial = getRandomFloat(gl_FragCoord.xy * 3.1576) * 360.0;
    float speed = getRandomFloat(gl_FragCoord.xy) * float(SPEED);
    hsv.x = mod(initial + uTime * 360.0 * speed, 360.0);
    hsv.y = 1.0;
    hsv.z = 1.0;
    fragColor = vec4(hsv2rgb(hsv), 1.0);
}