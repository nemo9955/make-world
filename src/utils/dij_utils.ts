

import * as d3 from "d3";


class FlatQueue {
    ids: any[];
    values: any[];
    length: number;
    // https://github.com/mourner/flatqueue

    constructor() {
        this.ids = [];
        this.values = [];
        this.length = 0;
    }

    clear() {
        this.length = this.ids.length = this.values.length = 0;
    }

    push(id, value) {
        this.ids.push(id);
        this.values.push(value);

        let pos = this.length++;
        while (pos > 0) {
            const parent = (pos - 1) >> 1;
            const parentValue = this.values[parent];
            if (value >= parentValue) break;
            this.ids[pos] = this.ids[parent];
            this.values[pos] = parentValue;
            pos = parent;
        }

        this.ids[pos] = id;
        this.values[pos] = value;
    }

    pop() {
        if (this.length === 0) return undefined;

        const top = this.ids[0];
        this.length--;

        if (this.length > 0) {
            const id = this.ids[0] = this.ids[this.length];
            const value = this.values[0] = this.values[this.length];
            const halfLength = this.length >> 1;
            let pos = 0;

            while (pos < halfLength) {
                let left = (pos << 1) + 1;
                const right = left + 1;
                let bestIndex = this.ids[left];
                let bestValue = this.values[left];
                const rightValue = this.values[right];

                if (right < this.length && rightValue < bestValue) {
                    left = right;
                    bestIndex = this.ids[right];
                    bestValue = rightValue;
                }
                if (bestValue >= value) break;

                this.ids[pos] = bestIndex;
                this.values[pos] = bestValue;
                pos = left;
            }

            this.ids[pos] = id;
            this.values[pos] = value;
        }

        this.ids.pop();
        this.values.pop();

        return top;
    }

    peek() {
        return this.ids[0];
    }

    peekValue() {
        return this.values[0];
    }
}

// returns the junctions between zones
export function shortest_junctions(graph, tree) {
    const origins = [...new Set(tree.origin)].filter(i => i > -1);
    let costs = new Map(),
        junctions = new Map();

    for (let l = 0; l < graph.sources.length; l++) {
        const i = tree.origin[graph.sources[l]],
            j = tree.origin[graph.targets[l]];
        if (i !== j && i > -1 && j > -1) {
            const code = `${i}-${j}`;
            const c =
                graph.costs[l] +
                tree.cost[graph.sources[l]] +
                tree.cost[graph.targets[l]];
            if (!costs.has(code) || c < costs.get(code)) {
                costs.set(code, c);
                junctions.set(code, [graph.sources[l], graph.targets[l]]);
            }
        }
    }

    return { costs, junctions };
}


// returns the shortest path that connects i to j:
// - without stepping into other origins’ zones
// - without going above cutoff in each origin’s zone
export function shortest_path(graph, tree, i, j) {
    const P = shortest_junctions(graph, tree);

    let cost = Infinity,
        junction = [],
        path = [];

    const code = `${i}-${j}`;

    if (P.costs.has(code)) {
        cost = P.costs.get(code);
        junction = P.junctions.get(code);
        path = junction.slice();
        path.reverse();
        while (tree.predecessor[path[0]] > -1)
            path.unshift(tree.predecessor[path[0]]);
        path.reverse();
        while (tree.predecessor[path[0]] > -1)
            path.unshift(tree.predecessor[path[0]]);
    }

    return { cost, junction, path };
}



export function shortest_paths(graph, tree) {
    const paths = [];
    const P = shortest_junctions(graph, tree);

    for (const code of P.costs.keys()) {
        const cost = P.costs.get(code),
            junction = P.junctions.get(code),
            path = junction.slice();
        path.reverse();
        while (tree.predecessor[path[0]] > -1)
            path.unshift(tree.predecessor[path[0]]);
        path.reverse();
        while (tree.predecessor[path[0]] > -1)
            path.unshift(tree.predecessor[path[0]]);
        paths.push({ cost, junction, path });
    }

    return paths;
}

export type graphType = {
    sources: number[],
    targets: number[],
    costs: number[],
}

