




SCRIPTSPATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
REPOPATH="$(realpath "${SCRIPTSPATH}/..")"

source ${SCRIPTSPATH}/common.sh

# run pkill "$0" || true
# run killall "$0" || true
# # run pkill -f "$0" || true
# run pidof "$0" | xargs kill -9 || true



# https://stackoverflow.com/questions/296536/how-to-urlencode-data-for-curl-command

# Returns a string in which the sequences with percent (%) signs followed by
# two hex digits have been replaced with literal characters.
function rawurldecode() {

  # This is perhaps a risky gambit, but since all escape characters must be
  # encoded, we can replace %NN with \xNN and pass the lot to printf -b, which
  # will decode hex for us

  printf -v REPLY '%b' "${1//%/\\x}" # You can either set a return variable (FASTER)

  echo "${REPLY}"  #+or echo the result (EASIER)... or both... :p
}

function rawurlencode() {
  local string="${1}"
  local strlen=${#string}
  local encoded=""
  local pos c o

  for (( pos=0 ; pos<strlen ; pos++ )); do
     c=${string:$pos:1}
     case "$c" in
        [-_.~a-zA-Z0-9] ) o="${c}" ;;
        * )               printf -v o '%%%02x' "'$c"
     esac
     encoded+="${o}"
  done
  echo "${encoded}"    # You can either set a return variable (FASTER)
  REPLY="${encoded}"   #+or echo the result (EASIER)... or both... :p
}


# https://en.wikipedia.org/w/api.php?cmtitle=Category:Given_names&action=query&list=categorymembers&cmlimit=500&format=json&cmtype=page
# https://en.wikipedia.org/w/api.php?cmtitle=Category:Given_names&action=query&list=categorymembers&cmlimit=500&format=json&cmtype=subcat
# https://en.wikipedia.org/?curid=24870954
# https://en.wikipedia.org/w/api.php?action=query&pageids=24870954


