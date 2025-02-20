// @ts-nocheck: go fuck yourself :)
import { sat, abs, max, min } from './shared-util.ts'

type RGBArgs = [[r: number, g: number, b: number, a?: number]] | [r: number, g: number, b: number, a?: number] | [{r: number, g: number, b: number, a?: number}]
type RGB = [r:number,g:number,b:number] & {
    r: number,
    g: number,
    b: number,
    get hsv(): HSV,
    get hsl(): HSL,
    get cmyk(): CMYK,
    get normalized(): RGB,
    normalize(): RGB,
}
type RGBA = [r:number,g:number,b:number,a:number] & {
    r: number,
    g: number,
    b: number,
    a: number,
    get hsv(): HSVA,
    get hsl(): HSLA,
    get cmyk(): CMYKA,
    get normalized(): RGBA,
    normalize(): RGBA,
}

type HSVArgs = [[h: number, s: number, v: number, a?: number]] | [h: number, s: number, v: number, a?: number] | [{h: number, s: number, v: number, a?: number}]
type HSV = [h:number,s:number,v:number] & {
    h: number,
    s: number,
    v: number,
    get rgb(): RGB,
    get hsl(): HSL,
    get cmyk(): CMYK,
    get normalized(): HSV,
    normalize(): HSV,
}
type HSVA = [h:number,s:number,v:number,a:number] & {
    h: number,
    s: number,
    v: number,
    a: number,
    get rgb(): RGBA,
    get hsl(): HSLA,
    get cmyk(): CMYKA,
    get normalized(): HSVA,
    normalize(): HSVA,
}

type HSLArgs = [[h: number, s: number, l: number, a?: number]] | [h: number, s: number, l: number, a?: number] | [{h: number, s: number, l: number, a?: number}]
type HSL = [h:number,s:number,l:number] & {
    h: number,
    s: number,
    l: number,
    get rgb(): RGB,
    get hsv(): HSV,
    get cmyk(): CMYK,
    get normalized(): HSL,
    normalize(): HSL,
}
type HSLA = [h:number,s:number,l:number,a:number] & {
    h: number,
    s: number,
    l: number,
    a: number,
    get rgb(): RGBA,
    get hsv(): HSVA,
    get cmyk(): CMYKA,
    get normalized(): HSLA,
    normalize(): HSLA,
}

type CMYKArgs = [[c: number, m: number, y: number, k: number, a?: number]] |[c: number, m: number, y: number, k: number, a?: number] | [{c: number, m: number, y: number, k: number, a?: number}]
type CMYK = [c:number,m:number,y:number,k:number] & {
    c: number,
    m: number,
    y: number,
    k: number,
    get rgb(): RGB,
    get hsv(): HSV,
    get hsl(): HSL,
    get normalized(): CMYK,
    normalize(): CMYK,
}
type CMYKA = [c:number,m:number,y:number,k:number,a:number] & {
    c: number,
    m: number,
    y: number,
    k: number,
    a: number,
    get rgb(): RGBA,
    get hsv(): HSVA,
    get hsl(): HSLA,
    get normalized(): CMYKA,
    normalize(): CMYKA,
}

interface Export_ {
    rgb(rgb  : [r: number, g: number, b: number])           : RGB,
    rgb(rgb  : {r: number, g: number, b: number})           : RGB,
    rgb(        r: number, g: number, b: number)            : RGB,
    rgb(rgba : [r: number, g: number, b: number, a: number]): RGBA,
    rgb(rgba : {r: number, g: number, b: number, a: number}): RGBA,
    rgb(        r: number, g: number, b: number, a: number) : RGBA,

    rgb2hsv(rgb  : [r: number, g: number, b: number])           : HSV,
    rgb2hsv(rgb  : {r: number, g: number, b: number})           : HSV,
    rgb2hsv(        r: number, g: number, b: number)            : HSV,
    rgb2hsv(rgba : [r: number, g: number, b: number, a: number]): HSVA,
    rgb2hsv(rgba : {r: number, g: number, b: number, a: number}): HSVA,
    rgb2hsv(        r: number, g: number, b: number, a: number) : HSVA,
    
