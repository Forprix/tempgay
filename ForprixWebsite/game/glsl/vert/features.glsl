#version 300 es

struct struct2 { int a; } var1;
struct { int a; } var2;
struct { int a; };

struct struct1 { int a; };
struct1 var3;

float var4;
int var5;
uint var6;
bool var7;
vec2 var8;
vec3 var9;
vec4 var10;
ivec2 var11;
ivec3 var12;
ivec4 var13;
uvec2 var14;
uvec3 var15;
uvec4 var16;
bvec2 var17;
bvec3 var18;
bvec4 var19;
mat2 var20;
mat3 var21;
mat4 var22;
sampler1D var23;
sampler2D var24;
sampler3D var25;
samplerCube var26;
int var27[10];

int var28;
in int var29;
out int var30;
const int var31;
uniform int var32;
varying int var33;
attribute int var34;

centroid in int var35;
centroid out int var36;

int var37() { }
void var38() { }

#define var39 123

layout(std140) in int var40;
layout(std430) in int var41;
layout(binding = 123) in int var42;
layout(offset = 123) in int var43;
layout(location = 123) in int var44;

void var41() {
    var42 = var2.a;
}