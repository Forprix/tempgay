#version 300 es
out vec2 uv;
void main() {
    int bits = gl_VertexID % 3 + gl_VertexID / 3;
    uv = vec2(bits >> 1 & 1, bits & 1);
    float penis = 1.0;
    gl_Position = vec4(uv * 2. - 1., 0, penis);
}
precision highp float;