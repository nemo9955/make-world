


const EPSILON = Math.pow(2, -52);
const EDGE_STACK = new Uint32Array(512);

import { orient2d, orient3d, insphere, incircle } from 'robust-predicates';

export default class Delaunator3D {
    coords: Float64Array;
    _triangles: Uint32Array;
    _halfedges: Uint32Array;
    _hashSize: number;
    _hullPrev: Uint32Array;
    _hullNext: Uint32Array;
    _hullTri: Uint32Array;
    _ids: Uint32Array;
    _dists: Float64Array;
    hull: Uint32Array;
    triangles: Uint32Array;
    halfedges: Uint32Array;
    _cx: number;
    _cy: number;
    _cz: number;
    _hullStart: number;
    trianglesLen: number;

    _hullHash: Map<String, number>; /// HASSSSH
    // _hullHash: Int32Array;

    static from(points: [number, number][], getX = defaultGetX, getY = defaultGetY, getZ = defaultGetZ) {
        const n = points.length;
        const coords = new Float64Array(n * 3);

        for (let i = 0; i < n; i++) {
            const p = points[i];
            coords[3 * i + 0] = getX(p);
            coords[3 * i + 1] = getY(p);
            coords[3 * i + 2] = getZ(p);
        }

        return new Delaunator3D(coords);
    }

    constructor(coords: Float64Array, options = {}) {
        const n = coords.length / 3; // divides by 3 now
        if (n > 0 && typeof coords[0] !== 'number') throw new Error('Expected coords to contain numbers.');

        this.coords = coords;

        // arrays that will store the triangulation graph
        const maxTriangles = Math.max(3 * n - 5, 0); // TODO was 2 originally
        this._triangles = new Uint32Array(maxTriangles * 3);
        this._halfedges = new Uint32Array(maxTriangles * 3);

        // temporary arrays for tracking the edges of the advancing convex hull
        this._hashSize = Math.ceil(Math.sqrt(n));
        this._hullPrev = new Uint32Array(n); // edge to prev edge
        this._hullNext = new Uint32Array(n); // edge to next edge
        this._hullTri = new Uint32Array(n); // edge to adjacent triangle

        this._hullHash = new Map<String, number>();/// HASSSSH
        // this._hullHash = new Int32Array(this._hashSize).fill(-1); // angular edge hash

        // temporary arrays for sorting points
        this._ids = new Uint32Array(n);
        this._dists = new Float64Array(n);

        this.update(options);
    }

