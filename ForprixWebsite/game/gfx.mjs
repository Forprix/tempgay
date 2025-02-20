import frog from '/gfx/frog.mjs'

// #region TODO List

// TODO: Introduce more control over enabling/disabling extensions
// TODO: Introduce error classes for more catchability
// TODO: Implement consolidateShaders and add warning
// TODO: Almost everything can be overriden, so no need to protect stuff (#). Remove all shit
// TODO: Introduce support for setting attributes not from buffer
// TODO: Add GFXProgram.setUniforms({ uUniform1: 123, uUniform2: 456 })
// TODO: Add GFXProgram.setBlocks({ bBlock1: buffer1, bBlock2: buffer1})
// TODO: Add GFXProgram.setAttributes({ aAttr1: buffer1, aAttr2: buffer1})
// TODO: Learn gl.PIXEL_UNPACK_BUFFER
// TODO: Introduce TRANSFORM_FEEDBACK support even though it's better to use fragment shaders for such calculations (not sure)
// TODO: Introduce GFXTexture with cubemap and compressedTexImage2D
// TODO: Optimize Matrix2D, introduce Matrix3D
// TODO: Introduce composed fragment shaders
// TODO: Understand what gl.createVertexArray does
// TODO: GFX.delete()
// TODO: Introduce control over gl.hint

// #endregion

// #region Typedefs
/** @typedef {'points'|'line-strip'|'line-loop'|'lines'|'triangle-strip'|'triangle-fan'|'triangles'} GFXPrimitive */
/** @typedef {'static'|'dynamic'} GFXMutability */
/** @typedef {'int8'|'uint8'|'int16'|'uint16'|'int32'|'uint32'|'float'} GFXNumberType */
/** @typedef {'color'|'depth'|'stencil'} GFXFrameMask */
/** @typedef {[number, number, number, number]} RGBA */
/** @typedef {[number, number, number]} RGB */
/** @typedef {'vertex'|'fragment'} GFXShaderType */
/** @typedef {{'mipmap'?: boolean | number, 'anisotropy'?: boolean | number, 'filter'?: 'nearest'|'linear', 'filterFar'?: 'nearest'|'linear', 'filterNear'?: 'nearest'|'linear', 'wrap'?: 'clamp'|'repeat'|'mirror', 'wrapX'?: 'clamp'|'repeat'|'mirror', 'wrapY'?: 'clamp'|'repeat'|'mirror', 'wrapZ'?: 'clamp'|'repeat'|'mirror'}} GFXSampling */
/** @typedef {'rgba8'|'rgb8'|'rg8'|'r8'|'rgba32f'|'rgb32f'|'rg32f'|'r32f'|'rgba32i'|'rgb32i'|'rg32i'|'r32i'|'rgba16i'|'rgb16i'|'rg16i'|'r16i'|'rgba8i'|'rgb8i'|'rg8i'|'r8i'|'rgba32u'|'rgb32u'|'rg32u'|'r32u'|'rgba16u'|'rgb16u'|'rg16u'|'r16u'|'rgba8u'|'rgb8u'|'rg8u'|'r8u'} GFXPixelFormat */
/** @typedef {{ mipmapStorage?: number, autoMipmap?: boolean }} GFXTextureSettings */
/** @typedef {'2d'|'2d[]'|'3d'|'cube'} GFXTextureDimension */
/** @typedef {'uint8'|'uint16'} GFXIndicesDrawType */
/** @typedef {{'whoWrites'?: 'CPU'|'GPU', 'whoReads'?: 'CPU'|'GPU', 'writeRate'?: 'once'|'frequent', 'readRate'?: 'rare'|'frequent'}|'static-draw'|'dynamic-draw'|'stream-draw'|'static-read'|'dynamic-read'|'stream-read'|'static-copy'|'dynamic-copy'|'stream-copy'} GFXBufferOptimizationHint*/
/** @typedef {Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array|BigInt64Array|BigUint64Array} TypedArray */
/** @typedef {'depth'|'stencil'} GFXVirtualScreenAdditionalBuffer */
// #endregion

