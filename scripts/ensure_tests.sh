#!/usr/bin/env bash

SCRIPTSPATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
REPOPATH="$(realpath "${SCRIPTSPATH}/..")"

source ${SCRIPTSPATH}/common.sh

# Makes sure there is an *.test.ts file for every src/**/*.ts file
# To run :
# ➜  make-world git:(master) ✗ bash ./scripts/ensure_tests.sh

run cd ${REPOPATH}

for src_file in ./src/**/*.ts ; do
    test_file=${src_file}
    test_file=${test_file/"src/"/"tests/"}
    test_file=${test_file/".ts"/".test.ts"}

    base_name=$(basename "${src_file/".ts"}")
    base_path="$(dirname "${src_file}")/${base_name}"

    # evars src_file test_file base_name base_path

    if [[ ! -e  "${test_file}" ]] ; then
        mhmm "Will make empty test file for ${src_file} -> ${test_file}"
        run mkdir -p $(dirname "${test_file}")
        run touch "${test_file}"

        echo "// import * as ${base_name} from \"../../${base_path}\""  >> "${test_file}"
        echo "// import { ${base_name} } from \"../../${base_path}\""     >> "${test_file}"
        echo -e "\n// https://jestjs.io/docs/en/expect \n"            >> "${test_file}"
        echo -e "\ntest('Filler test', () => {\n\texpect(1).toBe(1);\n});\n\n"            >> "${test_file}"

    else
        minfo "Test file already exists ${src_file} -> ${test_file}"
    fi
done