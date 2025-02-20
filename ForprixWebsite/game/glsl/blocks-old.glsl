precision highp usampler2D;
precision highp int;

uniform usampler2D uWorldBlocksID;
uniform ivec2 uWorldBlocksSize;


uniform sampler2D uTilesetID;
uniform ivec2 uTilesetSize;

uint bool4ToUint(bool[4] input_) {
    return uint(input_[0]) + uint(input_[1]) * 2u + uint(input_[2]) * 4u + uint(input_[3]) * 8u;
}

in vec2 vUV;
out vec4 fragColor;
void main() {
    ivec2 worldPos = ivec2(vUV * vec2(uWorldBlocksSize));
    uvec4 currentBlock = texelFetch(uWorldBlocksID, worldPos, 0);
    uint blockID = currentBlock.r;
    uint stateID = currentBlock.g;
    uint dyeingID = currentBlock.b;
    uint connectMode = currentBlock.a;

    bool straightNeighbours[9];
    straightNeighbours[0] = bool((connectMode >> 0u) & 1u);
    straightNeighbours[1] = bool((connectMode >> 1u) & 1u);
    straightNeighbours[2] = bool((connectMode >> 2u) & 1u);
    straightNeighbours[3] = bool((connectMode >> 3u) & 1u);
    straightNeighbours[4] = true;
    straightNeighbours[5] = bool((connectMode >> 4u) & 1u);
    straightNeighbours[6] = bool((connectMode >> 5u) & 1u);
    straightNeighbours[7] = bool((connectMode >> 6u) & 1u);
    straightNeighbours[8] = bool((connectMode >> 7u) & 1u);
    
    vec2 perBlockUV = mod(vUV * 16., vec2(1, 1));
    bool rightHalf = perBlockUV.x > 0.5;
    bool bottomHalf = perBlockUV.y > 0.5;

    int offset = int(bottomHalf) * 3 + int(rightHalf);
    bool cornerNeighbours[4];
    cornerNeighbours[0] = straightNeighbours[offset + 0];
    cornerNeighbours[1] = straightNeighbours[offset + 1];
    cornerNeighbours[2] = straightNeighbours[offset + 3];
    cornerNeighbours[3] = straightNeighbours[offset + 4];

    vec2 cornerUV = perBlockUV - vec2(rightHalf, bottomHalf) + 0.5;
    uint cornerTileIndex = bool4ToUint(cornerNeighbours) - 1u;
    
    if (blockID == 1u) {
        ivec2 c = ivec2(vUV * vec2(uTilesetSize));
        vec4 rgba1 = texelFetch(uTilesetID, ivec2(perBlockUV * vec2(10, 10)) + ivec2(int(stateID) * 10, 20), 0) * texelFetch(uTilesetID, ivec2(cornerUV * vec2(10, 10)) + ivec2(int(cornerTileIndex) * 10, 10), 0);
        vec4 rgba2 = texelFetch(uTilesetID, ivec2(cornerUV * vec2(10, 10)) + ivec2(int(cornerTileIndex) * 10, 0), 0);

        fragColor.rgb = rgba1.rgb + (rgba2.rgb - rgba1.rgb) * rgba2.a;
        fragColor.a = rgba1.a + rgba2.a;
    }
}