const GFXMappings = (() => {
    const gl = WebGL2RenderingContext.prototype
    return {
        shaderType(input) {
            switch (input) {
                case 'vertex':   return gl.VERTEX_SHADER
                case 'fragment': return gl.FRAGMENT_SHADER
                default:         throw new Error(`'${input}' is an invalid shader type`)
            }
        },
        numberType(input) {
            switch (input) {
                case 'int8':    return gl.BYTE
                case 'uint8':   return gl.UNSIGNED_BYTE
                case 'int16':   return gl.SHORT
                case 'uint16':  return gl.UNSIGNED_SHORT
                case 'int32':   return gl.INT
                case 'uint32':  return gl.UNSIGNED_INT
                case 'float':   return gl.FLOAT
                default:         throw new Error(`'${input}' is invalid number type`)
            }
        },
        bufferUsage(input) {
            if (typeof input == 'string') {
                switch (input) {
                    case 'static-draw':   return gl.STATIC_DRAW
                    case 'dynamic-draw':  return gl.DYNAMIC_DRAW
                    case 'stream-draw':   return gl.STREAM_DRAW
                    case 'static-read':   return gl.STATIC_READ
                    case 'dynamic-read':  return gl.DYNAMIC_READ
                    case 'stream-read':   return gl.STREAM_READ
                    case 'static-copy':   return gl.STATIC_COPY
                    case 'dynamic-copy':  return gl.DYNAMIC_COPY
                    case 'stream-copy':   return gl.STREAM_COPY
                }
            }
            else if (typeof input == 'object' && input != null) {
                const map = [
                    [{ whoWrites: 'CPU', whoReads: 'GPU', writeRate: 'frequent', readRate: 'frequent' }, gl.DYNAMIC_DRAW],
                    [{ whoWrites: 'CPU', whoReads: 'GPU', writeRate: 'once',     readRate: 'frequent' }, gl.STATIC_DRAW],
                    [{ whoWrites: 'CPU', whoReads: 'GPU', writeRate: 'once',     readRate: 'rare'     }, gl.STREAM_DRAW],
                    [{ whoWrites: 'GPU', whoReads: 'CPU', writeRate: 'frequent', readRate: 'frequent' }, gl.DYNAMIC_READ],
                    [{ whoWrites: 'GPU', whoReads: 'CPU', writeRate: 'once',     readRate: 'frequent' }, gl.STATIC_READ],
                    [{ whoWrites: 'GPU', whoReads: 'CPU', writeRate: 'once',     readRate: 'rare'     }, gl.STREAM_READ],
                    [{ whoWrites: 'GPU', whoReads: 'GPU', writeRate: 'frequent', readRate: 'frequent' }, gl.DYNAMIC_COPY],
                    [{ whoWrites: 'GPU', whoReads: 'GPU', writeRate: 'once',     readRate: 'frequent' }, gl.STATIC_COPY],
                    [{ whoWrites: 'GPU', whoReads: 'GPU', writeRate: 'once',     readRate: 'rare'     }, gl.STREAM_COPY]
                ]
                loop1:
                for (const [obj, output] of map) {
                    for (const [k, v] of Object.entries(obj))
                        if (input[k] != null && input[k] != v)
                            continue loop1
                    return output
                }
            }
            throw new Error(`'${JSON.stringify(input)}' is invalid buffer optimization hint`)
        },
        frameMask(input) {
            switch (input) {
                case 'color':   return gl.COLOR_BUFFER_BIT
                case 'depth':   return gl.DEPTH_BUFFER_BIT
                case 'stencil': return gl.STENCIL_BUFFER_BIT
                default:        throw new Error(`'${input}' is invalid frame mask`)
            }
        },
        uniformType(input) {
            switch (input) {
                case gl.FLOAT:                         return [gl.uniform1fv, false, false]
                case gl.FLOAT_VEC2:                    return [gl.uniform2fv, false, false]
                case gl.FLOAT_VEC3:                    return [gl.uniform3fv, false, false]
                case gl.FLOAT_VEC4:                    return [gl.uniform4fv, false, false]
                case gl.INT:                           return [gl.uniform1iv, false, false]
                case gl.INT_VEC2:                      return [gl.uniform2iv, false, false]
                case gl.INT_VEC3:                      return [gl.uniform3iv, false, false]
                case gl.INT_VEC4:                      return [gl.uniform4iv, false, false]
                case gl.BOOL:                          return [gl.uniform1iv, false, false]
                case gl.BOOL_VEC2:                     return [gl.uniform2iv, false, false]
                case gl.BOOL_VEC3:                     return [gl.uniform3iv, false, false]
                case gl.BOOL_VEC4:                     return [gl.uniform4iv, false, false]
                case gl.SAMPLER_2D:                    return [gl.uniform1iv, false, true]
                case gl.SAMPLER_CUBE:                  return [gl.uniform1iv, false, true]
                case gl.SAMPLER_3D:                    return [gl.uniform1iv, false, true]
                case gl.SAMPLER_2D_SHADOW:             return [gl.uniform1iv, false, true]
                case gl.SAMPLER_2D_ARRAY:              return [gl.uniform1iv, false, true]
                case gl.SAMPLER_2D_ARRAY_SHADOW:       return [gl.uniform1iv, false, true]
                case gl.SAMPLER_CUBE_SHADOW:           return [gl.uniform1iv, false, true]
                case gl.INT_SAMPLER_2D:                return [gl.uniform1iv, false, true]
                case gl.INT_SAMPLER_3D:                return [gl.uniform1iv, false, true]
                case gl.INT_SAMPLER_CUBE:              return [gl.uniform1iv, false, true]
                case gl.INT_SAMPLER_2D_ARRAY:          return [gl.uniform1iv, false, true]
                case gl.UNSIGNED_INT_SAMPLER_2D:       return [gl.uniform1iv, false, true]
                case gl.UNSIGNED_INT_SAMPLER_3D:       return [gl.uniform1iv, false, true]
                case gl.UNSIGNED_INT_SAMPLER_CUBE:     return [gl.uniform1iv, false, true]
                case gl.UNSIGNED_INT_SAMPLER_2D_ARRAY: return [gl.uniform1iv, false, true]
                case gl.UNSIGNED_INT:                  return [gl.uniform1uiv, false, false]
                case gl.UNSIGNED_INT_VEC2:             return [gl.uniform2uiv, false, false]
                case gl.UNSIGNED_INT_VEC3:             return [gl.uniform3uiv, false, false]
                case gl.UNSIGNED_INT_VEC4:             return [gl.uniform4uiv, false, false]
                case gl.FLOAT_MAT2:                    return [gl.uniformMatrix2fv, true, false]
                case gl.FLOAT_MAT3:                    return [gl.uniformMatrix3fv, true, false]
                case gl.FLOAT_MAT4:                    return [gl.uniformMatrix4fv, true, false]
            }
        },
        attribType(input) {
            switch (input) {
                case gl.FLOAT:      return [gl.vertexAttrib1f, 1, 1]
                case gl.FLOAT_VEC2: return [gl.vertexAttrib2f, 2, 1]
                case gl.FLOAT_VEC3: return [gl.vertexAttrib3f, 3, 1]
                case gl.FLOAT_VEC4: return [gl.vertexAttrib4f, 4, 1]
                case gl.INT:        return [gl.vertexAttribI4i, 4, 1]
                case gl.INT_VEC2:   return [gl.vertexAttribI4i, 4, 1]
                case gl.INT_VEC3:   return [gl.vertexAttribI4i, 4, 1]
                case gl.INT_VEC4:   return [gl.vertexAttribI4i, 4, 1]
                case gl.UNSIGNED_INT:      return [gl.vertexAttribI4ui, 4, 1]
                case gl.UNSIGNED_INT_VEC2: return [gl.vertexAttribI4ui, 4, 1]
                case gl.UNSIGNED_INT_VEC3: return [gl.vertexAttribI4ui, 4, 1]
                case gl.UNSIGNED_INT_VEC4: return [gl.vertexAttribI4ui, 4, 1]
                case gl.FLOAT_MAT2:                    return [gl.vertexAttrib2f, 2, 2]
                case gl.FLOAT_MAT3:                    return [gl.vertexAttrib3f, 3, 3]
                case gl.FLOAT_MAT4:                    return [gl.vertexAttrib4f, 4, 4]
            }
        },
        primitive(input) {
            switch (input) {
                case 'points':         return gl.POINTS
                case 'line-strip':     return gl.LINE_STRIP
                case 'line-loop':      return gl.LINE_LOOP
                case 'lines':          return gl.LINES
                case 'triangle-strip': return gl.TRIANGLE_STRIP
                case 'triangle-fan':   return gl.TRIANGLE_FAN
                case 'triangles':      return gl.TRIANGLES
                default:               throw new Error(`'${input}' is invalid primitive`)
            }
        },
        pixelFormat(input) {
            switch (input) {
                case 'rgba8':   return [gl.RGBA8,    gl.RGBA,         gl.UNSIGNED_BYTE]
                case 'rgb8':    return [gl.RGB8,     gl.RGB,          gl.UNSIGNED_BYTE]
                case 'rg8':     return [gl.RG8,      gl.RG,           gl.UNSIGNED_BYTE]
                case 'r8':      return [gl.R8,       gl.RED,          gl.UNSIGNED_BYTE]
                case 'rgba16f': return [gl.RGBA16F,  gl.RGBA,         gl.FLOAT]
                case 'rgb16f':  return [gl.RGB16F,   gl.RGB,          gl.FLOAT]
                case 'rg16f':   return [gl.RG16F,    gl.RG,           gl.FLOAT]
                case 'r16f':    return [gl.R16F,     gl.RED,          gl.FLOAT]
                case 'rgba32f': return [gl.RGBA32F,  gl.RGBA,         gl.FLOAT]
                case 'rgb32f':  return [gl.RGB32F,   gl.RGB,          gl.FLOAT]
                case 'rg32f':   return [gl.RG32F,    gl.RG,           gl.FLOAT]
                case 'r32f':    return [gl.R32F,     gl.RED,          gl.FLOAT]
                case 'rgba32i': return [gl.RGBA32I,  gl.RGBA_INTEGER, gl.INT]
                case 'rgb32i':  return [gl.RGB32I,   gl.RGB_INTEGER,  gl.INT]
                case 'rg32i':   return [gl.RG32I,    gl.RG_INTEGER,   gl.INT]
                case 'r32i':    return [gl.R32I,     gl.RED_INTEGER,  gl.INT]
                case 'rgba16i': return [gl.RGBA16I,  gl.RGBA_INTEGER, gl.SHORT]
                case 'rgb16i':  return [gl.RGB16I,   gl.RGB_INTEGER,  gl.SHORT]
                case 'rg16i':   return [gl.RG16I,    gl.RG_INTEGER,   gl.SHORT]
                case 'r16i':    return [gl.R16I,     gl.RED_INTEGER,  gl.SHORT]
                case 'rgba8i':  return [gl.RGBA8I,   gl.RGBA_INTEGER, gl.BYTE]
                case 'rgb8i':   return [gl.RGB8I,    gl.RGB_INTEGER,  gl.BYTE]
                case 'rg8i':    return [gl.RG8I,     gl.RG_INTEGER,   gl.BYTE]
                case 'r8i':     return [gl.R8I,      gl.RED_INTEGER,  gl.BYTE]
                case 'rgba32u': return [gl.RGBA32UI, gl.RGBA_INTEGER, gl.UNSIGNED_INT]
                case 'rgb32u':  return [gl.RGB32UI,  gl.RGB_INTEGER,  gl.UNSIGNED_INT]
                case 'rg32u':   return [gl.RG32UI,   gl.RG_INTEGER,   gl.UNSIGNED_INT]
                case 'r32u':    return [gl.R32UI,    gl.RED_INTEGER,  gl.UNSIGNED_INT]
                case 'rgba16u': return [gl.RGBA16UI, gl.RGBA_INTEGER, gl.UNSIGNED_SHORT]
                case 'rgb16u':  return [gl.RGB16UI,  gl.RGB_INTEGER,  gl.UNSIGNED_SHORT]
                case 'rg16u':   return [gl.RG16UI,   gl.RG_INTEGER,   gl.UNSIGNED_SHORT]
                case 'r16u':    return [gl.R16UI,    gl.RED_INTEGER,  gl.UNSIGNED_SHORT]
                case 'rgba8u':  return [gl.RGBA8UI,  gl.RGBA_INTEGER, gl.UNSIGNED_BYTE]
                case 'rgb8u':   return [gl.RGB8UI,   gl.RGB_INTEGER,  gl.UNSIGNED_BYTE]
                case 'rg8u':    return [gl.RG8UI,    gl.RG_INTEGER,   gl.UNSIGNED_BYTE]
                case 'r8u':     return [gl.R8UI,     gl.RED_INTEGER,  gl.UNSIGNED_BYTE]
                default:        throw new Error(`'${input}' is invalid pixel format`)
            }
        },
        textureDimension(input) {
            switch (input) {
                case '2d':   return  [gl.texStorage2D, gl.texImage2D, gl.texSubImage2D, 2, gl.TEXTURE_2D]
                case '2d[]': return  [gl.texStorage3D, gl.texImage3D, gl.texSubImage3D, 3, gl.TEXTURE_2D_ARRAY]
                case '3d':   return  [gl.texStorage3D, gl.texImage3D, gl.texSubImage3D, 3, gl.TEXTURE_3D]
                case 'cube': return  [gl.texStorage2D, gl.texImage2D, gl.texSubImage2D, 2, gl.TEXTURE_CUBE_MAP]
                default:     throw new Error(`'${input}' is invalid texture dimension`)
            }
        },
        typedArrayOfType(input) {
            switch (input) {
                case 'int8':   return Int8Array
                case 'uint8':  return Uint8Array
                case 'int16':  return Int16Array
                case 'uint16': return Uint16Array
                case 'int32':  return Int32Array
                case 'uint32': return Uint32Array
                case 'float':  return Float32Array
                default:       throw new Error(`'${input}' is not supported`)
            }
        },
        typeOfTypedArray(input) {
            switch (input.__proto__) {
                case Int8Array.prototype:         return 'int8'
                case Uint8Array.prototype:        return 'uint8'
                case Uint8ClampedArray.prototype: return 'uint8'
                case Int16Array.prototype:        return 'int16'
                case Uint16Array.prototype:       return 'uint16'
                case Int32Array.prototype:        return 'int32'
                case Uint32Array.prototype:       return 'uint32'
                case Float32Array.prototype:      return 'float'
                default: throw new Error(`'${input.constructor.name}' is not supported`)
            }
        },
        filter(input) {
            switch (input) {
                case 'linear':   return gl.LINEAR
                case 'nearest':  return gl.NEAREST
            }
            throw new Error(`'${input}' is invalid filtering method`)

        },
        wrap(input) {
            switch (input) {
                case 'repeat':   return gl.REPEAT
                case 'clamp':    return gl.CLAMP_TO_EDGE
                case 'mirror':   return gl.MIRRORED_REPEAT
                default:         throw new Error(`'${input}' is invalid wrapping method`)
            }
        },
        mutable(input) {
            switch (input) {
                case 'dynamic': return true
                case 'static': return false
            }
            throw new Error(`'${value}' is invalid mutability`)
        }
    }
})()

