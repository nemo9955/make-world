



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

    delGeo: any;

    constructor(public ptsGeo: pointGeoArr) {
        this.delGeo = geoDelaunay(ptsGeo);
        console.log("this.delGeo", this.delGeo);
    }

    getVoroLineSegsCart(pts: Float32Array): Float32Array {
        // var cen: pointGeoArr = this.delGeo.centers;
        // var edg: pointGeoArr = this.delGeo.mesh;
        var cen: pointGeoArr = this.ptsGeo;
        var edg: pointGeoArr = this.delGeo.edges;

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