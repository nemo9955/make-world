#!/usr/bin/env bash

SCRIPTSPATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
REPOPATH="$(realpath "${SCRIPTSPATH}/..")"

source ${SCRIPTSPATH}/common.sh




: ' RAW EXPORTS IN CASE IT NEEDS TO BE MANUALLY ADDED IN
node_modules/d3-geo-voronoi/dist/d3-geo-voronoi.js

exports.geo_delaunay_from = geo_delaunay_from;
exports.geo_triangles = geo_triangles;
exports.geo_edges = geo_edges;
exports.geo_neighbors = geo_neighbors;
exports.geo_find = geo_find;
exports.geo_circumcenters = geo_circumcenters;
exports.geo_polygons = geo_polygons;
exports.geo_mesh = geo_mesh;
exports.geo_hull = geo_hull;
exports.geo_urquhart = geo_urquhart;
'




D3GEO_POINTER="Object.defineProperty(exports"
DESIRED_D3GEO_FUNCS=(
    geo_delaunay_from
    geo_triangles
    geo_edges
    geo_neighbors
    geo_find
    geo_circumcenters
    geo_polygons
    geo_mesh
    geo_hull
    geo_urquhart
)




for file_ in ${REPOPATH}/node_modules/d3-geo-voronoi/dist/d3-geo-voronoi.js ; do
    # evars file_
    file_contect="$(cat ${file_} )"

    for func_ in ${DESIRED_D3GEO_FUNCS[*]} ; do
        # evars func_

        if [[ "${file_contect}" != *"exports.${func_}"* ]] ; then
            from_="${D3GEO_POINTER}"
            to_="exports.${func_} = ${func_};"
            minfo "Inserting '${to_}' in ${file_}"
            to_+="\n${D3GEO_POINTER}"
            file_contect=${file_contect/${from_}/${to_}}
        fi
    done

    echo -en "${file_contect}" > "${file_}"


done