export class Matrix2D {
    /**
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @param {number} tx
     * @param {number} ty
    */
    constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
        /** @private */
        this.v = [
            a,  c,  0,
            b,  d,  0,
            tx, ty, 1,
        ]
    }
    /**
     * @return {Matrix2D}
    */
    static identity() {
        return new Matrix2D()
    }
    /**
     * @param {...Matrix2D} matrices
     * @return {Matrix2D}
    */
    static multiply(...matrices) {
        const r = matrices[0] ?? new Matrix2D()
        for (const m of matrices.slice(1)) {
            const a = r.v
            const b = m.v
            ;[a[0], a[1], a[3], a[4], a[6], a[7]] = [
                a[0] * b[0] + a[3] * b[1],
                a[1] * b[0] + a[4] * b[1],
                a[0] * b[3] + a[3] * b[4],
                a[1] * b[3] + a[4] * b[4],
                a[0] * b[6] + a[3] * b[7] + a[6],
                a[1] * b[6] + a[4] * b[7] + a[7]
            ]
        }
        return r
    }
    /**
     * @param {number} [offsetX]
     * @param {number} [offsetY]
     * @return {Matrix2D}
    */
    translate(offsetX = 0, offsetY = 0) {
        const v = this.v
        v[6] += offsetX
        v[7] += offsetY
        return this
    }
    /**
     * @param {number} [degrees]
     * @param {number} [centerX]
     * @param {number} [centerY]
     * @return {Matrix2D}
    */
    rotate(degrees = 0, centerX = 0, centerY = 0) {
        const rad = degrees / 180 * Math.PI
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        const v = this.v
        ;[v[0], v[1], v[3], v[4], v[6], v[7]] = [
            cos * v[0] - sin * v[1],
            sin * v[0] + cos * v[1],
            cos * v[3] - sin * v[4],
            sin * v[3] + cos * v[4],
            cos * v[6] - sin * v[7] - cos * centerX + sin * centerY + centerX,
            sin * v[6] + cos * v[7] - sin * centerX - cos * centerY + centerY
        ]
        return this
    }
    /**
     * @param {number} [scaleX]
     * @param {number} [scaleY]
     * @param {number} [centerX]
     * @param {number} [centerY]
     * @return {Matrix2D}
    */
    scale(scaleX = 1, scaleY = 1, centerX = 0, centerY = 0) {
        const v = this.v
        ;[v[0], v[1], v[3], v[4], v[6], v[7]] = [
            scaleX * v[0],
            scaleY * v[1],
            scaleX * v[3],
            scaleY * v[4],
            scaleX * v[6] - scaleX * centerX + centerX,
            scaleY * v[7] - scaleY * centerY + centerY
        ]
        return this
    }
    /**
     * @param {number} [degreesX]
     * @param {number} [degreesY]
     * @return {Matrix2D}
    */
    skew(degreesX = 0, degreesY = 0, centerX = 0, centerY = 0) {
        const radX = degreesX / 180 * Math.PI
        const radY = degreesY / 180 * Math.PI
        const v = this.v
        ;[v[0], v[1], v[3], v[4], v[6], v[7]] = [
            1,
            Math.tan(radY),
            Math.tan(radX),
            1,
            -centerX + Math.tan(radX) * -centerY + centerX,
            Math.tan(radY) * -centerX + -centerY + centerY
        ]
        return this
    }
    /**
     * @return {Matrix2D}
    */
    copyTo(target) {
        const a = target.v
        const b = this.v
        ;[a[0], a[1], a[3], a[4], a[6], a[7]] = [
            a[0] * b[0] + a[3] * b[1],
            a[1] * b[0] + a[4] * b[1],
            a[0] * b[3] + a[3] * b[4],
            a[1] * b[3] + a[4] * b[4],
            a[0] * b[6] + a[3] * b[7] + a[6],
            a[1] * b[6] + a[4] * b[7] + a[7]
        ]
        return this
    }
    /**
     * @return {Array}
    */
    get array() {
        return this.v
    }
    [Symbol.iterator]() {
        let i = 0
        const v = this.v
        return { next: () => i < 9 ? { value: v[i++], done: false } : { done: true } }
    }
}


class GFXTexture {
    /**
     * @param {GFX} gfx
     * @param {GFXTextureDimension} [dimension]
     * @param {GFXMutability} [mutability]
     * @param {GFXPixelFormat} [pixelFormat]
     * @param {GFXTextureSettings} [settings]
     * @param {GFXSampling} [initialSampling]
    */
    constructor(gfx, dimension, mutability, pixelFormat, settings, initialSampling) {
        /** @private {GFX} */
        this.gfx = gfx
        
        const dim = GFXMappings.textureDimension(dimension ?? '2d')
        const fmt = GFXMappings.pixelFormat(pixelFormat ?? 'rgba8')

        const gl = this.gfx.gl

        /** @private */ this.autoMipmap =     settings?.autoMipmap ?? false
        /** @private */ this.mutable =        GFXMappings.mutable(mutability ?? 'dynamic')
        /** @private */ this.mipmapStorage =  settings?.mipmapStorage
        if (this.mipmapStorage && this.mutable) throw Error("'mipmapStorage' paramater is irrelevant for dynamic textures")
        
        /** @private */ this.texture =        gl.createTexture()
        /** @private */ this.texStorage =     dim[0]
        /** @private */ this.texImage =       dim[1]
        /** @private */ this.texSubImage =    dim[2]
        /** @private */ this.dimension =      dim[3]
        /** @private */ this.bind =           dim[4]
        /** @private */ this.internalFormat = fmt[0]
        /** @private */ this.format =         fmt[1]
        /** @private */ this.type =           fmt[2]

        if (this.bind == gl.TEXTURE_CUBE_MAP) {
            /*this.sides = [
                new GFXCubeSide(this, 0),
                new GFXCubeSide(this, 1),
                new GFXCubeSide(this, 2),
                new GFXCubeSide(this, 3),
                new GFXCubeSide(this, 4),
                new GFXCubeSide(this, 5)
            ]*/
        }

        /** @private */ this.maxAnisotropy = 1
        /** @private */ this.maxMipmap = 1000
        /** @private */ this.wrapS = gl.REPEAT
        /** @private */ this.wrapT = gl.REPEAT
        /** @private */ this.wrapR = gl.REPEAT
        /** @private */ this.minFilter = gl.NEAREST_MIPMAP_LINEAR
        /** @private */ this.magFilter = gl.LINEAR

        
        // Записи в lvl 0
        // 1: gl.texImage* +
        // 2: gl.texSubImage* +
        // 3: screen
        // 3.1: blit TODO
        // 3.2: gl.draw* +
        // 3.3: gl.clear(gl.COLOR_BUFFER_BIT) +
        // 3.4:
        // 4

        // Считывание lvl 1+
        // gl.draw* (uniform) TODO

        // TODO
        // Внутри GFX.setTextureSlot(slot, texture) запоминать в какие слоты кладуться какие текстуры и сохранять в GFX.textureSlots: Map
        // Внутри GFXShaderUniform.set(slot) соотносить slot и получать texture, и что-то дальше делать
        // Придумать что дальше делать
        


        /** @private */ this.mipmapOutdated = false

        if (initialSampling)
            this.sampling(initialSampling)
    }
    /** 
    * @param {GFXSampling} [params]
    * @returns {GFXTexture}
    */
    sampling(params) {
        const gfx = this.gfx
        const gl = gfx.gl
        
        const p = params ?? {}
        
        gl.bindTexture(this.bind, this.texture)
        this.gfx.textureBinds.set(this.bind, this.texture)

        // #region
        const maxAnisotropyOld = this.maxAnisotropy
        let maxAnisotropyNew
        if (typeof p.anisotropy == 'number') maxAnisotropyNew = p.anisotropy
        else if (p.anisotropy == true)       maxAnisotropyNew = gfx.maxAnisotropy
        else if (p.anisotropy == false)      maxAnisotropyNew = 0
        if (maxAnisotropyNew != null && maxAnisotropyOld != maxAnisotropyNew) {
            gl.texParameterf(this.bind, gfx.anisotropy.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropyNew)
            this.maxAnisotropy = maxAnisotropyNew
        }

        const maxMipmapOld = this.maxMipmap
        let maxMipmapNew
        if (typeof p.mipmap == 'number') maxMipmapNew = p.mipmap
        else if (p.mipmap == true)       maxMipmapNew = 1000
        else if (p.mipmap == false)      maxMipmapNew = 0
        if (maxMipmapNew != null && maxMipmapOld != maxMipmapNew) {
            gl.texParameterf(this.bind, gl.TEXTURE_MAX_LEVEL, maxMipmapNew)
            this.maxMipmap = maxMipmapNew
        }

        const wrapSOld = this.wrapS
        const wrapSNewUnmapped = p.wrapX ?? p.wrap
        let wrapSNew 
        if (wrapSNewUnmapped) wrapSNew = GFXMappings.wrap(wrapSNewUnmapped)
        if (wrapSNew != null && wrapSOld != wrapSNew) {
            gl.texParameterf(this.bind, gl.TEXTURE_WRAP_S, wrapSNew)
            this.wrapS = wrapSNew
        }

        const wrapTOld = this.wrapT
        const wrapTNewUnmapped = p.wrapY ?? p.wrap
        let wrapTNew 
        if (wrapTNewUnmapped) wrapTNew = GFXMappings.wrap(wrapTNewUnmapped)
        if (wrapTNew != null && wrapTOld != wrapTNew) {
            gl.texParameterf(this.bind, gl.TEXTURE_WRAP_T, wrapTNew)
            this.wrapT = wrapTNew
        }
        
        const wrapROld = this.wrapR
        const wrapRNewUnmapped = p.wrapZ ?? p.wrap
        let wrapRNew 
        if (wrapRNewUnmapped) wrapRNew = GFXMappings.wrap(wrapRNewUnmapped)
        if (wrapRNew != null && wrapROld != wrapRNew) {
            gl.texParameterf(this.bind, gl.TEXTURE_WRAP_R, wrapRNew)
            this.wrapR = wrapRNew
        }

        
        const magFilterOld = this.magFilter
        const magFilterUnmapped = p.filterFar ?? p.filter
        let magFilterNew
        if (magFilterUnmapped) magFilterNew = GFXMappings.filter(magFilterUnmapped)
        if (magFilterNew != null && magFilterOld != magFilterNew) {
            gl.texParameterf(this.bind, gl.TEXTURE_MAG_FILTER, magFilterNew)
            this.magFilter = magFilterNew
        }

        const minFilterUnmapped = p.filterNear ?? p.filter
        const minFilterNew = minFilterUnmapped ? GFXMappings.filter(minFilterUnmapped) : this.minFilter
        const minFilterNew_ = this.maxMipmap > 0 ? minFilterNew == gl.LINEAR ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST_MIPMAP_LINEAR : minFilterNew
        if (maxMipmapOld !== this.maxMipmap || this.minFilter !== minFilterNew) {
            gl.texParameterf(this.bind, gl.TEXTURE_MIN_FILTER, minFilterNew_)
            this.minFilter = minFilterNew
        }
        // #endregion

        // if (this.gfx.activeTextureBind == this.bind)
        //     gl.bindTexture(this.bind, this.gfx.activeTexture)

        return this
    }
    /**
     * > **Warning**
     * > There's a Firefox bug (2023):
     * Unnecessary warnings appear in the console.
     * The best you can do is ignore the warnings
     *
     * Allocates / reallocates VRAM only if size changed.
     * If your texture is static, you won't be able to resize it
     * @param {Uint8Array|Uint16Array|Uint32Array|Float32Array|HTMLImageElement|HTMLCanvasElement|ImageBitmap|null} data 
     * @param  {number[]} [size]
     * @returns {GFXTexture}
    */
    write(data, size) {
        const gfx = this.gfx
        const gl = gfx.gl



        
        let newSize
        if (size != null)
            newSize = [...size]
        else if (this.dimension == 2 && (data instanceof HTMLImageElement) || (data instanceof HTMLCanvasElement) || (data instanceof ImageBitmap))
            newSize = [data.width, data.height]
        else if (this.size)
            newSize = [...this.size]
        else
            throw new Error("You can't just 'write' to texture without letting it know the size. Specify any size (e.g, [1, 1]) or pass 'data' with size obtainable (e.g. ImageBitmap)")

        if (newSize.some(x => x > gfx.maxTextureSize))
            throw new Error("Texture is too big. Your device doesn't support such a big texture")

        const oldSize = this.size ?? []
        const resized = !(oldSize.length == newSize.length && oldSize.every((v, i) => v === newSize[i]))

        if (!this.mutable && this.size && resized)
            throw new Error("Can't resize immutable texture")
        
        gl.bindTexture(this.bind, this.texture)
        this.gfx.textureBinds.set(this.bind, this.texture)

        if (resized) {
            if (this.mutable) {
                this.texImage.call(gl, this.bind, 0, this.internalFormat, ...newSize, 0, this.format, this.type, data)
                this.mipmapOutdated = true
            }
            else {
                let mipmapLevels = Math.floor(Math.log2(Math.max(...newSize))) + 1
                if (this.mipmapStorage != null && this.mipmapStorage < mipmapLevels)
                    mipmapLevels = this.mipmapStorage
                this.texStorage.call(gl, this.bind, mipmapLevels, this.internalFormat, ...newSize)
            }
                
            /** @type {[number]|[number, number]|[number, number, number]|undefined} */
            this.size = newSize
        }
        
        if (!resized || !this.mutable) {
            if (data != null) {
                this.texSubImage.call(gl, this.bind, 0, 0, 0, ...(size ?? newSize), this.format, this.type, data)
                this.mipmapOutdated = true
            }
            else if (!resized)
                throw new Error("Passed 'null' as data to fill allocated texture")
        }

        return this
    }
    /**
     * @param {Uint8Array|Uint16Array|Uint32Array|Float32Array|HTMLImageElement|HTMLCanvasElement|ImageBitmap|null} data 
     * @param  {number[]} [size] Size of data
     * @param  {number[]} [offset] Offset of data
     * @returns {GFXTexture}
    */
    subwrite(data, size, offset = [0, 0]) {
        const gfx = this.gfx
        const gl = gfx.gl

        if (data == null)
            throw new Error("Passed 'null' as data to fill allocated texture")

        let newSize
        if (size != null)
            newSize = [...size]
        else if (this.dimension == 2 && (data instanceof HTMLImageElement) || (data instanceof HTMLCanvasElement) || (data instanceof ImageBitmap))
                newSize = [data.width, data.height]
        else if (this.size)
            newSize = [...this.size]
        else
            throw new Error("You can't 'subwrite' to unallocated texture")
        
        gl.bindTexture(this.bind, this.texture)
        gfx.textureBinds.set(this.bind, this.texture)

        this.texSubImage.call(gl, this.bind, 0, ...offset, ...newSize, this.format, this.type, data)

        return this
    }
    /**
     * @returns {GFXTexture}
    */
    genMipmap() {
        const gfx = this.gfx
        const gl = gfx.gl
        
        gl.bindTexture(this.bind, this.texture)
        this.gfx.textureBinds.set(this.bind, this.texture)

        gl.generateMipmap(this.bind)
        
        this.mipmapOutdated = false
    }

