



import * as d3 from "d3"
import { geoDelaunay, geoVoronoi, geoContour } from "d3-geo-voronoi"
// node_modules/d3-geo-voronoi/dist/d3-geo-voronoi.js
import { pointGeoArr, pointGeo } from "./Points"
import * as Points from "../utils/Points"
import * as dju from "../utils/dij_utils";




// import { geoVoronoi } from "../../node_modules/d3-geo-voronoi/src/voronoi.js";
// import { geoContour } from "../../node_modules/d3-geo-voronoi/src/contour.js";


// http://www.rosettacode.org/wiki/Floyd-Warshall_algorithm#JavaScript
// http://www.rosettacode.org/wiki/Dijkstra%27s_algorithm#JavaScript

// https://github.com/Fil/d3-geo-voronoi




export class d3GeoWrapper {
    rawDel: any;

    public get centers(): [number, number][] { return this.rawDel.centers }
    public get edges(): [number, number][] { return this.rawDel.edges }
    public get neighbors(): number[][] { return this.rawDel.neighbors }
    public get polygons(): number[][] { return this.rawDel.polygons }
    public get triangles(): [number, number, number][] { return this.rawDel.triangles }
    public get hull(): number[] { return this.rawDel.hull }
    public get mesh(): [number, number][] { return this.rawDel.mesh }

    public rawPts: pointGeoArr;

    constructor(ptsGeo: pointGeoArr) {
        this.rawPts = ptsGeo;
        this.rawDel = geoDelaunay(ptsGeo);
        // console.log("this.delGeo", this.rawDel);
    }


    find(x: number, y: number, next = 0) {
        return this.rawDel.find(x, y, next) as number;
    }


    getTree(seedsIndex: number[]) {
        return dju.shortestTreeCustom({
            graph: this.edges,
            origins: seedsIndex,
            directed: false,
        })
    }



}




// rellys on scripts/edit_3rd_libs.sh to exporte all the base functions of the lib
import * as cGeo from "../../node_modules/d3-geo-voronoi/dist/d3-geo-voronoi.js";

export class d3GeoLiteWrapper {
    delaunay: any;
    edges: [number, number][];
    neighbors: number[][];
    triangles: [number, number, number][];

    gfind: any;

    constructor(public points: pointGeoArr, level = 2) {
        this.delaunay = cGeo.geo_delaunay_from(points);
        this.triangles = cGeo.geo_triangles(this.delaunay);

        if (level >= 1)
            this.edges = cGeo.geo_edges(this.triangles, points);

        if (level >= 2) {
            this.neighbors = cGeo.geo_neighbors(this.triangles, points.length);
            this.gfind = cGeo.geo_find(this.neighbors, points);
        }
    }

    public find(x: number, y: number, next = 0) {
        return this.gfind(x, y, next) as number;
    }
}

import concave from "@turf/concave"
import * as turf from "@turf/helpers"
import { Position, FeatureCollection, Point, Feature, Polygon } from "@turf/helpers"

// https://github.com/joaofig/uk-accidents/blob/master/geomath/hulls.py

export function geoConcaveHull(geoPts: pointGeoArr) {
    var ptArr: Feature<Point>[] = []
    for (const iterator of geoPts) {
        ptArr.push(turf.point(iterator))
    }
    var feat = turf.featureCollection(ptArr)


    var ret = concave(feat)
    // var ret = concave(feat, { units: 'kilometers', maxEdge: 1000000})

    // return ret.geometry.coordinates[0] ;

    var indexes = []


    console.log("ret.geometry.coordinates[0]", ret.geometry.coordinates[0]);
    console.log("geoPts", geoPts);

    for (const i1 of ret.geometry.coordinates[0] as any) {
        for (let ind = 0; ind < geoPts.length; ind++) {
            const i2 = geoPts[ind];
            if (i1[0] == i2[0] && i1[1] == i2[1]) {
                indexes.push(ind);
                break;
            }
        }
    }

    return indexes;
}