// https://observablehq.com/@fil/dijkstra
export function* shortest_tree({ graph, origins, cutoff = Number.POSITIVE_INFINITY, step = 0 }) {
    const start_time = performance.now(),
        _step = step === undefined ? 0 : +step,
        neigh = new Map();
    let n = 0;

    // populate a fast lookup Map of links indices for each source
    for (let i = 0, l = graph.sources.length; i < l; i++) {
        const a = +graph.sources[i],
            b = +graph.targets[i];
        if (!neigh.has(a)) neigh.set(a, []);
        neigh.get(a).push(i);

        // keep track of the highest node’s id
        n = Math.max(n, a + 1, b + 1);
    }

    const q = new FlatQueue(),
        front = q.ids,
        cost = new Float64Array(n).fill(Infinity),
        predecessor = new Int32Array(n).fill(-1),
        origin = new Int32Array(n).fill(-1),
        status = {
            cost,
            predecessor,
            performance: 0,
            origin,
            step: 0,
            front,
            max_front_size: 0,
            ended: false
        };

    origins.forEach(node => {
        if (isFinite(node)) node = { id: node, cost: 0 };
        if (node.id < n) {
            origin[node.id] = node.id;
            q.push(node.id, (cost[node.id] = node.cost));
        }
    });

    const time = performance.now();

    while (q.length > 0) {
        const curr = q.peekValue(),
            node = q.pop();
        if (curr > cost[node]) continue; // ignore obsolete elements

        if (neigh.has(node)) {
            for (const i of neigh.get(node)) {
                const c = graph.costs ? +graph.costs[i] : 1;
                if (!isFinite(c)) continue;

                const tentative = c + cost[node];
                if (tentative > cutoff) continue;

                const dest = graph.targets[i];
                if (tentative >= 0 && tentative < cost[dest]) {
                    predecessor[dest] = node;
                    origin[dest] = origin[node];
                    q.push(dest, (cost[dest] = tentative));
                    status.max_front_size = Math.max(status.max_front_size, front.length);
                }
            }
        }

        status.step++;
        if (_step && status.step % _step === 0) {
            status.performance = performance.now() - time;
            yield status;
        }
    }

    status.ended = true;
    status.performance = performance.now() - time;
    yield status;
}



export function shortestTreeCustom({ graph , origins, cutoff = Number.POSITIVE_INFINITY, directed = true }) {
    const neigh = new Map();
    let n = 0;

    // populate a fast lookup Map of links indices for each source
    for (let i = 0, l = graph.length; i < l; i++) {
        const a = +graph[i][0],
            b = +graph[i][1];
        if (!neigh.has(a)) neigh.set(a, []);
        neigh.get(a).push(i);

        if (directed == false) {
            if (!neigh.has(b)) neigh.set(b, []);
            neigh.get(b).push(i);
        }

        // keep track of the highest node’s id
        n = Math.max(n, a + 1, b + 1);
    }

    const q = new FlatQueue(),
        front = q.ids,
        cost = new Float32Array(n).fill(Infinity),
        predecessor = new Int32Array(n).fill(-1),
        origin = new Int32Array(n).fill(-1),
        status = {
            cost,
            predecessor,
            origin,
            max_front_size: 0,
        };

    origins.forEach(node => {
        if (isFinite(node)) node = { id: node, cost: 0 };
        if (node.id < n) {
            origin[node.id] = node.id;
            q.push(node.id, (cost[node.id] = node.cost));
        }
    });


    while (q.length > 0) {
        const curr = q.peekValue(),
            node = q.pop();
        if (curr > cost[node]) continue; // ignore obsolete elements

        if (neigh.has(node)) {
            for (const i of neigh.get(node)) {
                const c = graph[i].length >= 3 ? +graph[i][2] : 1;
                if (!isFinite(c)) continue;

                const tentative = c + cost[node];
                if (tentative > cutoff) continue;

                const dest = graph[i][1];
                if (tentative >= 0 && tentative < cost[dest]) {
                    predecessor[dest] = node;
                    origin[dest] = origin[node];
                    q.push(dest, (cost[dest] = tentative));
                    status.max_front_size = Math.max(status.max_front_size, front.length);
                }

                if (directed == false) {
                    const destRev = graph[i][0];
                    if (tentative >= 0 && tentative < cost[destRev]) {
                        predecessor[destRev] = node;
                        origin[destRev] = origin[node];
                        q.push(destRev, (cost[destRev] = tentative));
                        status.max_front_size = Math.max(status.max_front_size, front.length);
                    }
                }
            }
        }

    }

    return status;
}


export function random2d(width, height, N) {
    var rng = Math.random
    const points = [];
    for (let i = 0; i < N; i++) points.push([width * rng(), height * rng()]);
    return points;
}