    /** @returns {number} */
    get width() {
        return this.size?.[0]
    }
    /** @returns {number} */
    get height() {
        return this.size?.[1]
    }
    /** @returns {number} */
    get depth() {
        return this.size?.[2]
    }
    /** @returns {number} */
    get ratio() {
        return this.size?.[0] / this.size?.[1]
    }

    delete() {
        const gl = this.gfx.gl
        gl.deleteTexture(this.texture)
        this.texture = null
        this.delete = () => { throw new Error("Can't delete twice") }
    }
    /** @returns {boolean} */
    get exists() {
        return this.texture != null
    }
}
// TODO: Возможность заменять слоты для текстур в Virtual Screen
class GFXVirtualScreen {
    /**
     * @param {GFX} gfx
     * @param {GFXTexture[]|GFXTexture} textures
     * @param {GFXVirtualScreenAdditionalBuffer[]} [additionalBuffers]
    */
    constructor(gfx, textures, additionalBuffers) {
        /** @private {GFX} */
        this.gfx = gfx

        const gl = gfx.gl

        /** @private */
        this.framebuffer = gl.createFramebuffer()
        /** @private */
        this._deleters = [()=>gl.deleteFramebuffer(this.framebuffer)]
        /** @private */
        this._resizers = []
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
        gfx.currentScreen = this

        let size

        const attachments = []
        let i = 0
        const textures_ = textures instanceof GFXTexture ? [textures] : (textures ?? [])
        /** @private */
        this.textures = textures_
        for (const texture of textures_) {
            let attachment = gl.COLOR_ATTACHMENT0 + i++
            if (texture == null) {
                attachments.push(gl.NONE)
                continue
            }
            size = size ?? texture.size
            gl.bindTexture(gl.TEXTURE_2D, texture.texture)
            gfx.textureBinds.set(gl.TEXTURE_2D, texture.texture)
            gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture.texture, 0)
            this._resizers.push((w, h) => {
                if (w != texture.width || h != texture.height)
                    texture.write(null, [w, h])
            })
            attachments.push(attachment)
        }

        if (textures_.length == 0)
            throw new Error(`At least 1 texture needed`)

        let ab
        const additionalBuffers_ = additionalBuffers ?? []
        const stencil = additionalBuffers_.includes("stencil")
        if (additionalBuffers_.includes("depth"))
            if (stencil)    ab = [gl.DEPTH_STENCIL, gl.DEPTH_STENCIL_ATTACHMENT]
            else            ab = [gl.DEPTH_COMPONENT16, gl.DEPTH_ATTACHMENT]
        else if (stencil)   ab = [gl.STENCIL_INDEX8, gl.STENCIL_ATTACHMENT]
        
        if (ab != null) {
            const rb = gl.createRenderbuffer()
            this._deleters.push(()=>gl.deleteRenderbuffer(rb))
            gl.bindRenderbuffer(gl.RENDERBUFFER, rb)
            if (size)
                gl.renderbufferStorage(gl.RENDERBUFFER, ab[0], ...size)
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, ab[1], gl.RENDERBUFFER, rb)
            this._resizers.push((w, h) => {
                gl.bindRenderbuffer(gl.RENDERBUFFER, rb)
                gl.renderbufferStorage(gl.RENDERBUFFER, ab[0], w, h)
            })
        }

        gl.drawBuffers(attachments)
    }
    /** @returns {boolean} */
    get complete() {
        const gl = this.gfx.gl
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
        this.currentScreen = this
        const res = gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE
        return res
    }
    /**
     * Automatically resizes linked textures and built-in renderbuffers for you
     * Don't forget to redraw your stuff after resizing
     * @param {number} width
     * @param {number} height
     * @returns {GFXVirtualScreen}
    */
    resize(width, height) {
        const gfx = this.gfx
        const gl = gfx.gl

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
        gfx.currentScreen = this

        this._resizers.forEach(x=>x(width, height))

        return this
    }

    delete() {
        this._deleters.forEach(x => x())
        this._deleters = null
        this.delete = () => { throw new Error("Can't delete twice") }
    }
    /** @returns {boolean} */
    get exists() {
        return this._deleters != null
    }
}