    update(options: any) {
        console.time(`#time delaunator_3d update`);
        const { coords, _hullPrev: hullPrev, _hullNext: hullNext, _hullTri: hullTri, _hullHash: hullHash } = this;
        const n = coords.length / 3;// divides by 3 now

        console.log("n", n);

        // populate an array of point indices; calculate input data bbox
        let minX = Infinity;
        let minY = Infinity;
        let minZ = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let maxZ = -Infinity;

        for (let i = 0; i < n; i++) {
            const x = coords[3 * i + 0];
            const y = coords[3 * i + 1];
            const z = coords[3 * i + 3];
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (z < minZ) minZ = z;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
            if (z > maxZ) maxZ = z;
            this._ids[i] = i;
        }
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const cz = (minZ + maxZ) / 2;

        console.log({ cx, cy, cz });

        let minDist = Infinity;
        let i0, i1, i2;

        console.log({ i0, i1, i2 });


        if (isFinite(options?.seedPointIndex)) {
            console.log("options.seedPointIndex", options.seedPointIndex);
            i0 = options.seedPointIndex;
        } else {
            // pick a seed point close to the center
            for (let i = 0; i < n; i++) {
                const d = distSq(cx, cy, cz, coords[3 * i + 0], coords[3 * i + 1], coords[3 * i + 2]);
                if (d < minDist) {
                    i0 = i;
                    minDist = d;
                }
            }
        }


        const i0x = coords[3 * i0];
        const i0y = coords[3 * i0 + 1];
        const i0z = coords[3 * i0 + 2];

        console.log({ i0x, i0y, i0z });
        console.log({ i0, i1, i2 });
        minDist = Infinity;

        // find the point closest to the seed
        for (let i = 0; i < n; i++) {
            if (i === i0) continue;
            const d = distSq(i0x, i0y, i0z, coords[3 * i + 0], coords[3 * i + 1], coords[3 * i + 2]);
            if (d < minDist && d > 0) {
                i1 = i;
                minDist = d;
            }
        }
        let i1x = coords[3 * i1 + 0];
        let i1y = coords[3 * i1 + 1];
        let i1z = coords[3 * i1 + 2];

        let minRadius = Infinity;
        console.log({ i1x, i1y, i1z });
        console.log({ i0, i1, i2 });

        // find the third point which forms the smallest circumcircle with the first two
        for (let i = 0; i < n; i++) {
            if (i === i0 || i === i1) continue;
            const r = circumradius(i0x, i0y, i0z, i1x, i1y, i1z, coords[3 * i + 0], coords[3 * i + 1], coords[3 * i + 2]);
            // console.log("r", r);
            if (r < minRadius) {
                i2 = i;
                minRadius = r;
            }
        }
        let i2x = coords[3 * i2 + 0];
        let i2y = coords[3 * i2 + 1];
        let i2z = coords[3 * i2 + 2];

        console.log({ i2x, i2y, i2z });
        console.log({ i0, i1, i2 });


        console.log("minRadius", minRadius);

        if (minRadius === Infinity) {
            // order collinear points by dx (or dy if all x are identical)
            // and return the list as a hull
            for (let i = 0; i < n; i++) {
                this._dists[i] = (coords[3 * i + 0] - coords[0])
                    || (coords[3 * i + 1] - coords[1])
                    || (coords[3 * i + 2] - coords[2]);
            }
            quicksort(this._ids, this._dists, 0, n - 1);
            const hull = new Uint32Array(n);
            let j = 0;
            for (let i = 0, d0 = -Infinity; i < n; i++) {
                const id = this._ids[i];
                if (this._dists[id] > d0) {
                    hull[j++] = id;
                    d0 = this._dists[id];
                }
            }
            this.hull = hull.subarray(0, j);
            this.triangles = new Uint32Array(0);
            this.halfedges = new Uint32Array(0);
            return;
        }

        console.log("this._ids", this._ids);
        console.log("this._dists", this._dists);

        // swap the order of the seed points for counter-clockwise orientation
        if (orient3d(i0x, i0y, i0z, i1x, i1y, i1z, i2x, i2y, i2z, 0, 0, 0) < 0) { // TODO should works if points are around 0,0,0 ?????
            const i = i1;
            const x = i1x;
            const y = i1y;
            const z = i1z;
            i1 = i2;
            i1x = i2x;
            i1y = i2y;
            i1z = i2z;
            i2 = i;
            i2x = x;
            i2y = y;
            i2z = z;
        }

        const center = circumcenter(i0x, i0y, i0z, i1x, i1y, i1z, i2x, i2y, i2z);
        this._cx = center.x;
        this._cy = center.y;
        this._cz = center.z;
        console.log("center", center);

        for (let i = 0; i < n; i++) {
            this._dists[i] = dist(coords[3 * i + 0], coords[3 * i + 1], coords[3 * i + 2], center.x, center.y, center.z);
            // TODO set to real dist for debugg
        }

        // sort the points by distance from the seed triangle circumcenter
        quicksort(this._ids, this._dists, 0, n - 1);

        console.log("this._ids", this._ids);
        console.log("this._dists", this._dists);

        // set up the seed triangle as the starting hull
        this._hullStart = i0;
        let hullSize = 3;

        hullNext[i0] = hullPrev[i2] = i1;
        hullNext[i1] = hullPrev[i0] = i2;
        hullNext[i2] = hullPrev[i1] = i0;

        hullTri[i0] = 0;
        hullTri[i1] = 1;
        hullTri[i2] = 2;

        // hullHash.fill(-1);/// HASSSSH
        hullHash[this._hashKey(i0x, i0y, i0z)] = i0;
        hullHash[this._hashKey(i1x, i1y, i1z)] = i1;
        hullHash[this._hashKey(i2x, i2y, i2z)] = i2;

        this.trianglesLen = 0;
        this._addTriangle(i0, i1, i2, -1, -1, -1);

        for (let k = 0, xp, yp, zp; k < this._ids.length; k++) {
            const i = this._ids[k];
            const x = coords[3 * i + 0];
            const y = coords[3 * i + 1];
            const z = coords[3 * i + 2];

            // skip near-duplicate points
            if (k > 0 && Math.abs(x - xp) <= EPSILON && Math.abs(y - yp) <= EPSILON && Math.abs(z - zp) <= EPSILON) continue;
            xp = x;
            yp = y;
            zp = z;

            // skip seed triangle points
            if (i === i0 || i === i1 || i === i2) continue;

            // find a visible edge on the convex hull using edge hash
            // let start = 0;
            // for (let j = 0, key = this._hashKey(x, y, z); j < this._hashSize; j++) {
            //     start = hullHash[(key + j) % this._hashSize];
            //     if (isFinite(start) && start !== -1 && start !== hullNext[start])
            //         break;/// HASSSSH
            // }

            // find a visible edge on the convex hull using edge hash
            let start = 0;
            for (const iterator of hullHash.values()) {
                start = iterator;
                if (isFinite(start) && start !== -1 && start !== hullNext[start])
                    break;/// HASSSSH
            }


            start = hullPrev[start];
            let e = start, q;
            while (q = hullNext[e], orient3d(
                x, y, z,
                coords[3 * e + 0], coords[3 * e + 1], coords[3 * e + 2],
                coords[3 * q + 0], coords[3 * q + 1], coords[3 * q + 2],
                0, 0, 0) >= 0) {
                e = q;
                if (e === start) {
                    e = -1;
                    break;
                }
            }
            if (e === -1) continue; // likely a near-duplicate point; skip it

            // add the first triangle from the point
            let t = this._addTriangle(e, i, hullNext[e], -1, -1, hullTri[e]);

            // recursively flip triangles from the point until they satisfy the Delaunay condition
            hullTri[i] = this._legalize(t + 2);
            hullTri[e] = t; // keep track of boundary triangles on the hull
            hullSize++;

            // walk forward through the hull, adding more triangles and flipping recursively
            let n = hullNext[e];
            while (q = hullNext[n], orient3d(
                x, y, z,
                coords[3 * n + 0], coords[3 * n + 1], coords[3 * n + 2],
                coords[3 * q + 0], coords[3 * q + 1], coords[3 * q + 2],
                0, 0, 0) < 0) {
                t = this._addTriangle(n, i, q, hullTri[i], -1, hullTri[n]);
                hullTri[i] = this._legalize(t + 2);
                hullNext[n] = n; // mark as removed
                hullSize--;
                n = q;
            }

            // walk backward from the other side, adding more triangles and flipping
            if (e === start) {
                while (q = hullPrev[e], orient2d(x, y, coords[3 * q + 0], coords[3 * q + 1], coords[3 * e + 0], coords[3 * e + 1]) < 0) {
                    t = this._addTriangle(q, i, e, -1, hullTri[e], hullTri[q]);
                    this._legalize(t + 2);
                    hullTri[q] = t;
                    hullNext[e] = e; // mark as removed
                    hullSize--;
                    e = q;
                }
            }

            // update the hull indices
            this._hullStart = hullPrev[i] = e;
            hullNext[e] = hullPrev[n] = i;
            hullNext[i] = n;

            // save the two new edges in the hash table
            hullHash[this._hashKey(x, y, z)] = i;
            hullHash[this._hashKey(coords[3 * e + 0], coords[3 * e + 1], coords[3 * e + 2])] = e;
        }

        this.hull = new Uint32Array(hullSize);
        for (let i = 0, e = this._hullStart; i < hullSize; i++) {
            this.hull[i] = e;
            e = hullNext[e];
        }

        // trim typed triangle mesh arrays
        this.triangles = this._triangles.subarray(0, this.trianglesLen);
        this.halfedges = this._halfedges.subarray(0, this.trianglesLen);
        console.timeEnd(`#time delaunator_3d update`);
    }


