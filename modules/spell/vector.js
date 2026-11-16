
/**
Vector([x, y])
A lazily evaluated simultaneously cartesian and polar vector. When operations
are made in one mode values cached in the other mode are trashed and only
evaluated again when needed. Some might say this borders on over-engineering.
**/


const { abs, atan2, cos, round, sin, sqrt, PI } = Math;
const assign = Object.assign;
const tau = 2 * PI;


export default class Vector {
    #x = 0;
    #y = 0;
    #a = 0;
    #r = 0;

    constructor(object) {
        assign(this, object);
    }

    // Cartesian

    get x()  {
        return this.#x === undefined ?
            (this.#x = this.#r * cos(this.#a)) :
            this.#x ;
    }

    set x(x) {
        this.y;
        this.#a = this.#r = undefined;
        this.#x = x;
    }

    get y() {
        return this.#y === undefined ?
            (this.#y = this.#r * sin(this.#a)) :
            this.#y ;
    }

    set y(y) {
        this.x;
        this.#a = this.#r = undefined;
        this.#y = y;
    }

    // Polar

    get r() {
        return this.#r === undefined ?
            (this.#r = sqrt(this.#y * this.#y + this.#x * this.#x)) :
            this.#r ;
    }

    set r(r) {
        this.a;
        this.#x = this.#y = undefined;
        this.#r = abs(r);
    }

    get a()  {
        return this.#a === undefined ?
            (this.#a = atan2(this.#y, this.#x)) :
            this.#a ;
    }

    set a(a) {
        this.r;
        this.#x = this.#y = undefined;
        // Make sure new angle stays in range [-π, π]
        this.#a = a - tau * round(a / tau);
    }

    // Enable assignment to and reading from [x, y]

    get [0]()  { return this.x; }
    set [0](x) { this.x = x; }
    get [1]()  { return this.y; }
    set [1](y) { this.y = y; }

    // Operations

    // This is so simple to do in user space I'm not sure we need methods for it
    /*
    add(vector) {
        // Fast out
        if (!vector[0] && !vector[1]) return this;
        // Evaluate x, y
        const { x, y } = this;
        // Trash r, a
        this.#r = this.#a = undefined;
        // Mutate vector
        this.#x = x + vector[0];
        this.#y = y + vector[1];
        // Return vector
        return this;
    }

    multiply(scalar) {
        // Fast out
        if (scalar === 1) return this;
        // Evaluate x, y
        const { x, y } = this;
        // Trash r, a
        this.#r = this.#a = undefined;
        // Mutate vector
        this.#x = scalar * x;
        this.#y = scalar * y;
        // Return vector
        return this;
    }
    */

    // JSON to array

    toJSON() {
        return [this.x, this.y];
    }

    toString() {
        return `[${ this.x }, ${ this.y }]`;
    }

    // Construct

    static of(...params) {
        return new Vector(params);
    }

    static from(object) {
        return new Vector(object);
    }
}