// https://observablehq.com/@kemper/voronoi-polygon-smoothing
// https://observablehq.com/@mbostock/poisson-disc-distribution
// https://www.jasondavies.com/poisson-disc/
export function poissonDiscSampler(width, height, radius) {
    var rng = Math.random
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
            queueSize = 0,
            sampleSize = 0;

        return function () {
            if (!sampleSize) return sample(rng() * width, rng() * height);

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
                    if (0 <= x && x < width && 0 <= y && y < height && far(x, y))
                        return sample(x, y);
                }

                queue[i] = queue[--queueSize];
                queue.length = queueSize;
            }
        };

        function far(x, y) {
            var i = (x / cellSize) | 0,
                j = (y / cellSize) | 0,
                i0 = Math.max(i - 2, 0),
                j0 = Math.max(j - 2, 0),
                i1 = Math.min(i + 3, gridWidth),
                j1 = Math.min(j + 3, gridHeight);

            for (j = j0; j < j1; ++j) {
                var o = j * gridWidth;
                for (i = i0; i < i1; ++i) {
                    if ((s = grid[o + i])) {
                        var s,
                            dx = s[0] - x,
                            dy = s[1] - y;
                        if (dx * dx + dy * dy < radius2) return false;
                    }
                }
            }

            return true;
        }

        function sample(x, y) {
            var s = [x, y];
            queue.push(s);
            grid[gridWidth * ((y / cellSize) | 0) + ((x / cellSize) | 0)] = s;
            ++sampleSize;
            ++queueSize;
            return s;
        }
    }
}



export function hexgrid2d(width, height, N) {
    var h = Math.sqrt((width * height * (Math.sqrt(5) / 2)) / N)
    var v = h * (2 / Math.sqrt(5))
    // console.log("h", h, "v", v)


    // h = Math.sqrt(Math.floor((width -  h) * (height -  v) * (Math.sqrt(5) / 2)) / N)
    // v = h * (2 / Math.sqrt(5))
    // console.log("h", h, "v", v)

    var a = []
    for (let i = 1; i <= width / h; i++)
        for (let j = 0.5; j < height / v; j++)
            a.push([
                ((i - (j % 2) / 2) * h) + 1,
                (j * v) + 1
            ]);

    // console.log(N, a.length)
    return a;
}


export function grid2d(width, height, N) {
    const radius = Math.sqrt((width * height) / N);
    const points = [];
    for (let i = 0; i < width / radius; i++)
        for (let j = 0; j < height / radius; j++)
            points.push([i * radius, j * radius]);
    return points;
}




export function normal2d(width, height, N) {
    const M = Math.min(width, height) / 2,
        random = d3.randomNormal(M, M / 3);
    const points = [];
    for (let i = 0; i < N; i++) points.push([random(), random()]);
    return points;
}




export function pick2d(width, height, N, type) {
    switch (type) {
        case "poisson":
        case "poissonDisc":
            return poissonDisc2d(width, height, N);
        case "hex":
        case "hexagons":
        case "hexgrid":
            return hexgrid2d(width, height, N);
        case "square":
        case "grid":
            return grid2d(width, height, N);
        case "normal":
            return normal2d(width, height, N);
        case "random":
        default:
            return random2d(width, height, N);
    }
}

