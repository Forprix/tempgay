#version 300 es
precision highp float;

uniform ivec2 uCanvasSize;
uniform sampler2D uTextureID;

in vec2 uv;
out vec4 fragColor;

void main() {
    ivec2 coord = ivec2(int(uv.x * float(uCanvasSize.x)), int(uv.y * float(uCanvasSize.y)));
    vec3 rgb = vec3(0, 0, 0);
    float weightSum = 0.0;
    for (int i = -int(BLUR_RADIUS); i <= int(BLUR_RADIUS); i++) {
        float weight = exp(-float(i * i) / (2.0 * float(BLUR_RADIUS)));
        weightSum += weight;
    #if defined(HORIZONTAL)
        ivec2 texelCoord = ivec2(coord.x + i, coord.y);
    #elif defined(VERTICAL)
        ivec2 texelCoord = ivec2(coord.x, coord.y + i);
    #endif
        rgb += texelFetch(uTextureID, texelCoord, 0).xyz * weight;
    }
    fragColor = vec4(rgb / weightSum, 1.0);
}