class GFXShader {
    /**
     * @param {GFX} gfx
     * @param {GFXShaderType} type
     * @param {string} code
    */
    constructor(gfx, type, code) {
        /** @private {GFX} */
        this.gfx = gfx

        const gl = gfx.gl

        const shader = gl.createShader(GFXMappings.shaderType(type))

        const line = code.match(/^\s*#version.*\n*/)?.[0]

        gl.shaderSource(shader, [
            (line ?? '#version 300 es').trim(),
            'precision highp float;',
            code.slice(line?.length ?? 0)
        ].join('\n'))

        gl.compileShader(shader)

        const msg = gl.getShaderInfoLog(shader)
        if (msg.length > 0) {
            this.delete()
            throw new Error(`Shader compiling failed:\n${msg}`)
        }
        
        this.shader = shader
    }
    delete() {
        const gl = this.gfx.gl
        gl.deleteShader(this.shader)
        this.shader = null
        this.delete = () => { throw new Error("Can't delete twice") }
    }
    /** @returns {boolean} */
    get exists() {
        return this.shader != null
    }
}

class GFXBufferBase {
    /**
     * @param {GFX} gfx
     * @param {number} bind
     * @param {GFXBufferOptimizationHint} [optimizationHint]
    */
    constructor(gfx, bind, optimizationHint = null) {
        /** @private {GFX} */
        this.gfx = gfx
        /** @private {number} */
        this.bind = bind
        /** @private {number} */
        this.newUsage = GFXMappings.bufferUsage(optimizationHint ?? 'dynamic-draw')
        /** @private {number} */
        this.byteLength = 0
        /** @private {WebGLBuffer} */
        this.buffer = gfx.gl.createBuffer()
    }
    /**
     * > **Warning**
     * > There's a Chromium bug (2023): `static-read`, `dynamic-read`, `stream-read` optimization hints cause `pipeline stall` warning in the console whenever you read from buffer even if `gfx.finish()` was called properly
     * @param {GFXBufferOptimizationHint} optimizationHint
     * @returns {GFXBuffer}
    */
    hint(optimizationHint) {
        this.newUsage = GFXMappings.bufferUsage(optimizationHint)
        return this
    }
    /**
     * Allocates / reallocates if size changed or if its hint changed
     * @param {number[]|TypedArray|SharedArrayBuffer|ArrayBuffer|DataView} data 
     * @param {GFXNumberType} [type] - Only specify when 'data' is not a TypedArray
     * @returns {GFXBuffer}
     * @example
     * buffer.write([1,2,3]) // 32-bit float by default but may cause confusion
     * buffer.write([1,2,3], 'float') // I do recommend this
     * buffer.write(new Float32Array([1,2,3])) // And this
    */
    write(data, type) {
        const gl = this.gfx.gl

        if (data instanceof Array) {
            const typedArrayType = GFXMappings.typedArrayOfType(type ?? 'float')
            data = new typedArrayType(data)
        }

        gl.bindBuffer(this.bind, this.buffer)
        if (this.usage == this.newUsage && this.byteLength == data.byteLength)
            gl.bufferSubData(this.bind, 0, data)
        else {
            /** @private {number} */
            this.usage = this.newUsage
            gl.bufferData(this.bind, data, this.usage)
            this.byteLength = data.byteLength
        }

        return this
    }
    /**
     * Same as GFXBuffer.write but without setting data
     * @param {number} byteLength
     * @returns {GFXBuffer}
    */
    alloc(byteLength) {
        const gl = this.gfx.gl

        gl.bindBuffer(this.bind, this.buffer)
        if (this.usage != this.newUsage || this.byteLength != byteLength) {
            /** @private {number} */
            this.usage = this.newUsage
            gl.bufferData(this.bind, byteLength, this.usage)
            this.byteLength = byteLength
        }

        return this
    }
    /**
     * @param {number[]|TypedArray|SharedArrayBuffer|ArrayBuffer|DataView} data 
     * @param {number} [byteOffset]
     * @param {GFXNumberType} [type] - Only specify when 'data' is not a TypedArray
     * @returns {GFXBuffer}
    */
    subwrite(data, byteOffset, type) {
        const gl = this.gfx.gl

        if (data instanceof Array) {
            const typedArrayType = GFXMappings.typedArrayOfType(type ?? 'float')
            data = new typedArrayType(data)
        }

        gl.bindBuffer(this.bind, this.buffer)
        gl.bufferSubData(this.bind, byteOffset ?? 0, data) // Support of last two args is not needed: .subarray() handles all the shit

        return this
    }
    /**
     * @param {number} [byteOffset]
     * @returns {ArrayBuffer}
     */
    read(byteOffset = 0) {
        const gl = this.gfx.gl
        gl.bindBuffer(this.bind, this.buffer)
        const buffer = new ArrayBuffer(this.byteLength - byteOffset)
        gl.getBufferSubData(this.bind, byteOffset, new DataView(buffer))
        return buffer
    }
    /**
     * @param {ArrayBufferView} destination
     * @param {number} [srcByteOffset]
     * @param {number} [byteLength]
     * @returns {GFXBuffer}
    */
    readTo(destination, srcByteOffset, byteLength) {
        const gl = this.gfx.gl
        gl.bindBuffer(this.bind, this.buffer)
        gl.getBufferSubData(this.bind, srcByteOffset, destination, 0, Math.floor(byteLength / (destination.BYTES_PER_ELEMENT ?? 1)))
        return this
    }
    /**
     * GPU to GPU copy.
     * Potentially more effective than:
     * ```js
     * dstBuffer.write(srcBuffer.read())
     * ```
     * @param {GFXBuffer} destination
     * @param {number} [srcByteOffset]
     * @param {number} [dstByteOffset]
     * @param {number} [byteLength]
     * @returns {GFXBuffer}
    */
    copyTo(destination, srcByteOffset, dstByteOffset, byteLength) {
        const gl = this.gfx.gl
        gl.bindBuffer(gl.COPY_READ_BUFFER, this.buffer)
        gl.bindBuffer(gl.COPY_WRITE_BUFFER, destination.buffer)
        gl.copyBufferSubData(gl.COPY_READ_BUFFER, gl.COPY_WRITE_BUFFER, srcByteOffset ?? 0, dstByteOffset ?? 0, byteLength ?? this.byteLength)
        return this
    }
    delete() {
        const gl = this.gfx.gl
        gl.deleteBuffer(this.buffer)
        this.buffer = null
        this.delete = () => { throw new Error("Can't delete twice") }
    }
    /** @returns {boolean} */
    get exists() {
        return this.buffer != null
    }
}
class GFXBuffer extends GFXBufferBase {
    /**
     * @param {GFX} gfx
     * @param {GFXBufferOptimizationHint} [optimizationHint]
    */
    constructor(gfx, optimizationHint = null) {
        super(gfx, gfx.gl.ARRAY_BUFFER, optimizationHint)
    }
}
class GFXIndexBuffer extends GFXBufferBase {
    /**
     * @param {GFX} gfx
     * @param {GFXBufferOptimizationHint} [optimizationHint]
    */
    constructor(gfx, optimizationHint = null) {
        super(gfx, gfx.gl.ELEMENT_ARRAY_BUFFER, optimizationHint)
    }
}

class GFXShaderAttribute {
    /**
     * @param {GFX} gfx
     * @param {GLint} location
     * @param {number} type
    */
    constructor(gfx, location, type) {
        /** @private {GFX}*/
        this.gfx = gfx
        /** @private {GLint}*/
        this.location = location
        const mapped = GFXMappings.attribType(type)
        /** @private {Function} */
        this.func = mapped[0]
        /** @private {number} */
        this.padTo = mapped[1]
        /** @private {number} */
        this.maxCallCount = mapped[2]
    }
    /**
     * @param {GFXBuffer} buffer
     * @param {GFXNumberType} type
     * @param {number} valuesPerVertex
     * @param {boolean} [normalized]
     * @returns {Object.<string, GFXShaderAttribute>}
    */
    setBuffer(buffer, type, valuesPerVertex, normalized = false) {
        const gl = this.gfx.gl
 
        const type_ = GFXMappings.numberType(type)

        if (!this.gfx.arrayedAttrs.has(this.location)) {
            this.gfx.arrayedAttrs.add(this.location)
            gl.enableVertexAttribArray(this.location)
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer)
        // TODO: more control over last two args in user-friendly manner
        gl.vertexAttribPointer(this.location, valuesPerVertex, type_, normalized, 0, 0)
        return this.gfx.attributes
    }
    /**
     * @param {...number} values
     * @returns {Object.<string, GFXShaderAttribute>}
     * @example
     * // It is recommended to use uniforms for that kind of shit
     * // Although this approach
     * gfx.attributes[0].setSingle(1)
     * // Is obviously better than this
     * const buffer = gfx.createBuffer().write([1], 'float')
     * gfx.attributes[0].setBuffer(buffer)
     * 
     * // BTW, matrices supported
     * // glsl: 'in mat3 aHello;'
     * gfx.attributes.aHello.setSingle(0, 1, 2, 3, 4, 5, 6, 7, 8)
    */
    setSingle(...values) {
        const gl = this.gfx.gl
        if (this.gfx.arrayedAttrs.has(this.location)) {
            this.gfx.arrayedAttrs.delete(this.location)
            gl.disableVertexAttribArray(this.location)
        }
        const len = Math.min(values.length, this.maxCallCount * this.padTo)
        for (let i = 0; i < len; i += this.padTo)
            this.func.call(gl, this.location + i / this.padTo, ...values.slice(i, i + this.padTo), 0, 0, 0, 0)
    }
}
class GFXShaderUniform {
    /**
     * @param {GFXShaderProgram} program
     * @param {WebGLUniformLocation} location
     * @param {number} type
    */
    constructor(program, location, type) {
        /** @private {GFXShaderProgram} */
        this.program = program
        /** @private {WebGLUniformLocation} */
        this.location = location
        /** @private {GLint} */
        this.type = type
        const mapped = GFXMappings.uniformType(type)
        /** @private {Function} */
        this.func = mapped[0]
        /** @private {boolean} */
        this.isMatrix = mapped[1]
        /** @private {boolean} */
        this.isSampler = mapped[2]
    }
    #_set(transposed, values) {
        const program = this.program
        const gfx = program.gfx
        const gl = gfx.gl
        
        let args = [gl, this.location]
        if (this.isMatrix) args.push(transposed)
        let vals = []
        for (const value of values)
            if (value?.[Symbol.iterator])
                vals.push(...value)
            else
                vals.push(value)
        vals = vals.map(val => {
            if (val instanceof GFXTexture) {
                const slot = gfx.textureSlotCounter
                gfx.setTextureSlot(slot, val)
                gfx.textureSlotCounter = (gfx.textureSlotCounter + 1) % gfx.textureSlotsCount
                return slot
            }
            return val
        })
        if (this.isSampler) {
            program.usedTextureSlots.set(this, vals)
        }
        args.push(vals)

        if (gfx.currentProgram != this.program) {
            gl.useProgram(this.program.program)
            gfx.currentProgram = this.program
        } 
        this.func.call(...args)
        return this.program.uniforms
    }
    /**
     * @param  {...(number | Iterable.<number>)} values
     * @returns {Object.<string, GFXShaderUniform & Object.<string, GFXShaderUniform>>}
     */
    set(...values) {
        return this.#_set(false, values)
    }
    /**
     * Relevant only for `mat2` / `mat3` / `mat4`.
     * `setTransposed` transposes matrix/matrices via **GPU** before setting uniform.
     * @param  {...(number | Iterable.<number>)} values
     * @returns {Object.<string, GFXShaderUniform & Object.<string, GFXShaderUniform>>}
     */
    setTransposed(...values) {
        return this.#_set(true, values)
    }
}
class GFXShaderBlock {
    /**
     * @param {GFXShaderProgram} program
     * @param {number} index
     * @param {number} dataSize
    */
    constructor(program, index, bindingPoint, dataSize) {
        /** @private {GFXShaderProgram}*/
        this.program = program
        /** @private {number}*/
        this.index = index
        /** @private {number}*/
        this.bindingPoint = bindingPoint
        /** @type {number}*/
        this.byteLength = dataSize
    }
    /**
     * @param {number|GFXBuffer} slotOrBuffer
     * @param {GFXNumberType} type
     * @param {number} valuesPerVertex
     * @param {boolean} [normalized]
     * @returns {Object.<string, GFXShaderBlock>}
     * @example
     * // It is recommended to manually
     * // Manage slots for better performance
     * 
     * // This bad:
     * gfx.blocks.bMyBlock.set(myBuffer)
     * 
     * // This good:
     * gfx.setBlockSlot(0, myBuffer)
     * gfx.blocks.bMyBlock.set(0)
     * // Although difference can be negligible
    */
    set(slotOrBuffer) {
        const gfx = this.program.gfx
        const gl = gfx.gl
        if (slotOrBuffer instanceof GFXBuffer) {
            const buffer = slotOrBuffer
            slotOrBuffer = gfx.blockSlotCounter
            gl.bindBufferBase(gl.UNIFORM_BUFFER, slotOrBuffer, buffer.buffer)
            gfx.blockSlotCounter = (gfx.blockSlotCounter + 1) % gfx.blockSlotsCount
        }
        if (this.bindingPoint != slotOrBuffer) {
            gl.uniformBlockBinding(this.program.program, this.index, slotOrBuffer)
            this.bindingPoint = slotOrBuffer
        }
        return this.program.blocks
    }
}
class GFXShaderProgram {
    #vertexShader
    #fragmentShader
    /**
     * @param {GFX} gfx
     * @param {GFXShader} vertexShader
     * @param {GFXShader} fragmentShader
     * @param {boolean} [ownVertexShader]
     * @param {boolean} [ownfragmentShader]
    */
    constructor(gfx, vertexShader, fragmentShader, ownVertexShader = false, ownFragmentShader = false) {
        /** @private {GFX} */
        this.gfx = gfx

        const gl = gfx.gl

        /** @private {WebGLProgram} */
        this.program = gl.createProgram()
        gl.attachShader(this.program, vertexShader.shader)
        gl.attachShader(this.program, fragmentShader.shader)
        gl.linkProgram(this.program)

        /** @private {GFXShader} */
        this.#vertexShader = vertexShader
        /** @private {GFXShader} */
        this.#fragmentShader = fragmentShader
        /** @private {boolean} */
        this.ownsVertexShader = ownVertexShader
        /** @private {boolean} */
        this.ownsFragmentShader = ownFragmentShader

        /**
         * @type {Object.<string, GFXShaderAttribute>}
         * @example
         * program.attributes.aMyAttributeName // By ID
         * program.attributes[0] // By location
        */
        this.attributes = { }
        let numAttribs = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES)
        for (let i = 0; i < numAttribs; ++i) {
            const active = this.gfx.gl.getActiveAttrib(this.program, i)
            const location = gl.getAttribLocation(this.program, active.name)
            if (location == -1) continue
            const attribute = new GFXShaderAttribute(this.gfx, location, active.type)
            this.attributes[active.name] = attribute
            this.attributes[attribute.location] = attribute
        }
        this.attributes = new Proxy(this.attributes, {
            get(t, p) {
                if (t[p] != null)
                    return t[p]
                const charCode = p.charCodeAt(0)
                if (charCode > 47 && charCode < 58)
                    return new GFXShaderAttribute(this, Number(p))
                throw new Error(`Attribute '${p}' doesn't exist in the shader program. There's a chance that it was optimized out, check for sure`)
            }
        })