function appendCatValues(){
    local outfile="$1" ; shift
    local wikiroot="$1" ; shift
    local categnow="$1" ; shift
    local prevcategs="$1" ; shift
    local depth="$1" ; shift
    local contvalue=""
    local valstr=""
    local line=""
    local iter=0

    local valjson="$(curl -sS -G \
        --data-urlencode "cmtitle=${categnow}" \
        -d "action=query" \
        -d "list=categorymembers" \
        -d "cmlimit=500" \
        -d "cmtype=page" \
        -d "format=json" \
        ${wikiroot}/w/api.php )"

    while true ; do

        while read line; do
            line=${line//\"}
            line=${line//\(*\)}
            line=${line//* name}
            line=${line//*given name*}
            line=${line//*middle name*}
            line=${line//*aristocratic and*}
            line=${line//Naming laws*}
            line=${line//*List of*}
            line=${line//*Category*}
            # line=${line##*( )}
            # line=${line%%*( )}
            line="$(echo $line | sed 's/ *$//g')"
            [[ -z "${line}" ]] && continue

            iter=$((iter + 1))
            valstr+="\"${line}\","
            # valstr+=" ${line// /_}"
            # valstr+=" ${line}" !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        done < <(echo "${valjson}" | jq '.query.categorymembers[]?.title')


        contvalue="$(echo "${valjson}" | jq '.continue.cmcontinue')"
        contvalue=${contvalue//\"}
        # evars iter contvalue

        [[ "${contvalue}" == "null" ]] && break

        valjson="$(curl -sS -G \
            --data-urlencode "cmtitle=${categnow}" \
            -d "cmcontinue=${contvalue}" \
            -d "action=query" \
            -d "list=categorymembers" \
            -d "cmlimit=500" \
            -d "cmtype=page" \
            -d "format=json" \
            ${wikiroot}/w/api.php )"

    done

    [[ -z "${valstr}" ]] && return 0
    # echo -e "${depth} ${iter} \t ${prevcategs//Category:} \t:\t ${valstr}" >> "${outfile}"
    # echo -e "${depth} ${iter} \t ${prevcategs} \t:\t ${valstr}" >> "${outfile}"


    # ( flock -e 200

    valstr="$(echo $valstr | sed 's/ *$//g')"
    valstr="$(echo $valstr | sed '$ s/.$//')"
    local wordsarr="${valstr}"
    # local wordsarr="\"${valstr// /\",\"}\""
    local categarr="\"${prevcategs//Category:}\""
    categarr="${categarr// /\",\"}"
    categarr="${categarr//|/\",\"}"
    local jsonline=""
    jsonline+="{"
    jsonline+="\"depth\":${depth},"
    jsonline+="\"word_count\":${iter},"
    jsonline+="\"category\":\"${categnow}\","
    jsonline+="\"categories\":[${categarr}],"
    jsonline+="\"values\":[${wordsarr}]"
    jsonline+="},"
    echo -e "${jsonline}" >> "${outfile}"
    echo -e "${categnow}" >> "${outfile}.seen"

    # ) 200>"${outfile}.lock"


}

function recursiveGetCat(){
    local outfile="$1" ; shift
    local wikiroot="$1" ; shift
    local categnow="$1" ; shift
    local prevcategs="$1" ; shift
    local depth="$1" ; shift
    local maxdepth="$1" ; shift

    categnow=${categnow//\"}

    # local categnowenc="$(rawurlencode "${categnow}")"
    local categnowenc="${categnow// /_}"


    local categpaths="${prevcategs}|${categnowenc}"
    categpaths="${categpaths// /_}"
    # local categpaths="${prevcategs}\t${categnowenc}"
    # [[ "${prevcategs}" == "" ]] && categpaths="${categnowenc}"

    # echo "======|${outfile}|${wikiroot}|${categnow}|${prevcategs}|${depth}|${maxdepth}|"
    # return 0

    # exec {lock_fd}>"${outfile}.lock" || exit 1
    # flock -n "$lock_fd" || { echo "ERROR: flock() failed." >&2; exit 1; }
    # flock -u "$lock_fd"

    # if grep -iq "\"${categnow}\"" "${outfile}" ; then
    if grep -q "${categnowenc}" "${outfile}.seen" ; then
        mwarn "Already visited : ${categnowenc}"
        return 0
        # exit 0
    fi


    if [[ "${depth}" -ge "${maxdepth}" ]] ; then
        mwarn "Maxdepth ${depth}>${maxdepth} was reached : ${categnowenc} "
        return 0
        # exit 0
    fi



    appendCatValues "${outfile}" "${wikiroot}" "${categnow}" "${categpaths}" "${depth}" &
    echo -e "${categnowenc}" >> "${outfile}.seen"


    if [[ "$((depth + 1))" -ge "${maxdepth}" ]] ; then
        mwarn "Maxdepth ${maxdepth} will be reached : ${categnowenc} "
        return 0
        # exit 0
    fi

    local subcatjson="$(curl -sS -G \
        --data-urlencode "cmtitle=${categnow}" \
        -d "action=query" \
        -d "list=categorymembers" \
        -d "cmlimit=500" \
        -d "cmtype=subcat" \
        -d "format=json" \
        ${wikiroot}/w/api.php )"

    # echo "======|${outfile}|${wikiroot}|${categnow}|${prevcategs}|${depth}|${maxdepth}|"

    local iter=0
    local line=""
    while read line; do
        iter=$((iter + 1))
        line=${line//\"}
        line=${line// /_}
        # evars iter
        # [[ "${iter}" -ge "10" ]] && break
        sleep 0.1
        # echo -e "${line}" >> "${outfile}.seen"
        # recursiveGetCat "${outfile}" "${wikiroot}" "${line}" "${categpaths}" "$((depth + 1))" "${maxdepth}" &
        # recGetCatArray+=("'${outfile}' '${wikiroot}' '${line}' '${categpaths}' '$((depth + 1))' '${maxdepth}'")
        # echo "\"'${outfile}' '${wikiroot}' '${line}' '${categpaths}' '$((depth + 1))' '${maxdepth}'\"" >> "${REPOPATH}/data/wiki_categs/tmp_arr.txt"
        echo "\"${outfile}\" \"${wikiroot}\" \"${line}\" \"${categpaths}\" \"$((depth + 1))\" \"${maxdepth}\"" >> "${REPOPATH}/data/wiki_categs/tmp_arr.txt"
    done < <(echo "${subcatjson}" | jq '.query.categorymembers[]?.title')

    wait


    if [[ "${prevcategs}" == "" ]] ; then
        # grep -oP "\S*\s*\t:\t" "${outfile}" | sort | uniq -d
        echo "done ${categnow}"
    fi

}


function getCategWrapper(){
    local categname="$1" ; shift
    local maxdepth="$1" ; shift


    local categfile="${categname/Category:}"
    categfile="${categfile// /_}"
    categfile="${categfile,,}"

    local categclean="${categname/Category:}"

    local categfilepath="${REPOPATH}/data/wiki_categs/${categfile}.json"

    echo -e "" > "${categfilepath}.seen"
    echo -e "[" > "${categfilepath}"

    # recursiveGetCat "${categfilepath}" "https://en.wikipedia.org" "Category:${categclean}" "" "0" "${maxdepth}" &
    # recGetCatArray+=("'${categfilepath}' 'https://en.wikipedia.org' 'Category:${categclean}' 'Category:${categclean}' '0' '${maxdepth}'")
    # echo "\"'${categfilepath}' 'https://en.wikipedia.org' 'Category:${categclean}' 'Category : ${categclean}' '0' '${maxdepth}'\"" >> "${REPOPATH}/data/wiki_categs/tmp_arr.txt"
    echo "\"${categfilepath}\" \"https://en.wikipedia.org\" \"Category:${categclean// /_}\" \"Category:${categclean// /_}\" \"0\" \"${maxdepth}\"" >> "${REPOPATH}/data/wiki_categs/tmp_arr.txt"


    # run wait

    # run sed -i '$ s/.$//' \"${categfilepath}\" ; echo -e \"]\n\" >> \"${categfilepath}\"

    trap "sed -i '$ s/.$//' \"${categfilepath}\"" EXIT
    trap "sed -i '$ s/.$//' \"${categfilepath}\"" EXIT
    trap "echo -e \"]\n\" >> \"${categfilepath}\"" EXIT
    trap "rm \"${categfilepath}.seen\"" EXIT

    # run rm "${categfilepath}.seen" || true
    # run rm "${categfilepath}.lock" || true
}


# recursiveGetCat "${REPOPATH}/data/all_givennames.txt" "https://en.wikipedia.org" "Category:Given_names" "" "0"
# recursiveGetCat "${REPOPATH}/data/all_Surnames.txt" "https://en.wikipedia.org" "Category:Surnames" "" "0"
# recursiveGetCat "${REPOPATH}/data/all_surnames.txt" "https://en.wikipedia.org" "Category:Surnames_by_language" "" "0"
# recursiveGetCat "${REPOPATH}/data/Given_names_by_language.txt" "https://en.wikipedia.org" "Category:Given_names_by_language" "" "0"
# recursiveGetCat "${REPOPATH}/data/Given_names_by_culture.txt" "https://en.wikipedia.org" "Category:Given_names_by_culture" "" "0"
# recursiveGetCat "${REPOPATH}/data/Drug_brand_names.txt" "https://en.wikipedia.org" "Category:Drug_brand_names" "" "0"

# appendCatValues "${REPOPATH}/data/all_givennames.txt" "https://en.wikipedia.org" "Category:Welsh_given_names" "aaaaaaaaa" "10"
# appendCatValues "${REPOPATH}/data/all_givennames.txt" "https://en.wikipedia.org" "Category:English_masculine_given_names" "aaaaaaaaa" "10"
# appendCatValues "${REPOPATH}/data/all_givennames.txt" "https://en.wikipedia.org" "Category:Given_names" "aaaaaaaaa" "10"

# https://en.wikipedia.org/wiki/Category:Surnames
# https://en.wikipedia.org/wiki/Category:Given_names
# https://en.wikipedia.org/wiki/Category:Names


# https://en.wikipedia.org/wiki/Category:Given_names_by_culture
# https://en.wikipedia.org/wiki/Category:Surnames_by_language


# https://en.wikipedia.org/w/index.php?search=name&title=Special%3ASearch&profile=advanced&fulltext=1&ns14=1


echo "" > "${REPOPATH}/data/wiki_categs/tmp_arr.txt"
mkdir -p "${REPOPATH}/data/wiki_categs"

getCategWrapper "Category:Given_names_by_culture" "7"
getCategWrapper "Category:Surnames_by_language" "7"
getCategWrapper "Category:Drug_brand_names" "7"
getCategWrapper "Category:Drug_delivery_devices" "7"
# getCategWrapper "Category:Pharmacology" "4"
# getCategWrapper "Category:Counties" "1"
# getCategWrapper "Category:Countries_by_continent" "1"

export -f recursiveGetCat appendCatValues rawurldecode rawurlencode
export -f init_colors print_runq print_run minfo myay mhmm mdebug mwarn merror evars runq run
export REPOPATH

for dindex in {1..10} ; do
    evars dindex
    rm -f  "${REPOPATH}/data/wiki_categs/tmp_arr_use.txt"
    [[ -f "${REPOPATH}/data/wiki_categs/tmp_arr.txt" ]] || break

    mv "${REPOPATH}/data/wiki_categs/tmp_arr.txt" "${REPOPATH}/data/wiki_categs/tmp_arr_use.txt"
    cat "${REPOPATH}/data/wiki_categs/tmp_arr_use.txt" | xargs -n 1 -P 20 -I {} bash -c 'recursiveGetCat $@' _ {}
    run sleep 5
    # tmp_arr=()
    # while read params; do
    #     tmp_arr+=("${params@Q}")
    # done < <(cat "${REPOPATH}/data/wiki_categs/tmp_arr_use.txt")
    # echo "${tmp_arr[*]}" | xargs -n 1 -P 10 -I {} bash -c 'runq recursiveGetCat "$@"' _ {}
    # run cat "${REPOPATH}/data/wiki_categs/tmp_arr_use.txt"
    # tmp_arr=($(cat "${REPOPATH}/data/wiki_categs/tmp_arr_use.txt"))
    # echo "${tmp_arr[@]}" | xargs -n 1 -P 10 -I {} bash -c 'runq recursiveGetCat "$@"' _ {}
    # echo "${tmp_arr[@]@Q}" | xargs -n 1 -P 10 -I {} bash -c 'runq recursiveGetCat $@' _ {}
done

rm -f  "${REPOPATH}/data/wiki_categs/tmp_arr.txt"
rm -f  "${REPOPATH}/data/wiki_categs/tmp_arr_use.txt"

run sleep 20

for finish in ${REPOPATH}/data/wiki_categs/*.json ; do
    evars finish
    # if [[ "$(tail -5 "${finish}")" == *,\n\n ]] ; then
    # if tail -5 "${finish}" | grep -qP "[.\n]*},$" ; then
        # echo "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
        # sed -i '$ s/[\n\],]$//' "${finish}"
        sed -i '$ s/[\n,\]]*$//' "${finish}"
        echo -e "]" >> "${finish}"
    # fi
    # run jq -n -f "${finish}"
    rm -f "${finish}.seen"
done


run wait

