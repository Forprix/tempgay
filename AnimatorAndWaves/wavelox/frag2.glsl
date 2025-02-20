#version 300 es
precision highp float;
precision highp sampler2D;

const float SQRT2 = 1.4142135623730950488016887242096980785696718753769480731766797379907324784621070388503875343276415727f;

uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform sampler2D uTexture3;
uniform float uRand;
in vec2 vTexCoord;

highp float rand(vec2 co)
{
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}

layout(location = 0) out vec4 fragColor1;
layout(location = 1) out vec4 fragColor2;
void main() {
    
    ivec2 pos = ivec2(gl_FragCoord.xy);

    float op = 0.0;
    float wg = 0.0;

    for (int x = -1; x <= 1; ++x)
        for (int y = -1; y <= 1; ++y)
            if (x != 0 || y != 0) {
                // float rlox1 = rand(vec2(rand(vec2(rand(vec2(rand(vec2(x, y)), pos.x)), pos.y)), uRand + 1.0));
                // float rlox2 = rand(vec2(rand(vec2(rand(vec2(rand(vec2(x, y)), pos.x)), pos.y)), uRand + 2.0));
                // ivec2 offs = ivec2(float(x) * 2.0 + rlox1 - 0.5, float(y) * 2.0 + rlox2 - 0.5);
                // float rlox = rand(vec2(rand(vec2(rand(vec2(rand(vec2(x, y)), pos.x)), pos.y)), uRand));
                ivec2 offs = ivec2(x, y);
                float rlox = 1.0;
                float p = 2.0;
                float d = 1.0 / pow(pow(float(offs.x), p) + pow(float(offs.y), p), 1.0 / p) * rlox;
                op += texelFetch(uTexture1, ivec2(pos.x + offs.x, pos.y + offs.y), 0).r * d;
                wg += d;
            }
    
    op /= wg;

    vec4 prevData1 = texelFetch(uTexture1, pos, 0).rgba;

    float p = prevData1.r;
    float v = prevData1.g;
    float b = prevData1.b;

    float w = texelFetch(uTexture3, pos, 0).r;

    v += (op - p) * 1.0 * w;   // Стремление vel к соседним пикселям
    p += v;
    v *= 0.7;
    p *= w;

    b *= 0.92;
    b = b + abs(p);

    fragColor1.rgba = vec4(p, v, b, 1);



    // float p0 = prevData1.r;
    // float b0 = prevData1.g;

    // float v0 = 0.0;
    // v0 += (op - p0) * w;
    // v0 += (0.0 - p0) * 0.3f;
    // p0 += v0;
    // v0 *= 0.5f;
    // p0 *= w;
    // b0 *= 0.2;
    // b0 = clamp(b0 + abs(p0), 0.f, 1.f);
    
}