        /**
         * @type {Object.<string, GFXShaderUniform & Object.<string, GFXShaderUniform>>} 
         * @example
         * program.uniforms.aMyUniformName // By ID
         * // 'By location' is not available because of WebGL
        */
        this.uniforms = { }
        let numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS)
        for (let i = 0; i < numUniforms; ++i) {
            // TODO: Check what gl.getActiveUniforms does
            const active = gl.getActiveUniform(this.program, i)
            const location = gl.getUniformLocation(this.program, active.name)
            const uniform = new GFXShaderUniform(this, location, active.type)
            // Uniforms are protected from getting their locations
            // So the only way to set them is by their name
            this.uniforms[active.name] = uniform
            const splitted = active.name.match(/([^\[\].]+)/g)
            if (splitted[splitted.length - 1][0] == '0')
                splitted.pop()
            let last = this.uniforms
            for (let i = 0; i < splitted.length; ++i) {
                const id = splitted[i]
                if (!last[id])
                    last[id] = i == (splitted.length - 1) ? uniform : {}
                else if (last[id] instanceof GFXShaderUniform)
                    break
                last = last[id]
            }
        }
        this.uniforms = new Proxy(this.uniforms, {
            get(t, p) {
                if (t[p] == null)
                    throw new Error(`Uniform '${p}' doesn't exist in the shader program. There's a chance that it was optimized out, check for sure`)
                return t[p]
            }
        })

        /**
         * @type {Object.<string, GFXShaderBlock>} 
         * @example
         * program.blocks.bMyUniformBlockName // By ID
         * program.blocks[0] // By index
        */
        this.blocks = { }
        let numBlocks = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORM_BLOCKS)
        for (let i = 0; i < numBlocks; ++i) {
            const name = gl.getActiveUniformBlockName(this.program, i)
            const index = gl.getUniformBlockIndex(this.program, name)
            const bindingPoint = gl.getActiveUniformBlockParameter(this.program, index, gl.UNIFORM_BLOCK_BINDING)
            const dataSize = gl.getActiveUniformBlockParameter(this.program, index, gl.UNIFORM_BLOCK_DATA_SIZE)
            // не ебу нахуя но const activeUniforms = gl.getActiveUniformBlockParameter(this.program, index, gl.UNIFORM_BLOCK_ACTIVE_UNIFORMS)
            // не ебу нахуя но const activeUniformIndices = gl.getActiveUniformBlockParameter(this.program, index, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES)
            // не ебу нахуя но const referencedByVertexShader = gl.getActiveUniformBlockParameter(this.program, index, gl.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER)
            // не ебу нахуя но const referencedByFragmentShader = gl.getActiveUniformBlockParameter(this.program, index, gl.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER)
            const block = new GFXShaderBlock(this, index, bindingPoint, dataSize)
            this.blocks[name] = block
            this.blocks[index] = block
        }
        this.blocks = new Proxy(this.blocks, {
            get(t, p) {
                if (t[p] == null)
                    throw new Error(`Block (Uniform block) '${p}' doesn't exist in the shader program. There's a chance that it was optimized out, check for sure`)
                return t[p]
            }
        })

        /** @private */
        this.usedTextureSlots = new Map
    }
    delete() {
        const gl = this.gfx.gl

        gl.deleteProgram(this.program)
        this.program = null
        
        if (this.ownsVertexShader && this.#vertexShader.exists)
            this.#vertexShader.delete()
        if (this.ownsFragmentShader && this.#fragmentShader.exists)
            this.#fragmentShader.delete()

        this.delete = () => { throw new Error("Can't delete twice") }
        return this
    }
    /** @returns {boolean} */
    get exists() {
        return this.program != null
    }
    /**
     * Will return undefined if this shader program doesn't own the fragment shader 
     * @returns {GFXShader?}
    */
    get fragmentShader() {
        if (this.ownsFragmentShader)
            return this.#fragmentShader
    }
    /**
     * Will return undefined if this shader program doesn't own the vertex shader 
     * @returns {GFXShader?}
    */
    get vertexShader() {
        if (this.ownsVertexShader)
            return this.#vertexShader
    }
}

export class GFX {
    /**
     * @param {HTMLCanvasElement|string} canvas
     * @param {CanvasRenderingContext2DSettings?} glSettings
     * @example
     * const canvas = document.createElement("canvas")
     * const gfx = new GFX(canvas)
    */
    constructor(canvas, glSettings) {
        if (canvas == null)
            canvas = document.createElement('canvas')

        if (typeof canvas == 'string')
            canvas = document.querySelector(canvas) 

        /** @type {HTMLCanvasElement} */
        this.canvas = canvas

        /** @type {WebGL2RenderingContext} */
        const gl = canvas.getContext('webgl2', {
            alpha: false, // Support transparency of canvas
            desynchronized: true,
            preserveDrawingBuffer: true,
            // powerPreference: 'high-performance',
            ...glSettings
        })

        if (gl == null) throw new Error('WebGL2 not supported')
        /** @type {WebGL2RenderingContext} */
        this.gl = gl

        // Happens before running fragment shader
        // Useful for performance
        gl.enable(gl.DEPTH_TEST)
        gl.depthFunc(gl.LEQUAL)

        // Makes alpha channel useful
        // Without this, drawing #FF000000 will overwrite previous color with black even though alpha is 00
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        /** @type {{[ext: string]: any}} */
        this.ext = { }
        /** @private */ // Anisotropy is just like normal mipmaps but it supports single-axis scaling without pixelating the second axis
        this.anisotropy = gl.getExtension('EXT_texture_filter_anisotropic')
        /** @type {number} */
        this.maxAnisotropy = gl.getParameter(this.anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
        /** @type {number} */
        this.maxMipmap = Math.floor(Math.log2(gl.getParameter(gl.MAX_TEXTURE_SIZE))) + 1
        /**
         * @type {Object.<string, GFXShaderAttribute>}
         * @example
         * gfx.attributes.aMyAttributeName // By ID
         * gfx.attributes[0] // By location
        */
        this.attributes = new Proxy({}, {
            get: (_, p) => {
                const charCode = p.charCodeAt(0)
                if (charCode > 47 && charCode < 58)
                    return new GFXShaderAttribute(this, Number(p))
                if (this.programForDrawing)
                    return this.programForDrawing.attributes[p]
                throw new Error(`Referring to attributes by their names via gfx.attributes requires program to be selected`)
            }
        })
        /** @private */
        this.arrayedAttrs = new Set 
        /** @type {number} */
        this.blockSlotsCount = gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS)
        /** @private {number} */
        this.blockSlotCounter = 0
        /** @type {number} */
        this.textureSlotsCount = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS)
        /** @private {number} */
        this.textureSlotCounter = 0
        /** @private */
        this.textureBinds = new Map
        /** @private */
        /** @type {number} */
        this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
        /** @private */
        this.screenForDrawing = null
        /** @private */
        this.scissorsForDrawing = null
        /** @private */
        this.textureSlots = new Map
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @returns {GFX}
     */
    setDrawArea(x, y, width, height) {
        this.scissorsForDrawing = [x, y, width, height]
        return this
    }
    /**
     * @returns {GFX}
     */
    resetDrawArea() {
        this.scissorsForDrawing = null
        return this
    }

    /**
     * @param {number} slot 
     * @param {GFXBuffer} buffer
     * @returns {GFX}
    */
    setBlockSlot(slot, buffer) {
        const gl = this.gl
        gl.bindBufferBase(gl.UNIFORM_BUFFER, slot, buffer.buffer)
        return this
    }
    /**
     * @param {number} slot 
     * @param {GFXTexture} texture
     * @returns {GFX}
    */
    setTextureSlot(slot, texture) {
        const gl = this.gl
        this.textureSlots.set(slot, texture)
        if (this.activeTextureBind == texture.bind && this.textureBinds.get(this.activeTextureBind) != this.activeTexture) {
            gl.bindTexture(this.activeTextureBind, this.activeTexture)
            this.textureBinds.set(this.activeTextureBind, this.activeTexture)
        }
        gl.activeTexture(gl.TEXTURE0 + slot)
        gl.bindTexture(texture.bind, texture.texture)
        this.textureBinds.set(texture.bind, texture.texture)
        /** @private */ this.activeTextureBind = texture.bind
        /** @private */ this.activeTexture = texture.texture
        return this
    }

    // #region Shader And Program Functions
    /**
     * @param {string} code
     * @param {Object.<string, any> | string[]} [defines]
     * @returns {string}
     * @example
     * const modifiedShaderCode = gfx.compileShader(`
     *     #ifdef USE_UV
     *     out vec2 vUV;
     *     #endif
     * 
     *     void main() {
     *         int bits = gl_VertexID % 3 + gl_VertexID / 3;
     *         vec2 v = vec2(bits >> 1 & 1, bits & 1);
     *     #ifdef USE_UV
     *         vUV = v;
     *     #endif
     *         gl_Position = vec4(v * 2. - 1., 0, 1);
     *     }
     * `, ['USE_UV'])
    */
    compileShader(code, defines) {
        const codeBefore = code.match(/^\s*#version.*\n*/)?.[0] ?? ''
        const codeAfter = code.substring(codeBefore.length)

        const defines_ = defines instanceof Array ? defines.map(x=>[x]) : Object.entries(defines ?? {})

        return codeBefore + [
                ...defines_.map(x => x[1] == null ? `#define ${x[0]}` : `#define ${x[0]} ${x[1]}`),
                codeAfter
            ].join('\n')
    }
    /**
     * @param {...string} code 
    */
    consolidateShaders(...codes) {

        // НАДО ПРОВЕРИТЬ КАКОЙ location У fragColor2
        // layout(location = 1) out vec4 fragColor1;
        // out vec4 fragColor2;

        // НАДО ПРОВЕРИТЬ ЗАНИМАЕТ ЛИ _2FragColors 2 location-а
        // out vec4 _2FragColors[2];

        function walkTree(ast, cb) {
            const els = new Set
            const arg = [ast]
            function walk(a) {
                const entries = Object.entries(a)
                for (let i = 0; i < entries.length; ++i) {
                    const e = entries[i][1]
                    if (typeof e === 'object' & e !== null) {
                        if (els.has(e))
                            continue
                        els.add(e)
                        if (arg != a) {
                            e._parent = a
                            e._indexInParent = entries[i][0]
                        }
                        if (Object.keys(e)[0] == 'type') {
                            const arg = { node: e }
                            cb(arg)
                            entries[i][1] = arg.node
                        }
                        walk(e, cb)
                    }
                }
            }
            walk(arg)
        }
        let outCodes = []
        const versions = new Set
        const outVars = []
        // const extensions = new Set
        for (let i = 0; i < codes.length; ++i) {
            const code = (() => {
                const defineMap = new Map
                return codes[i].split(/\r?\n/).map((line, n) => {
                    const l = line.trim()
                    if (/^#version/.test(l))
                        return (versions.add(l.split(/\s+/).slice(1).join(' ')), null)
                    //if (/^#extension/.test(l))
                    //    return (extensions.add(l.split(/\s+/).slice(1).join(' ')), null)
                    if (/^#define\s+(\w+)/.test(l)) {
                        const s = l.split(' ')[1]
                        defineMap.set(s, `_frag${i+1}_${s}`)
                    }
                    let lineOut = line
                    for (const [name, newName] of defineMap)
                        lineOut = lineOut.replace(new RegExp(`\\b${name}\\b`, 'g'), newName)
                    return lineOut
                }).filter(x => x != null).join('\n')
            })()

            const AST = frog.parser.parse(code)
            const scope = AST.scopes.find(x => x.name == 'global')


            const nameArr = Object.entries(scope.types).concat(Object.entries(scope.bindings))
            const nameMap = new Map
            for (const [name, e] of nameArr) {
                nameMap.set(name, `_frag${i+1}_${name}`)
                if (!e.references)
                    continue
                for (const ref of Object.values(e.references))
                    ref.identifier = nameMap.get(ref.identifier)
            }

            const funcMap = new Map
            for (const [name, e] of Object.entries(Object.fromEntries(Object.entries(scope.functions).filter(x => Object.values(x[1]).every(x => x.returnType != 'UNKNOWN TYPE'))))) {
                const newName = `_frag${i+1}_${name}`
                funcMap.set(name, newName)
                Object.values(e)[0].declaration.prototype.header.name.identifier = newName
            }
        
            let locationCounter = 0
            AST.program = AST.program.filter((e) => {
                if (e.type != 'declaration_statement')
                    return true
                if (!e.declaration?.specified_type?.qualifiers?.some(x => x.token == 'out'))
                    return true
                if (e.declaration.specified_type.specifier.specifier.type != 'keyword')
                    throw new Error("Can't consolidate with non-primitive out")
                // outVars[]
                console.log(e.declaration.specified_type.specifier.specifier.token)
                console.log(e.declaration.declarations.map(x => x.identifier.identifier))
                return false
            })

            walkTree(AST, e => {
                // out устранить дубликаты + чё делать с [] и struct
                // in
                // uniform

                // не аффектить имена in (если location указан, то по нему, иначе по имени)
                // не аффектить имена uniform (если location указан, то по нему, иначе по имени)
                // out-ы обьеденить по авто index out

                // How to handle weird outs?
                // Throw error for now

                // Что делать если один и тот же location либо один и тот же name, но типы отличаются? Выкинуть ошибку.


                if (e.node.type == 'fully_specified_type') {
                    const precised = e.node.qualifiers?.some(x => x.type == 'keyword' && ['lowp', 'mediump', 'highp'].includes(x.token)) ?? false
                    const type = e.node.specifier.specifier.token
                    if (precised || type == 'void') return
                    let types = [type]
                    if (['vec2', 'vec3', 'vec4', 'mat2', 'mat3', 'mat4'].includes(type))
                        types.push('float')
                    if (['ivec2', 'ivec3', 'ivec4', 'uint'].includes(type))
                        types.push('int')
                    const prec = (() => {
                        let a = e.node, l
                        while (a) {
                            [a, l] = ((e) => {
                                while (true) {
                                    let o = e
                                    e = e._parent
                                    if (e instanceof Array || e == null)
                                        return [e, e?.indexOf(o)]
                                }
                            })(a)
                            for (let i = l - 1; i >= 0; --i) {
                                const e = a[i]
                                if (
                                    e.type == 'declaration_statement' &&
                                    e?.declaration?.type == 'precision' &&
                                    types.includes(e.declaration.specifier.specifier.token)
                                )
                                    return e.declaration.qualifier.token
                            }
                        }
                    })()
                    if (!e.node.qualifiers)
                        e.node.qualifiers = []
                    if (prec)
                        e.node.qualifiers.push({ type: 'keyword', token: prec, whitespace: ' ' })
                    return
                }

                if (e.node.type == 'function_call') {
                    const id = e.node.identifier.specifier.identifier
                    const mappedName = funcMap.get(id)
                    if (mappedName)
                        e.node.identifier.specifier.identifier = mappedName
                    return
                }
            })
            walkTree(AST, e => {
                if (e.node.type == 'declaration_statement' && e.node.declaration?.type == 'precision')
                    delete e.node._parent[e.node._indexInParent]
            })
            outCodes.push(AST)
        }

        if (versions.size > 1 || (versions.size == 1 && !versions.has('300 es')))
            throw new Error('Unsupported shader version')

        // сделать ауты
        // для начала сойдёт обычная поддержка дефолтных ебланов
        let introCode = `#define FRAG_COLOR 123`
        let autroCode = `void main(){${codes.map((_, i) => `_frag${i+1}_main();`).join('')}}`
        return [introCode, ...outCodes, autroCode].map(x => frog.generate(x)).join('\n')
    }
    /**
     * @param {GFXShaderType} type
     * @param {string} code
     * @returns {GFXShader}
     * @example
     * // '#version 300 es' added by default
     * const shader = gfx.createShader('fragment', `
     *     precision mediump float;
     *     out vec4 fragColor;
     *     void main() {
     *         fragColor = vec4(1, 0, 0, 1);
     *     }
     * `)
    */
    createShader(type, code) {
        return new GFXShader(this, type, code)
    }
    /**
     * @param {GFXShader | string} vertexShader
     * @param {GFXShader | string} fragmentShader
     * @returns {GFXShaderProgram}
     * @example
     * const program = gfx.createShaderProgram(`
     *     in vec2 aVertex;
     *     void main() {
     *         gl_Position = vec4(aVertex, 0, 1);
     *     }
     * `, `
     *     precision mediump float;
     *     out vec4 fragColor;
     *     void main() {
     *         fragColor = vec4(1, 0, 0, 1);
     *     }
     * `)
    */
    createProgram(vertexShader, fragmentShader) {

        const ownVertShader = !(vertexShader instanceof GFXShader)
        const vertShader = ownVertShader ? this.createShader('vertex', vertexShader) : vertexShader

        const ownFragShader = !(fragmentShader instanceof GFXShader)
        const fragShader = ownFragShader ? this.createShader('fragment', fragmentShader) : fragmentShader

        return new GFXShaderProgram(this, vertShader, fragShader, ownVertShader, ownFragShader)
    }
    /**
     * @param {GFXShaderProgram} program
     * @returns {GFX}
    */
    useProgram(program) {
        /** @private {GFXShaderProgram} */
        this.programForDrawing = program
        return this
    }
    /**
     * @param {GFXIndexBuffer} indexBuffer
     * @returns {GFX}
    */
    useIndices(indexBuffer) {
        /** @private {GFXIndexBuffer} */
        this.currentIndexBuffer = indexBuffer
        return this
    }
    /**
     * @param {GFXTexture[]|GFXTexture} textures
     * @param {GFXVirtualScreenAdditionalBuffer[]?} additionalBuffers
     * @returns {GFXVirtualScreen}
     * @example
     * TODO!!!
    */
    createScreen(textures, additionalBuffers) {
        return new GFXVirtualScreen(this, textures, additionalBuffers)
    }

    /**
     * @param {GFXVirtualScreen} [screen]
     * @returns {GFX}
    */
    useScreen(screen) {
        this.screenForDrawing = screen
        return this
    }
    // #endregion
    // #region Canvas Size
    /**
     * Canvas size
     * @returns {[number, number]}
    */
    get size() {
        return [this.canvas.width, this.canvas.height]
    }
    /**
     * Canvas size
     * @param {[number, number]} value
    */
    set size(value) {
        this.canvas.width = value[0]
        this.canvas.height = value[1]
    }
    /**
     * Canvas width
     * @returns {number}
    */
    get width() {
        return this.canvas.width
    }
    /**
     * Canvas width
     * @param {number} value
    */
    set width(value) {
        this.canvas.width = value
    }
    /**
     * Canvas height
     * @returns {number}
    */
    get height() {
        return this.canvas.height
    }
    /**
     * Canvas height
     * @param {number} value
    */
    set height(value) {
        this.canvas.height = value
    }

    /**
     * Canvas width divided by height
    */
    get ratio() {
        const canvas = this.canvas
        return canvas.width / canvas.height
    }
    // #endregion
    // #region Current Program Shorthands (uniforms, attributes)
    /**
     * @returns {Object.<string, GFXShaderUniform & Object.<string, GFXShaderUniform>>}
     * @example
     * gfx.uniforms.aMyUniformName // By ID
     * // 'By location' is not available because of WebGL
    */
    get uniforms() {
        if (this.programForDrawing == null)
            throw new Error("gfx.uniforms requires program to be selected")
        return this.programForDrawing.uniforms
    }
    /**
     * @returns {Object.<string, GFXShaderBlock & Object.<string, GFXShaderBlock>>}
     * @example
     * gfx.blocks.bMyUniformBlockName // By ID
     * gfx.blocks[0] // By location
    */
    get blocks() {
        if (this.programForDrawing == null)
            throw new Error("gfx.blocks requires program to be selected")
        return this.programForDrawing.blocks
    }
    // #endregion
    // #region Draw Functions
    
    #preDraw() {
        const gl = this.gl
        const emptyArr = []
        const scissorsOld = this.currentScissors ?? emptyArr
        const scissorsNew = this.scissorsForDrawing ?? emptyArr
        if (scissorsOld.length != scissorsNew.length || scissorsOld.some((v, i) => v !== scissorsNew[i])) {
            if (this.scissorsForDrawing != null) {
                if (this.currentScissors == null)
                    gl.enable(gl.SCISSOR_TEST)
                gl.scissor(...scissorsNew)
            }
            else if (this.currentScissors != null)
                gl.disable(gl.SCISSOR_TEST)
            this.currentScissors = this.scissorsForDrawing
        }
        if (this.currentScreen != this.screenForDrawing) {
            if (this.screenForDrawing && !this.screenForDrawing.complete)
                throw new Error('Screen is not valid')
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.screenForDrawing?.framebuffer)
            this.currentScreen = this.screenForDrawing
        }
        if (this.screenForDrawing)
            for (const texture of this.screenForDrawing.textures)
                texture.mipmapOutdated = true
    }

    #preProgramDraw() {
        this.#preDraw()
        const gl = this.gl

        if (!this.programForDrawing)
            throw new Error("Can't draw without program")

        for (const [_, slots] of this.programForDrawing.usedTextureSlots)
            for (const slot of slots) {
                const txt = this.textureSlots.get(slot)
                if (txt && txt.autoMipmap && txt?.mipmapOutdated)
                    txt.genMipmap()
            }

        // for (const [_, set] of this.programForDrawing.usedTextureSlots) {
        //     for (const txt of set) {
        //         console.log(txt)
        //     }
        // }

        // Задетектить все текстуры которые щас будут использоваться в рендере как uniform
        // Для каждой чекнуть:
        // const isMipmapGenerated = gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL) === 0
        // И всё ебать

        if (this.currentProgram != this.programForDrawing) {
            gl.useProgram(this.programForDrawing.program)
            /** @private */
            this.currentProgram = this.programForDrawing
        }
        if (this.textureBinds.get(this.activeTextureBind) != this.activeTexture) {
            gl.bindTexture(this.activeTextureBind, this.activeTexture)
            this.textureBinds.set(this.activeTextureBind, this.activeTexture)
        }
    }
    
    /**
     * @param {GFXPrimitive} primitive 
     * @param {number} count
     * @param {number} [offset]
     * @param {number} [instanceCount]
     * @returns {GFX}
    */
    drawVertices(primitive, count, offset = 0, instanceCount = 1) {
        this.#preProgramDraw()
        this.gl.drawArraysInstanced(GFXMappings.primitive(primitive), offset, count, instanceCount)
        return this
    }
    /**
     * @param {GFXPrimitive} primitive
     * @param {GFXIndicesDrawType} type
     * @param {number} count
     * @param {number} [offset]
     * @param {number} [instanceCount]
     * @returns {GFX}
    */
    drawIndices(primitive, type, count, offset = 0, instanceCount = 1) {
        const gl = this.gl
        if (!this.currentIndexBuffer)
            throw new Error('No index buffer selected. Use gfx.useIndices')
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.currentIndexBuffer.buffer) // TODO: Подумать
        this.#preProgramDraw()
        gl.drawElementsInstanced(GFXMappings.primitive(primitive), count, GFXMappings.numberType(type), offset, instanceCount)
        return this
    }
    // #endregion
    // #region Functions For Clearing
    /**
     * @param {number} value
     * @returns {GFX}
     * @example
     * gfx.setClearDepth(0).clear('depth')
    */
    setClearDepth(value) {
        this.gl.clearDepth(value)
        return this
    }
    /**
     * @param {number} value
     * @returns {GFX}
     * @example
     * gfx.setClearStencil(0).clear('stencil')
    */
    setClearStencil(value) {
        this.gl.clearStencil(value)
        return this
    }
    /**
     * @param {RGB|RGBA} value
     * @returns {GFX}
     * @example
     * gfx.setClearColor([0, 0, 0]).clear()
    */
    setClearColor(value) {
        /** @private */
        this.colorForClearing = [value[0], value[1], value[2], value[3] ?? 1]
        this.gl.clearColor(...this.colorForClearing)
        return this
    }
    /**
     * @param  {...GFXFrameMask} mask
     * @returns {GFX}
     * @example
     * // Clear color and depth
     * gfx.clear('color', 'depth')
     * // Clear depth only
     * gfx.clear('depth')
     * // Clear color (by default)
     * gfx.clear()
    */
    clear(...mask) {
        this.#preDraw()
        const gl = this.gl
        const mask_ = mask.length ? mask.reduce((a, b) => a | GFXMappings.frameMask(b), 0) : gl.COLOR_BUFFER_BIT
        gl.clear(mask_)
        return this
    }
    // #endregion
    // #region Miscellaneous
    /**
     * @param {number} [x]
     * @param {number} [y]
     * @param {number} [width]
     * @param {number} [height]
     * @returns {GFX}
     * @example
     * gfx.viewport()
     * // is same as
     * gfx.viewport(0, 0, ...gfx.size)
    */
    viewport(x, y, width, height) {
        this.gl.viewport(x?? 0, y ?? 0, width ?? this.canvas.width, height ?? this.canvas.height)
        return this
    }
    /**
     * @returns {GFX}
    */
    finish() {
        this.gl.finish()
        return this
    }
    // #endregion
    // #region Buffer Functions
    /**
     * > **Warning**
     * > There's a Chromium bug (2023): `static-read`, `dynamic-read`, `stream-read` optimization hints cause `pipeline stall` warning in the console whenever you read from buffer even if `gfx.finish()` was called properly
     * @param {GFXBufferOptimizationHint} [optimizationHint]
     * @returns {GFXBuffer}
    */
    createBuffer(optimizationHint) {
        return new GFXBuffer(this, optimizationHint)
    }
    /**
     * > **Warning**
     * > There's a Chromium bug (2023): `static-read`, `dynamic-read`, `stream-read` optimization hints cause `pipeline stall` warning in the console whenever you read from buffer even if `gfx.finish()` was called properly
     * @param {GFXBufferOptimizationHint} [optimizationHint]
     * @returns {GFXIndexBuffer}
    */
    createIndexBuffer(optimizationHint) {
        return new GFXIndexBuffer(this, optimizationHint)
    }
    // #endregion
    
    /**
     * @param {GFXTextureDimension} [dimension]
     * @param {GFXMutability} [mutability]
     * @param {GFXPixelFormat} [pixelFormat]
     * @param {GFXTextureSettings} [settings]
     * @param {GFXSampling} [initialSampling]
     * @returns {GFXTexture}
     * @example
     * // Create empty texture 1024x1024
     * gfx.createTexture().write(null, [1024, 1024])
    */
    createTexture(dimension, mutability, pixelFormat, settings, initialSampling) {
        return new GFXTexture(this, dimension, mutability, pixelFormat, settings, initialSampling)
    }


    
    delete() {
        const gl = this.gl
        gl.deleteFramebuffer(this.helperFramebuffer)
        /** @private */
        this.deleted = true
        this.delete = () => { throw new Error("Can't delete twice") }
    }
    /** @returns {boolean} */
    get exists() {
        return !this.deleted
    }

}

