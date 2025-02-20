#version 300 es
#ifdef USE_UV
out vec2 uv;
#endif
void main() {
    int bits = gl_VertexID % 3 + gl_VertexID / 3;
    vec2 v = vec2(bits >> 1 & 1, bits & 1);
#ifdef USE_UV
    uv = v;
#endif
    gl_Position = vec4(v * 2. - 1., 0, 1);
}