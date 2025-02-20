#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uTexture;
uniform vec2 uTextureSize;
uniform float uExposure;

out vec4 fragColor;
void main() {
    vec3 pvb = texelFetch(uTexture, ivec2(
        gl_FragCoord.x,
        uTextureSize.y - gl_FragCoord.y
    ), 0).rgb;
    float b = pow(abs(pvb.b), uExposure);
    fragColor = vec4(b, b, b, 1.f);
}