    _legalize(a) {
        const { _triangles: triangles, _halfedges: halfedges, coords } = this;

        let i = 0;
        let ar = 0;

        var emgExit = 0;

        // recursion eliminated with a fixed-size stack
        while (true) {

            if (emgExit++ > 1000) {
                console.warn("NOPE");
                return;
            }


            const b = halfedges[a];

            /* if the pair of triangles doesn't satisfy the Delaunay condition
             * (p1 is inside the circumcircle of [p0, pl, pr]), flip them,
             * then do the same check/flip recursively for the new pair of triangles
             *
             *           pl                    pl
             *          /||\                  /  \
             *       al/ || \bl            al/    \a
             *        /  ||  \              /      \
             *       /  a||b  \    flip    /___ar___\
             *     p0\   ||   /p1   =>   p0\---bl---/p1
             *        \  ||  /              \      /
             *       ar\ || /br             b\    /br
             *          \||/                  \  /
             *           pr                    pr
             */
            const a0 = a - a % 3;
            ar = a0 + (a + 2) % 3;

            if (b === -1 || isNaN(b)) { // convex hull edge
                if (i === 0) break;
                a = EDGE_STACK[--i];
                continue;
            }

            const b0 = b - b % 3;
            const al = a0 + (a + 1) % 3;
            const bl = b0 + (b + 2) % 3;

            const p0 = triangles[ar];
            const pr = triangles[a];
            const pl = triangles[al];
            const p1 = triangles[bl];


            // ///// orient the sphere to 0,0,0
            // const tmpCen = circumcenter(
            //     coords[3 * p0 + 0], coords[3 * p0 + 1], coords[3 * p0 + 2],
            //     coords[3 * pr + 0], coords[3 * pr + 1], coords[3 * pr + 2],
            //     coords[3 * pl + 0], coords[3 * pl + 1], coords[3 * pl + 2]
            // );
            // const tmpRad = circumradius(
            //     coords[3 * p0 + 0], coords[3 * p0 + 1], coords[3 * p0 + 2],
            //     coords[3 * pr + 0], coords[3 * pr + 1], coords[3 * pr + 2],
            //     coords[3 * pl + 0], coords[3 * pl + 1], coords[3 * pl + 2]
            // );
            // const tmpDist = dist(tmpCen.x, tmpCen.y, tmpCen.z, 0, 0, 0)
            // const tmpNewDist = tmpDist - tmpRad;
            // const tmpNewCenx = tmpCen.x / tmpNewDist * tmpNewDist;
            // const tmpNewCeny = tmpCen.y / tmpNewDist * tmpNewDist;
            // const tmpNewCenz = tmpCen.z / tmpNewDist * tmpNewDist;
            // const illegal = insphere(
            //     coords[3 * p0 + 0], coords[3 * p0 + 1], coords[3 * p0 + 2],
            //     coords[3 * pr + 0], coords[3 * pr + 1], coords[3 * pr + 2],
            //     coords[3 * pl + 0], coords[3 * pl + 1], coords[3 * pl + 2],
            //     tmpNewCenx, tmpNewCeny, tmpNewCenz,
            //     coords[3 * p1 + 0], coords[3 * p1 + 1], coords[3 * p1 + 2],
            // );



            const illegal = inCircle(
                coords[3 * p0 + 0], coords[3 * p0 + 1], coords[3 * p0 + 2],
                coords[3 * pr + 0], coords[3 * pr + 1], coords[3 * pr + 2],
                coords[3 * pl + 0], coords[3 * pl + 1], coords[3 * pl + 2],
                coords[3 * p1 + 0], coords[3 * p1 + 1], coords[3 * p1 + 2],
            );

            if (illegal) {
                triangles[a] = p1;
                triangles[b] = p0;

                const hbl = halfedges[bl];

                // edge swapped on the other side of the hull (rare); fix the halfedge reference
                if (hbl === -1 || isNaN(hbl)) {
                    let e = this._hullStart;
                    do {
                        if (this._hullTri[e] === bl) {
                            this._hullTri[e] = a;
                            break;
                        }
                        e = this._hullPrev[e];
                    } while (e !== this._hullStart);
                }

                console.log("hbl, halfedges[ar], bl", hbl, halfedges[ar], bl)

                this._link(a, hbl);
                this._link(b, halfedges[ar]);
                this._link(ar, bl);

                const br = b0 + (b + 1) % 3;

                // don't worry about hitting the cap: it can only happen on extremely degenerate input
                if (i < EDGE_STACK.length) {
                    EDGE_STACK[i++] = br;
                }
            } else {
                if (i === 0) break;
                a = EDGE_STACK[--i];
            }
        }

        return ar;
    }