    rgb2hsl(rgb  : [r: number, g: number, b: number])           : HSL,
    rgb2hsl(rgb  : {r: number, g: number, b: number})           : HSL,
    rgb2hsl(        r: number, g: number, b: number)            : HSL,
    rgb2hsl(rgba : [r: number, g: number, b: number, a: number]): HSLA,
    rgb2hsl(rgba : {r: number, g: number, b: number, a: number}): HSLA,
    rgb2hsl(        r: number, g: number, b: number, a: number) : HSLA,

    rgb2cmyk(rgb  : [r: number, g: number, b: number])           : CMYK,
    rgb2cmyk(rgb  : {r: number, g: number, b: number})           : CMYK,
    rgb2cmyk(        r: number, g: number, b: number)            : CMYK,
    rgb2cmyk(rgba : [r: number, g: number, b: number, a: number]): CMYKA,
    rgb2cmyk(rgba : {r: number, g: number, b: number, a: number}): CMYKA,
    rgb2cmyk(        r: number, g: number, b: number, a: number) : CMYKA,


    hsv(hsv  : [h: number, s: number, v: number])           : HSV,
    hsv(hsv  : {h: number, s: number, v: number})           : HSV,
    hsv(        h: number, s: number, v: number)            : HSV,
    hsv(hsva : [h: number, s: number, v: number, a: number]): HSVA,
    hsv(hsva : {h: number, s: number, v: number, a: number}): HSVA,
    hsv(        h: number, s: number, v: number, a: number) : HSVA,

    hsv2rgb(hsv  : [h: number, s: number, v: number])           : RGB,
    hsv2rgb(hsv  : {h: number, s: number, v: number})           : RGB,
    hsv2rgb(        h: number, s: number, v: number)            : RGB,
    hsv2rgb(hsva : [h: number, s: number, v: number, a: number]): RGBA,
    hsv2rgb(hsva : {h: number, s: number, v: number, a: number}): RGBA,
    hsv2rgb(        h: number, s: number, v: number, a: number) : RGBA,

    hsv2hsl(hsv  : [h: number, s: number, v: number])           : HSL,
    hsv2hsl(hsv  : {h: number, s: number, v: number})           : HSL,
    hsv2hsl(        h: number, s: number, v: number)            : HSL,
    hsv2hsl(hsva : [h: number, s: number, v: number, a: number]): HSLA,
    hsv2hsl(hsva : {h: number, s: number, v: number, a: number}): HSLA,
    hsv2hsl(        h: number, s: number, v: number, a: number) : HSLA,

    hsv2cmyk(hsv  : [h: number, s: number, v: number])           : CMYK,
    hsv2cmyk(hsv  : {h: number, s: number, v: number})           : CMYK,
    hsv2cmyk(        h: number, s: number, v: number)            : CMYK,
    hsv2cmyk(hsva : [h: number, s: number, v: number, a: number]): CMYKA,
    hsv2cmyk(hsva : {h: number, s: number, v: number, a: number}): CMYKA,
    hsv2cmyk(        h: number, s: number, v: number, a: number) : CMYKA,

    

    hsl(hsl  : [h: number, s: number, l: number])           : HSL,
    hsl(hsl  : {h: number, s: number, l: number})           : HSL,
    hsl(        h: number, s: number, l: number)            : HSL,
    hsl(hsla : [h: number, s: number, l: number, a: number]): HSLA,
    hsl(hsla : {h: number, s: number, l: number, a: number}): HSLA,
    hsl(        h: number, s: number, l: number, a: number) : HSLA,
    
    hsl2rgb(hsl  : [h: number, s: number, l: number])           : RGB,
    hsl2rgb(hsl  : {h: number, s: number, l: number})           : RGB,
    hsl2rgb(        h: number, s: number, l: number)            : RGB,
    hsl2rgb(hsla : [h: number, s: number, l: number, a: number]): RGBA,
    hsl2rgb(hsla : {h: number, s: number, l: number, a: number}): RGBA,
    hsl2rgb(        h: number, s: number, l: number, a: number) : RGBA,

