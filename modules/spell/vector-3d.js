
/**
Vector3D([x, y, z])
A lazily evaluated 3D cartesian and spherical vector object.

Cartesian: `x`, `y`, `z`
Spherical:
- `r`: radius / magnitude (`sqrt(x² + y² + z²)`)
- `a`: azimuth angle in the x-y plane (`atan2(y, x)`)
- `b`: elevation angle from the x-y plane (`atan2(z, sqrt(x² + y²))`)
**/


const { atan2, cos, sin, sqrt } = Math;
const assign = Object.assign;


export default class Vector3D {
    #x = 0;
    #y = 0;
    #z = 0;
    #a = 0;
    #b = 0;
    #r = 0;

    constructor(object) {
        assign(this, object);
    }

    // Cartesian

    get x() {
        return this.#x === undefined ?
            (this.#x = this.#r * cos(this.#b) * cos(this.#a)) :
            this.#x ;
    }

    set x(x) {
        this.y;
        this.z;
        this.#a = this.#b = this.#r = undefined;
        this.#x = x;
    }

    get y() {
        return this.#y === undefined ?
            (this.#y = this.#r * cos(this.#b) * sin(this.#a)) :
            this.#y ;
    }

    set y(y) {
        this.x;
        this.z;
        this.#a = this.#b = this.#r = undefined;
        this.#y = y;
    }

    get z() {
        return this.#z === undefined ?
            (this.#z = this.#r * sin(this.#b)) :
            this.#z ;
    }

    set z(z) {
        this.x;
        this.y;
        this.#a = this.#b = this.#r = undefined;
        this.#z = z;
    }

    // Spherical

    get r() {
        return this.#r === undefined ?
            (this.#r = sqrt(this.#x * this.#x + this.#y * this.#y + this.#z * this.#z)) :
            this.#r ;
    }

    set r(r) {
        this.a;
        this.b;
        this.#x = this.#y = this.#z = undefined;
        this.#r = r;
    }

    get a() {
        return this.#a === undefined ?
            (this.#a = atan2(this.#y, this.#x)) :
            this.#a ;
    }

    set a(a) {
        this.r;
        this.b;
        this.#x = this.#y = this.#z = undefined;
        this.#a = a;
    }

    get b() {
        return this.#b === undefined ?
            (this.#b = atan2(this.#z, sqrt(this.#x * this.#x + this.#y * this.#y))) :
            this.#b ;
    }

    set b(b) {
        this.r;
        this.a;
        this.#x = this.#y = this.#z = undefined;
        this.#b = b;
    }

    // Enable assignment from [x, y, z] array

    set [0](x) { this.x = x; }
    set [1](y) { this.y = y; }
    set [2](z) { this.z = z; }

    // JSON to array

    toJSON() {
        return [this.x, this.y, this.z];
    }

    toString() {
        return `[${ this.x }, ${ this.y }, ${ this.z }]`;
    }

    // Construct

    static of(...params) {
        return new Vector3D(params);
    }

    static from(object) {
        return new Vector3D(object);
    }
}