    _link(a, b) {
        if (b == 4294967295) b = - 1;
        if (b > 99999) console.warn(a, b)
        this._halfedges[a] = b;
        if (isFinite(b) && b !== -1) this._halfedges[b] = a;
    }

    // add a new triangle given vertex indices and adjacent half-edge ids
    _addTriangle(i0, i1, i2, a, b, c) {
        const t = this.trianglesLen;

        this._triangles[t] = i0;
        this._triangles[t + 1] = i1;
        this._triangles[t + 2] = i2;

        console.log("a, b, c", a, b, c)

        this._link(t, a);
        this._link(t + 1, b);
        this._link(t + 2, c);

        this.trianglesLen += 3;

        return t;
    }


    _hashKey(x, y, z) { /// HASSSSH
        return `${x},${y},${z}`;
        // return Math.floor(pseudoAngle(x - this._cx, y - this._cy, z - this._cz) * this._hashSize) % this._hashSize;
    }
}


// no idea what this is about
function pseudoAngle(dx, dy, dz) { /// HASSSSH
    const p = (dx + Math.abs(dz)) / (Math.abs(dx) + Math.abs(dy) + Math.abs(dz));
    return (dy > 0 ? 3 - p : 1 + p) / 4; // [0..1]
}

function distSq(ax, ay, az, bx, by, bz) { /// distance 2 3d point, SQUARED !!!
    const dx = ax - bx;
    const dy = ay - by;
    const dz = az - bz;
    return dx * dx + dy * dy + dz * dz;
}