    hsl2hsv(hsl  : [h: number, s: number, l: number])           : HSV,
    hsl2hsv(hsl  : {h: number, s: number, l: number})           : HSV,
    hsl2hsv(        h: number, s: number, l: number)            : HSV,
    hsl2hsv(hsla : [h: number, s: number, l: number, a: number]): HSVA,
    hsl2hsv(hsla : {h: number, s: number, l: number, a: number}): HSVA,
    hsl2hsv(        h: number, s: number, l: number, a: number) : HSVA,

    hsl2cmyk(hsl  : [h: number, s: number, l: number])           : CMYK,
    hsl2cmyk(hsl  : {h: number, s: number, l: number})           : CMYK,
    hsl2cmyk(        h: number, s: number, l: number)            : CMYK,
    hsl2cmyk(hsla : [h: number, s: number, l: number, a: number]): CMYKA,
    hsl2cmyk(hsla : {h: number, s: number, l: number, a: number}): CMYKA,
    hsl2cmyk(        h: number, s: number, l: number, a: number) : CMYKA,

    
    cmyk(cmyk  : [c: number, m: number, y: number, k: number])           : CMYK,
    cmyk(cmyk  : {c: number, m: number, y: number, k: number})           : CMYK,
    cmyk(         c: number, m: number, y: number, k: number)            : CMYK,
    cmyk(cmyka : [c: number, m: number, y: number, k: number, a: number]): CMYKA,
    cmyk(cmyka : {c: number, m: number, y: number, k: number, a: number}): CMYKA,
    cmyk(         c: number, m: number, y: number, k: number, a: number) : CMYKA,
    
    cmyk2rgb(cmyk  : [c: number, m: number, y: number, k: number])           : RGB,
    cmyk2rgb(cmyk  : {c: number, m: number, y: number, k: number})           : RGB,
    cmyk2rgb(         c: number, m: number, y: number, k: number)            : RGB,
    cmyk2rgb(cmyka : [c: number, m: number, y: number, k: number, a: number]): RGBA,
    cmyk2rgb(cmyka : {c: number, m: number, y: number, k: number, a: number}): RGBA,
    cmyk2rgb(         c: number, m: number, y: number, k: number, a: number) : RGBA,

    cmyk2hsv(cmyk  : [c: number, m: number, y: number, k: number])           : HSV,
    cmyk2hsv(cmyk  : {c: number, m: number, y: number, k: number})           : HSV,
    cmyk2hsv(         c: number, m: number, y: number, k: number)            : HSV,
    cmyk2hsv(cmyka : [c: number, m: number, y: number, k: number, a: number]): HSVA,
    cmyk2hsv(cmyka : {c: number, m: number, y: number, k: number, a: number}): HSVA,
    cmyk2hsv(         c: number, m: number, y: number, k: number, a: number) : HSVA,

    cmyk2hsl(cmyk  : [c: number, m: number, y: number, k: number])           : HSL,
    cmyk2hsl(cmyk  : {c: number, m: number, y: number, k: number})           : HSL,
    cmyk2hsl(         c: number, m: number, y: number, k: number)            : HSL,
    cmyk2hsl(cmyka : [c: number, m: number, y: number, k: number, a: number]): HSLA,
    cmyk2hsl(cmyka : {c: number, m: number, y: number, k: number, a: number}): HSLA,
    cmyk2hsl(         c: number, m: number, y: number, k: number, a: number) : HSLA,
}

const export_: Export_ = {}

// TODO: Utilize JS treeshaking optimizations. Other words, no hsv if no hsv imported, no hsl2cmyk is no hsl2cmyk imported, etc