export function poissonDisc2d(width, height, N) {
    const radius = Math.sqrt((0.63 * (width * height)) / N);
    return poissonDiscSampler(width, height, radius);
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////


export function draw_connections(context, nodes, run) {
    context.beginPath();
    run.predecessor.forEach((d, i) => {
        if (d > -1) {
            context.moveTo(...nodes[i]);
            context.lineTo(...nodes[d]);
        }
    });
    context.lineWidth = 0.5;
    context.strokeStyle = "white";
    context.stroke();
}


// export function draw_voronoi_cells(context, nodes, run) {
//     const width = parseInt(context.canvas.style.width),
//         height = (context.canvas.height / context.canvas.width) * width,
//         voronoi = new d3.Delaunay.from(nodes).voronoi([0, 0, width, height]);

//     let i = 0;
//     for (const cell of voronoi.cellPolygons()) {
//         context.strokeStyle = context.fillStyle = color(run.cost[i]);
//         context.beginPath(),
//             voronoi.renderCell(i, context),
//             context.fill(),
//             context.stroke();
//         i++;
//     }
// }

// export function draw_contours(context, nodes, run, opts = {}) {
//     const path = d3.geoPath().context(context),
//         contours = d3.tricontour().thresholds(opts.quick ? 50 : 300)(
//             nodes.map((d, i) => [d[0], d[1], run.cost[i]]).filter(d => isFinite(d[2]))
//         );

//     context.lineWidth = 1;
//     for (const c of contours) {
//         context.strokeStyle = context.fillStyle = color(c.value);
//         context.beginPath();
//         path(c);
//         context.fill();
//         context.stroke();
//     }

//     if (opts.lines) {
//         context.strokeStyle = "white";
//         context.fillStyle = "white";
//         context.textAlign = "center";
//         context.font = "12px Arial";
//         context.globalAlpha = 1;
//         for (const c of contours) {
//             if (c.value % 20 === 0) {
//                 context.lineWidth = c.value % 100 === 0 ? 1 : 0.5;
//                 if (opts.labels && !opts.quick && c.value % 100 === 0) {
//                     drawLabels(context, c);
//                 } else {
//                     context.beginPath();
//                     path(c);
//                     context.stroke();
//                 }
//             }
//         }
//     }
// }


// // adapted from https://observablehq.com/@fil/contour-labels-canvas
// export function drawLabels(context, contour) {
//     const width = parseInt(context.canvas.style.width),
//         height = (context.canvas.height / context.canvas.width) * width,
//         scale = 1,
//         path = d3.geoPath().context(context);

//     const threshold = contour.value,
//         labels = [],
//         steps = 30;

//     contour.coordinates.forEach(polygon =>
//         polygon.forEach((ring, j) => {
//             const p = ring.slice(1, Infinity),
//                 // best number of steps to divide ring.length
//                 possibilities = d3.range(steps, steps * 1.4),
//                 scores = possibilities.map(d => -((p.length - 1) % d)),
//                 n = possibilities[d3.scan(scores)],
//                 // best starting point: bottom for first rings, top for holes
//                 start = 1 + (d3.scan(p.map(xy => (j === 0 ? -1 : 1) * xy[1])) % n),
//                 margin = 2;

//             if (p.length < 15) return; // no label on small contours

//             p.forEach((xy, i) => {
//                 if (
//                     i % n === start &&
//                     xy[0] > margin &&
//                     xy[0] < width - margin &&
//                     xy[1] > margin &&
//                     xy[1] < height - margin
//                 ) {
//                     const a = (i - 2 + p.length) % p.length,
//                         b = (i + 2) % p.length,
//                         dx = p[b][0] - p[a][0],
//                         dy = p[b][1] - p[a][1];
//                     if (dx === 0 && dy === 0) return;

//                     labels.push({
//                         threshold, // value
//                         xy: xy.map(d => scale * d),
//                         angle: Math.atan2(dy, dx),
//                         text: `${threshold}`
//                     });
//                 }
//             });
//         })
//     );

//     // create the mask for this threshold:
//     // the full rectangle minus a rectangle around each label
//     context.save();
//     context.beginPath();
//     context.moveTo(0, 0),
//         context.lineTo(width, 0),
//         context.lineTo(width, height),
//         context.lineTo(0, height),
//         context.lineTo(0, 0);
//     const arc = d3.arc();
//     for (const label of labels) {
//         for (let i = 0; i < 2 * Math.PI; i += 0.2) {
//             const pos = [Math.cos(i) * 13, -Math.sin(i) * 10],
//                 c = Math.cos(label.angle),
//                 s = Math.sin(label.angle);
//             context[i === 0 ? "moveTo" : "lineTo"](
//                 label.xy[0] + pos[0] * c - pos[1] * s,
//                 label.xy[1] + pos[1] * c + pos[0] * s
//             );
//         }
//     }
//     // context.stroke(); // uncomment to see the mask
//     context.clip();

//     // draw white contour for this threshold
//     context.beginPath();
//     path(contour);
//     context.stroke();

//     // draw labels for this threshold
//     context.restore();
//     for (const label of labels) {
//         addlabel(context, label);
//     }

//     function addlabel(context, label) {
//         context.save();
//         context.translate(...label.xy);
//         context.rotate(label.angle + (Math.cos(label.angle) < 0 ? Math.PI : 0));
//         context.fillText(label.text, -1, 4);
//         context.restore();
//     }
// }