function dist(ax, ay, az, bx, by, bz) { /// distance 2 3d point, SQUARED !!!
    const dx = ax - bx;
    const dy = ay - by;
    const dz = az - bz;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}


function inCircle(ax, ay, az, bx, by, bz, cx, cy, cz, px, py, pz) {
    // just throw "money" at the issue
    const tmpCen = circumcenter(ax, ay, az, bx, by, bz, cx, cy, cz);
    const tmpRad = circumradius(ax, ay, az, bx, by, bz, cx, cy, cz);
    const tmpDist = dist(tmpCen.x, tmpCen.y, tmpCen.z, px, py, pz)
    return (tmpRad > tmpDist)
}


function inCircle1(ax, ay, az, bx, by, bz, cx, cy, cz, px, py, pz) {
    const dx = ax - px;
    const dy = ay - py;
    const dz = az - pz;
    const ex = bx - px;
    const ey = by - py;
    const ez = bz - pz;
    const fx = cx - px;
    const fy = cy - py;
    const fz = cz - pz;

    const ap = dx * dx + dy * dy + dz * dz;
    const bp = ex * ex + ey * ey + ez * ez;
    const cp = fx * fx + fy * fy + fz * fz;

    return dx * (ey * cp - bp * fy) -
        dy * (ex * cp - bp * fx) +
        ap * (ex * fy - ey * fx) < 0;
}


function circumradius2(ax, ay, az, bx, by, bz, cx, cy, cz) {
    // // https://www.physicsforums.com/threads/equation-of-a-circle-through-3-points-in-3d-space.173847/post-1420798
    const a = dist(ax, ay, az, bx, by, bz);
    const b = dist(ax, ay, az, cx, cy, cz);
    const c = dist(bx, by, bz, cx, cy, cz);
    // console.log({ a, b, c });

    const a2 = a * a;
    const b2 = b * b;
    const c2 = c * c;
    const p = a * b * c;
    const s = Math.sqrt((2 * a2 * b2) + (2 * b2 * c2) + (2 * c2 * a2) - a2 * a2 - b2 * b2 - c2 * c2);
    const r = Math.abs(p / s);
    // console.log({ p, s, r });
    return r;
}


function circumradius(ax, ay, az, bx, by, bz, cx, cy, cz) {
    // https://mathworld.wolfram.com/Circumradius.html
    const a = dist(ax, ay, az, bx, by, bz);
    const b = dist(ax, ay, az, cx, cy, cz);
    const c = dist(bx, by, bz, cx, cy, cz);
    const p = a * b * c;
    const s = Math.sqrt((a + b + c) * (b + c - a) * (c + a - b) * (a + b - c));
    const r = Math.abs(p / s);
    return r;
}

// console.log("dist", dist(0, 0, 0, 1, 1, 0))
// console.log("circumradius", circumradius(0, 0, 0, 1, 1, 0, 1, -1, 0))
// console.log("circumradius2", circumradius2(0, 0, 0, 1, 1, 0, 1, -1, 0))


