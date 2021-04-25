



import * as d3 from "d3"
import { geoDelaunay, geoVoronoi, geoContour } from "d3-geo-voronoi"
// node_modules/d3-geo-voronoi/dist/d3-geo-voronoi.js
import { pointGeoArr, pointGeo } from "./Points"
import * as Points from "../utils/Points"




// http://www.rosettacode.org/wiki/Floyd-Warshall_algorithm#JavaScript
// http://www.rosettacode.org/wiki/Dijkstra%27s_algorithm#JavaScript

// https://github.com/Fil/d3-geo-voronoi




export class Graph {



    constructor() {
    }

    mkUndirGeo(ptsGeo: pointGeoArr) {
        console.log("ptsGeo", ptsGeo);
        var delGeo = geoDelaunay(ptsGeo);
        console.log("delGeo", delGeo);
    }

}


export class d3GeoWrapper {
    rawDel: any;

    // centers: (9996) [Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), …]
    // delaunay: Delaunay {_delaunator: Delaunator, inedges: Int32Array(5003), _hullIndex: Int32Array(5003), points: Float64Array(10006), halfedges: Int32Array(30000), …}
    // edges: (14994) [Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), …]
    // find: ƒ find(x, y, next)
    // hull: []
    // mesh: (14994) [Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), …]
    // neighbors: (5000) [Array(5), Array(5), Array(6), Array(7), Array(7), Array(7), Array(6), Array(5), Array(5), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(7), Array(7), Array(7), Array(6), Array(6), Array(6), Array(6), Array(6), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(6), Array(6), Array(6), Array(7), Array(7), Array(7), Array(7), Array(7), Array(7), Array(7), Array(7), Array(7), Array(7), Array(7), Array(7), Array(7), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), …]
    // polygons: (5000) [Array(5), Array(5), Array(6), Array(7), Array(7), Array(7), Array(6), Array(5), Array(5), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(7), Array(7), Array(7), Array(6), Array(6), Array(6), Array(6), Array(6), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(6), Array(6), Array(6), Array(7), Array(7), Array(7), Array(7), Array(7), Array(7), Array(7), Array(7), Array(7), Array(7), Array(7), Array(7), Array(7), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), Array(6), …]
    // triangles: (9996) [Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), …]
    // urquhart: ƒ (distances)
    // __proto__: Object

    public get centers(): [number, number][] { return this.rawDel.centers }
    public get edges(): [number, number][] { return this.rawDel.edges }
    public get neighbors(): number[][] { return this.rawDel.neighbors }
    public get polygons(): number[][] { return this.rawDel.polygons }
    public get triangles(): [number, number, number][] { return this.rawDel.triangles }

    constructor(public ptsGeo: pointGeoArr) {
        this.rawDel = geoDelaunay(ptsGeo);
        console.log("this.delGeo", this.rawDel);
    }

    find(x: number, y: number, next = 0) {
        return this.rawDel.find(x, y, next) as number;
    }


    getVoroLineSegsCart(pts: Float32Array): Float32Array {
        // var cen: pointGeoArr = this.delGeo.centers;
        // var edg: pointGeoArr = this.delGeo.mesh;
        var cen: pointGeoArr = this.ptsGeo;
        var edg: pointGeoArr = this.rawDel.edges;

        var arrSize = edg.length * 2 * 3;
        var lineSegs = new Float32Array(arrSize);
        var lsPos = 0;

        for (let index = 0; index < edg.length; index++) {
            const c1: number = edg[index][0];
            const c2: number = edg[index][1];


            // console.log("c1,c2", c1, c2);

            // const p1 = Points.cartesianRadius(cen[c1], radius)
            // const p2 = Points.cartesianRadius(cen[c2], radius)

            // console.log("cen[c1],cen[c2]", cen[c1], cen[c2]);
            // console.log("p1,p2", p1, p2);

            lineSegs[lsPos++] = pts[c1 * 3 + 0];
            lineSegs[lsPos++] = pts[c1 * 3 + 1];
            lineSegs[lsPos++] = pts[c1 * 3 + 2];
            lineSegs[lsPos++] = pts[c2 * 3 + 0];
            lineSegs[lsPos++] = pts[c2 * 3 + 1];
            lineSegs[lsPos++] = pts[c2 * 3 + 2];
            // lineSegs[lsPos++] = p1[0];
            // lineSegs[lsPos++] = p1[1];
            // lineSegs[lsPos++] = p1[2];
            // lineSegs[lsPos++] = p2[0];
            // lineSegs[lsPos++] = p2[1];
            // lineSegs[lsPos++] = p2[2];
        }

        // console.log("lineSegs", lineSegs);
        return lineSegs;
    }


}