precision mediump float;
in vec2 vUV;
uniform float uTime;
out vec4 fragColor;
vec3 hsv2rgb(vec3 hsv)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(hsv.xxx + K.xyz) * 6.0 - K.www);
    return hsv.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsv.y);
}
void main() {
    fragColor = vec4(hsv2rgb(vec3(uTime, 0.5, 1)), 1);
}