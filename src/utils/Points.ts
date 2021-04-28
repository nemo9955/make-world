
import * as d3 from "d3";


export type latitude = number
export type longitude = number
export type pointGeo = [latitude, longitude]
export type pointGeoArr = pointGeo[]
export type arr3numb = [number, number, number];





export function removeDupPts(points_: pointGeoArr) {
    points_.sort((a, b) => a[1] - b[1])
    points_.sort((a, b) => a[0] - b[0])

    for (let index = 0; index < points_.length; index++) {
        const pt_ = points_[index]

        // points_.forEach(function (pt_, i, points_) {
        if (index + 1 >= points_.length) continue;
        var pt2_ = points_[index + 1]

        if (pt_[0] === pt2_[0] && pt_[1] === pt2_[1]) {
            console.log("Removing ", pt2_, " == ", pt_, " >>>", points_[index + 1])
            var len1 = points_.length
            var rmmm = points_.splice(index + 1, 1)
            var len2 = points_.length
            index--
            // console.log("dup", len1, len2, pt_, pt2_, "rmmm",rmmm.toLocaleString())
        }
    }
    // console.log("sites", sites.length ,sites.toLocaleString())
    return points_
}



export function makeGeoPtsFibb(number: number): pointGeoArr {
    var phi = (1 + Math.sqrt(5)) / 2
    return Array.from({ length: number }, (_, i) => [
        i / phi * 360 % 360,
        Math.acos(2 * i / number - 1) / Math.PI * 180 - 90
    ])
}

export function makeGeoPtsRandOk(number: number): pointGeoArr {
    const degrees = 180 / Math.PI
    return Array.from({ length: number }, (d) => { return [Math.random() * 360, Math.acos(2 * Math.random() - 1) * degrees - 90]; });
}


export function splitSquare(splits: number): [number, number][] {
    var arr: [number, number][] = []
    var incr = 1 / (splits + 1);
    for (var i = incr / 2; i < 1; i += incr) {
        for (var j = incr / 2; j < 1; j += incr) {
            // console.log("i,j", i, j);
            arr.push([i, j])
        }
    }
    return arr;
}



export function getGeoSquareArr(minLat, maxLat, minLon, maxLon, ofsetArr: pointGeoArr): pointGeoArr {
    // console.log("minLat, maxLat, minLon, maxLon", minLat, maxLat, minLon, maxLon);
    // console.log("ofsetArr", ofsetArr);

    var arr: pointGeoArr = [];
    for (const pt of ofsetArr) {
        var clat = minLat + ((maxLat - minLat) * pt[0])
        var clon = minLon + ((maxLon - minLon) * pt[1])
        arr.push([clat, clon])
    }

    return arr;
}

/*
https://www.redblobgames.com/x/1932-sphere-healpix/
Possible workaround for fluid simulation needing a grid
TODO Point should be "perfectly" in a grridd position, they just need to be linked
*/
export function makeGeoPtsSquares(splits: number): pointGeoArr {
    var arr: pointGeoArr = []


    var splitArr = splitSquare(splits);

    for (var i = 0 + 45; i < 360; i += 360 / 4) {
        // arr.push([i, 45])
        var part = getGeoSquareArr(i - (360 / 8), i + (360 / 8), 0, 90, splitArr)
        arr.push(...part)
    }

    for (var i = 0; i < 360; i += 360 / 4) {
        // arr.push([i, 0])
        var part = getGeoSquareArr(i - (360 / 8), i + (360 / 8), -45, 45, splitArr)
        arr.push(...part)
    }

    for (var i = 0 + 45; i < 360; i += 360 / 4) {
        // arr.push([i, -45])
        var part = getGeoSquareArr(i - (360 / 8), i + (360 / 8), -90, 0, splitArr)
        arr.push(...part)
    }

    return arr
}



