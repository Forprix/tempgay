#version 300 es
precision highp float;
uniform float uTime;
in vec2 uv;
out vec4 fragColor;
void main() {
    fragColor = vec4(uv.x, uTime * 0.0001, 0.0, 1.0);
}