export const sampleShaders = {
    vertex: {
        fullscreenNoBuffer: /*glsl*/`
            out vec2 vUV;
            void main() {
                int bits = gl_VertexID % 3 + gl_VertexID / 3;
                vec2 v = vec2(bits >> 1 & 1, bits & 1);
                vUV = v;
                gl_Position = vec4(v * 2. - 1., 0, 1);
            }`,
        yFlippedFullscreenNoBuffer: /*glsl*/`
            out vec2 vUV;
            void main() {
                int bits = gl_VertexID % 3 + gl_VertexID / 3;
                vec2 v = vec2(bits >> 1 & 1, bits & 1);
                vUV = v;
                gl_Position = vec4((v * 2. - 1.) * vec2(1, -1), 0, 1);
            }`
    },
    fragment: {
        fancyWhiteNoise: /*glsl*/`
            uniform float uTime;
            in vec2 vUV;
            out vec4 fragColor;
            void main() {
                fragColor = vec4(vec3(fract(sin(dot(vUV, vec2(12.9898, 78.233))) * 43758.5453 + uTime)), 1.0);
            }`,
        hsvPalette: /*glsl*/`
            in vec2 vUV;
            out vec4 fragColor;
            vec3 hsv2rgb(vec3 hsv) {
                vec3 rgb;
                float c = hsv.y * hsv.z;
                float x = c * (1.0 - abs(mod((hsv.x / 60.0), 2.0) - 1.0));
                float m = hsv.z - c;
                
                if (hsv.x >= 0.0 && hsv.x < 60.0)
                    rgb = vec3(c, x, 0.0);
                else if (hsv.x >= 60.0 && hsv.x < 120.0)
                    rgb = vec3(x, c, 0.0);
                else if (hsv.x >= 120.0 && hsv.x < 180.0)
                    rgb = vec3(0.0, c, x);
                else if (hsv.x >= 180.0 && hsv.x < 240.0)
                    rgb = vec3(0.0, x, c);
                else if (hsv.x >= 240.0 && hsv.x < 300.0)
                    rgb = vec3(x, 0.0, c);
                else if (hsv.x >= 300.0 && hsv.x <= 360.0)
                    rgb = vec3(c, 0.0, x);
                else
                    rgb = vec3(0.0);
                return rgb + m;
            }
            void main() {
                fragColor = vec4(hsv2rgb(vec3(vUV.x * 360.0, vUV.y, 1.0)), 1);
            }`,
        passThrough: /*glsl*/`
            uniform sampler2D uTextureID;
            in vec2 vUV;
            out vec4 fragColor;
            void main() {
                fragColor = texture(uTextureID, vUV);
            }
        `
    }
}