const config = {
    rgb: {
        hsv() {
            const [r,g,b,a]=this.normalized
            const v=max(r,g,b),c=v-min(r,g,b)
            const h=c&&((v==r)?(g-b)/c:((v==g)?2+(b-r)/c:4+(r-g)/c))
            return hsv((h<0?h+6:h)/6,v&&c/v,v,a)
        },
        hsl() {
            const [r,g,b,a]=this.normalized
            const v=max(r,g,b),c=v-min(r,g,b),f=(1-abs(v+v-c-1))
            const h=c&&((v==r)?(g-b)/c:((v==g)?2+(b-r)/c:4+(r-g)/c))
            return hsl((h<0?h+6:h)/6,f?c/f:0,(v+v-c)/2,a)
        },
        cmyk() {
            const [r,g,b,a]=this.normalized
            const c=max(r,g,b)
            return cmyk(c-r,c-g,c-b,1-c,a)
        },
        css() {

        },
        normalize() {
            this.r=sat(this.r??1)
            this.g=sat(this.g??1)
            this.b=sat(this.b??1)
            if(this.a)this.a=sat(this.a)
        }
    },
    hsv: {
        rgb() { 
            const [h,s,v,a]=this.normalized
            const f=(n,k=(n+h*6)%6)=>v-v*s*max(min(k,4-k,1),0)
            return rgb(f(5),f(3),f(1), a)
        },
        hsl() { 
            const [h,s,v,a]=this.normalized
            const l=v-v*s/2,m=min(l,1-l)
            return hsl(h,m?(v-l)/m:0,l,a)
        },
        normalize() {
            this.h=(this.h??0)%1
            this.s=sat(this.s??1)
            this.v=sat(this.v??1)
            if(this.a)this.a=sat(this.a)
        }
    },
    hsl: {
        rgb() { 
            const [h,s,l,a]=this.normalized
            const g=s*min(l,1-l)
            const f=(n,k=(n+h*12)%12)=>l-g*max(min(k-3,9-k,1),-1)
            return rgb(f(0), f(8), f(4), a)
        },
        hsv() {
            const [h,s,l,a]=this.normalized
            const v=s*min(l,1-l)+l
            return hsv(h,v?2-2*l/v:0,v,a)
        },
        normalize() {
            this.h=(this.h??0)%1
            this.s=sat(this.s??1)
            this.l=sat(this.l??1)
            if(this.a)this.a=sat(this.a)
        }
    },
    cmyk: {
        rgb() { 
            const [c,m,y,k,a]=this.normalized
            return rgb((1-c)*(1-k),(1-m)*(1-k),(1-y)*(1-k),a)
        },
        normalize() {
            this.c=sat(this.c??1)
            this.m=sat(this.m??1)
            this.y=sat(this.y??1)
            this.k=sat(this.k??1)
            if(this.a)this.a=sat(this.a)
        }
    }
}
const es = Object.entries(config)
for (const [k, v] of es) {
    v.others = Object.keys(config).filter(x=>x!=k)
    const f = v.others
    const cl = ({[k]:class extends Array{
        constructor(...args){
            const isArr = args[0] instanceof Array
            let ia = (typeof args[0] == 'object' && !isArr) ? y.map(x => args[0][x]) : [...(isArr ? args[0] : args)]
            if (ia.length == y.length && ia[ia.length - 1] == undefined) ia.length -= 1
            super(...ia)
            this.normalize()
        }
        toString(){return`${k}(${this.join(', ')})`}
    }})[k]
    const y = (k+'a').split('')
    const props = {normalized:{get(){return new cl.prototype.constructor(...this)}},normalize:{value:v.normalize}}
    for (const k1 of f)props[k1]={get:v[k1]??function(){return this.rgb[k1]}}
    for (const[i, v]of y.entries())props[v]={get(){return this[i]},set(v){this[i]=v}} // Лучше это сувать не в прототип
    Object.defineProperties(cl.prototype, props)
    export_[k] = (...args) => new cl(...args)
    
}
for (const [k, v] of es) {
    const f = v.others
    const fn = export_[k]
    for (const k1 of f) export_[`${k}2${k1}`] = (...args)=> fn(...args)[k1]
}

export const {
    rgb, rgb2hsv, rgb2hsl, rgb2cmyk, hsv, hsv2rgb, hsv2hsl, hsv2cmyk, hsl, hsl2rgb, hsl2hsv, hsl2cmyk, cmyk, cmyk2rgb, cmyk2hsv, cmyk2hsl
} = export_

export default export_