// https://observablehq.com/@kemper/voronoi-polygon-smoothing
// https://observablehq.com/@mbostock/poisson-disc-distribution
// https://www.jasondavies.com/poisson-disc/
export function makeGeoPoissonDiscSample(cells_count: number): pointGeoArr {
    const radius = Math.sqrt((0.43 * (180 * 2 * 90 * 2)) / cells_count); // TODO 0.43 seems OK on a sphere
    var rng = Math.random
    const width = 360
    const height = 2 * 90
    const points = [],
        max = (3 * (width * height)) / (radius * radius),
        sampleSites = sampler(width, height, radius);

    for (var i = 0; i < max; ++i) {
        let s = sampleSites();
        if (s) points.push(s);
    }
    return points;

    function sampler(width, height, radius) {
        var k = 40, // maximum number of samples before rejection
            radius2 = radius * radius,
            R = 3 * radius2,
            cellSize = radius * Math.SQRT1_2,
            gridWidth = Math.ceil(width / cellSize),
            gridHeight = Math.ceil(height / cellSize),
            grid = new Array(gridWidth * gridHeight),
            queue = [],
            edge_points__ = [],
            queueSize = 0,
            sampleSize = 0;

        // console.log("cellSize", cellSize);
        // console.log("gridWidth", gridWidth);
        // console.log("gridHeight", gridHeight);
        // console.log("radius", radius);
        // console.log("radius2", radius2);

        return function () {
            if (!sampleSize) return sample(rng() * width, rng() * (height / 2));
            // if (!sampleSize) return sample(1, 1);

            // Pick a random existing sample and remove it from the queue.
            while (queueSize) {
                var i = (rng() * queueSize) | 0,
                    s = queue[i];

                // Make a new candidate between [radius, 2 * radius] from the existing sample.
                for (var j = 0; j < k; ++j) {
                    var a = 2 * Math.PI * rng(),
                        r = Math.sqrt(rng() * R + radius2),
                        x = s[0] + r * Math.cos(a),
                        y = s[1] + r * Math.sin(a);

                    // Reject candidates that are outside the allowed extent,
                    // or closer than 2 * radius to any existing sample.
                    if (0 <= x && x < width && -(height / 2) <= y && y < (height / 2) && far(x, y))
                        return sample(x, y);
                }

                queue[i] = queue[--queueSize];
                queue.length = queueSize;
            }
        };

        function far(x, y) {
            var i = (x / cellSize) | 0,
                j = ((y + (height / 2)) / cellSize) | 0,
                i0 = Math.max(i - 2, 0),
                j0 = Math.max(j - 2, 0),
                i1 = Math.min(i + 3, gridWidth),
                j1 = Math.min(j + 3, gridHeight);

            for (j = j0; j < j1; ++j) {
                var o = j * gridWidth;
                for (i = i0; i < i1; ++i) {
                    if ((s = grid[o + i])) {
                        var s

                        const somegeodist = d3.geoDistance([s[0], s[1]], [x, y]) * 180 / Math.PI
                        if (somegeodist < radius) return false;
                    }
                }
            }


            for (let index = 0; index < edge_points__.length; index++) {
                const element = edge_points__[index];
                if ((s = grid[element])) {
                    var s
                    const somegeodist = d3.geoDistance([s[0], s[1]], [x, y]) * 180 / Math.PI
                    if (somegeodist < radius) return false;
                }
            }


            return true;
        }

        function sample(x, y) {
            var s = [x, y];
            queue.push(s);
            const pos_ = gridWidth * (((y + (height / 2)) / cellSize) | 0) + ((x / cellSize) | 0)
            grid[pos_] = s;
            ++sampleSize;
            ++queueSize;

            if (Math.abs(y) > (90 - (cellSize * 2)) || Math.abs(x - (width / 2)) > (180 - (cellSize * 2))) {
                edge_points__.push(pos_)
            }

            return s;
        }
    }
}





export function makeGeoPtsRandBad1(number: number): pointGeoArr {
    return d3.range(number)
        .map(function (d) { return [Math.random() * 360, Math.random() * 90 - Math.random() * 90]; });
}

export function makeGeoPtsRandBad2(number: number): pointGeoArr {
    return d3.range(number).map(function () {
        return [360 * Math.random(), 90 * (Math.random() - Math.random())]
    })
}



// TODO import custom voronoi with findAll function
// vorobj_.findAll = function (x, y, radius) {
//     const points = vorobj_.points,
//         results = [],
//         seen = [],
//         queue = [vorobj_.find(x, y)];

//     // console.log("radius", radius);

//     while (queue.length) {
//         // console.log("queue", queue);
//         const q = queue.pop();
//         if (seen[q]) continue;
//         seen[q] = true;
//         // var dist_ = Math.hypot(x - points[2 * q], y - points[2 * q + 1])
//         var dist_ = d3geo.geoDistance([points[q][0], points[q][1]], [x, y]) * 180 / Math.PI
//         // var dist_ = d3geo.geoDistance([points[2 * q], points[2 * q + 1]], [x, y])
//         // console.log("dist_", dist_, [points[q][0], points[q][1]], [x, y]);
//         if (dist_ < radius) {
//             // if (d3geo.geoDistance([x, y], v.points[v._found]) < radius) {
//             results.push(q);
//             for (const p of vorobj_.delaunay.neighbors[q]) queue.push(p);
//         }
//     }
//     // console.log("results", results);
//     return results;
// }