// console.log("3d circumradius 000 010 100", circumradius(0, 0, 0, 0, 1, 0, 1, 0, 0));
// console.log("3d circumcenter 000 010 100", circumcenter(0, 0, 0, 0, 1, 0, 1, 0, 0));

// console.log("3d circumradius 000 010 900", circumradius(0, 0, 0, 0, 1, 0, 9, 0, 0));
// console.log("3d circumcenter 000 010 900", circumcenter(0, 0, 0, 0, 1, 0, 9, 0, 0));


function circumcenter(ax, ay, az, bx, by, bz, cx, cy, cz) {
    // fails horibly .......
    // https://www.ics.uci.edu/~eppstein/junkyard/circumcenter.html

    /* Use coordinates relative to point `a' of the triangle. */
    const xba = bx - ax;
    const yba = by - ay;
    const zba = bz - az;
    const xca = cx - ax;
    const yca = cy - ay;
    const zca = cz - az;
    /* Squares of lengths of the edges incident to `a'. */
    const balength = xba * xba + yba * yba + zba * zba;
    const calength = xca * xca + yca * yca + zca * zca;



    /* Cross product of these edges. */
    /* Use orient2d() from http://www.cs.cmu.edu/~quake/robust.html     */
    /*   to ensure a correctly signed (and reasonably accurate) result, */
    /*   avoiding any possibility of division by zero.                  */
    // const xcrossbc = orient2d(by, bz, cy, cz, ay, az);
    // const ycrossbc = orient2d(bz, bx, cz, cx, az, ax);
    // const zcrossbc = orient2d(bx, by, cx, cy, ax, ay);

    /* Take your chances with floating-point roundoff. */
    const xcrossbc = yba * zca - yca * zba;
    const ycrossbc = zba * xca - zca * xba;
    const zcrossbc = xba * yca - xca * yba;



    /* Calculate the denominator of the formulae. */
    const denominator = 0.5 / (xcrossbc * xcrossbc + ycrossbc * ycrossbc +
        zcrossbc * zcrossbc);

    /* Calculate offset (from `a') of circumcenter. */
    const x = ((balength * yca - calength * yba) * zcrossbc -
        (balength * zca - calength * zba) * ycrossbc) * denominator;

    const y = ((balength * zca - calength * zba) * xcrossbc -
        (balength * xca - calength * xba) * zcrossbc) * denominator;

    const z = ((balength * xca - calength * xba) * ycrossbc -
        (balength * yca - calength * yba) * xcrossbc) * denominator;

    return { x, y, z };
}

// console.log("circumcenter", circumcenter(0, 0, 0, 1, 1, 0, 1, 0, 0))
// console.log("circumcenter", circumcenter(0, 0, 0, 1, 1, 0, 1, -1, 0))


function quicksort(ids, dists, left, right) {
    if (right - left <= 20) {
        for (let i = left + 1; i <= right; i++) {
            const temp = ids[i];
            const tempDist = dists[temp];
            let j = i - 1;
            while (j >= left && dists[ids[j]] > tempDist) ids[j + 1] = ids[j--];
            ids[j + 1] = temp;
        }
    } else {
        const median = (left + right) >> 1;
        let i = left + 1;
        let j = right;
        swap(ids, median, i);
        if (dists[ids[left]] > dists[ids[right]]) swap(ids, left, right);
        if (dists[ids[i]] > dists[ids[right]]) swap(ids, i, right);
        if (dists[ids[left]] > dists[ids[i]]) swap(ids, left, i);

        const temp = ids[i];
        const tempDist = dists[temp];
        while (true) {
            do i++; while (dists[ids[i]] < tempDist);
            do j--; while (dists[ids[j]] > tempDist);
            if (j < i) break;
            swap(ids, i, j);
        }
        ids[left + 1] = ids[j];
        ids[j] = temp;

        if (right - i + 1 >= j - left) {
            quicksort(ids, dists, i, right);
            quicksort(ids, dists, left, j - 1);
        } else {
            quicksort(ids, dists, left, j - 1);
            quicksort(ids, dists, i, right);
        }
    }
}

function swap(arr, i, j) {
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
}

function defaultGetX(p) {
    return p[0];
}
function defaultGetY(p) {
    return p[1];
}
function defaultGetZ(p) {
    return p[2];
}