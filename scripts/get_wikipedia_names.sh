




SCRIPTSPATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
REPOPATH="$(realpath "${SCRIPTSPATH}/..")"

source ${SCRIPTSPATH}/common.sh


roNamesLinks=(
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_A"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_B"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_D"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_E"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_F"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_G"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_H"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_I"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_J"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_K"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_L"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_M"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_N"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_O"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_P"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_R"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_S"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_T"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_U"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_V"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_Z"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_Î"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_Ș"
    "https://ro.wikipedia.org/wiki/List%C4%83_de_nume_rom%C3%A2ne%C8%99ti_-_litera_Ț"
)



function getAllNamesRoNames(){
    local sumWords=()
    while read word; do
        # evars word
        word="${word// — pagină}"
        word="${word//title=}"
        word="${word//wikt:}"
        word="${word//Format:}"
        word="${word//\"}"
        # echo "${word}"
        sumWords+=("${word}")
    done < <(run curl -s "${1}" | grep -oP "(?:title=\"([\S]*) — pagină|title=\"wikt:([\S]*)\")" )
    echo ${sumWords[*]} | sort -u
}



function getAllNamesRaw(){
    local sumWords=()
    while read word; do
        # evars word
        [[ "${word}" == *"Wikipedia"* ]] && continue
        [[ "${word}" == *"Category"* ]] && continue
        word="${word//&\#039; /\’}"
        word="${word//_(given_name)}"
        word="${word//_(Japanese_name)}"
        word="${word//_(Japanese_given_name)}"
        word="${word//_(name)}"
        word="${word//_(disambiguation)}"
        word="${word//(given name)}"
        word="${word//(nickname)}"
        word="${word//(Japanese given name)}"
        word="${word//(Japanese name)}"
        word="${word//(name)}"
        word="${word//(disambiguation)}"
        word="${word// — pagină}"
        word="${word//<a href=\"\/wiki\/}"
        word="${word//title=}"
        word="${word//wikt:}"
        word="${word//Format:}"
        word="${word//\"}"
        # echo "${word}"
        sumWords+=("${word}")
        # <a href="/wiki/\S\S*"
        # <li><a href=\"\S*\" title=\"[^<>]*\">[^<>]*</a></li>
    # done < <(echo -e "${1}" | grep -oP "<a href=\"/wiki/\S\S*\""        )
    done < <(echo -e "${1}"   | grep -oP "<li><a href=\"\S*\" title=\"[^<>]*\">[^<>]*</a></li>"  | grep -oP "(?:title=\"([^\"]*)\")")
    # done < <(echo -e "${1}"   | grep -oP "<li><a href=\"\S*\" title=\"[^<>]*\">[^<>]*</a></li>"  | grep -oP "(?:title=\"([^\"]*)\")")
    # done < <(echo -e "${1}" | grep -oP "(?:title=\"([^\"]*)\"|title=\"wikt:([\S]*)\")")
    echo ${sumWords[*]} | sort -u
}



function recursiveGetAllNames(){
    local root="$1"
    local link="$1$2"
    local page="$(run curl -s "${link}"  )"
    page="${page#*previous page}"
    page="${page%next page*}"

    local next="$(echo "${page}" | grep "next page</a>" | grep -oP "<a href=\"\S\S\S*\"" | tail -1  )"
    next="${next//<a href=}"
    next="${next// }"
    next="${next//\"}"
    # next="$(rawurldecode "${next}")"
    # next="${next//\&amp\%3B/\&}"
    next="${next/amp;}"
    # next="${next/;/%3B}"
    # evars next

    getAllNamesRaw "${page}"
    [[ -n "${next}" ]] && recursiveGetAllNames "$1" "${next}" || true
}


function getAllCategoryes(){
    local root="$1"
    local link="$1$2"
    local page="$(run curl -s "${link}"  )"


    local cats="$(echo "${page}" | grep -oP "</span>\s*<a href=\"/wiki/Category:\w*\""   )"
    cats="${cats//<\/span>}"
    cats="${cats//<a href=\"}"
    cats="${cats//\"}"

    echo ${cats} | sort -u | sort -u
}





# echo "" > "${REPOPATH}/data/romaninan_names_1.txt"
# for link in ${roNamesLinks[*]};do
#     evars link
#     tmpWords=( $(getAllNamesRoNames ${link} ) )
#     echo ${tmpWords[*]} | sort -u >> "${REPOPATH}/data/romaninan_names_1.txt"
# done
# echo -e "\n\n" >> "${REPOPATH}/data/romaninan_names_1.txt"
# getAllNamesRoNames "https://ro.wikipedia.org/wiki/List%C4%83_de_prenume_rom%C3%A2ne%C8%99ti" >> "${REPOPATH}/data/romaninan_names_1.txt"




function getStdWikiCatNames(){
    local dumpp="$1" ; shift

    echo "" > "${dumpp}"
    for cat_link in $@ ; do
        evars cat_link
        recursiveGetAllNames "https://en.wikipedia.org" "${cat_link}" >> "${dumpp}"
        echo -e "\n\n\n" >> "${dumpp}"
    done

}


function getFirstCategsStdWikiCatNames(){
    local dumpp="$1" ; shift

    echo "" > "${dumpp}"
    for clink in $@ ; do
        evars clink
        local allcats=($(getAllCategoryes "https://en.wikipedia.org" "${clink}"))
        allcats+=("${clink}")
        for ccat in ${allcats[*]} ; do
            evars ccat
            # echo -e "${ccat}" >> "${dumpp}"
            recursiveGetAllNames "https://en.wikipedia.org" "${ccat}" >> "${dumpp}"
            echo -e "\n\n\n" >> "${dumpp}"
        done
    done

}


function getSecCategsStdWikiCatNames(){
    local dumpp="$1" ; shift

    echo "" > "${dumpp}"
    for clink in $@ ; do
        evars clink
        local allcats=($(getAllCategoryes "https://en.wikipedia.org" "${clink}"))
        allcats+=("${clink}")
        for ccat in ${allcats[*]} ; do
            # evars ccat
            allcats+=($(getAllCategoryes "https://en.wikipedia.org" "${ccat}"))
        done
    done

    allcats=($(printf "%s\n" ${allcats[*]} | sort -u ))

    for ccat in ${allcats[*]} ; do
        evars ccat
        # echo -e "${ccat}" >> "${dumpp}"
        recursiveGetAllNames "https://en.wikipedia.org" "${ccat}" >> "${dumpp}"
        echo -e "\n\n\n" >> "${dumpp}"
    done

}




# echo "" > "${REPOPATH}/data/japanese_2.txt"
# recursiveGetAllNames "https://en.wikipedia.org" "/wiki/Category:Japanese_unisex_given_names" >> "${REPOPATH}/data/japanese_2.txt"
# echo -e "\n\n\n" >> "${REPOPATH}/data/japanese_2.txt"
# recursiveGetAllNames "https://en.wikipedia.org" "/wiki/Category:Japanese_masculine_given_names" >> "${REPOPATH}/data/japanese_2.txt"
# echo -e "\n\n\n" >> "${REPOPATH}/data/japanese_2.txt"
# recursiveGetAllNames "https://en.wikipedia.org" "/wiki/Category:Japanese_feminine_given_names" >> "${REPOPATH}/data/japanese_2.txt"


# https://en.wikipedia.org/wiki/Category:Greek_masculine_given_names
# https://en.wikipedia.org/wiki/Category:Greek_feminine_given_names

# echo "" > "${REPOPATH}/data/greek_names_1.txt"
# recursiveGetAllNames "https://en.wikipedia.org" "/wiki/Category:Greek_masculine_given_names" >> "${REPOPATH}/data/greek_names_1.txt"
# echo -e "\n\n\n" >> "${REPOPATH}/data/greek_names_1.txt"
# recursiveGetAllNames "https://en.wikipedia.org" "/wiki/Category:Greek_feminine_given_names" >> "${REPOPATH}/data/greek_names_1.txt"
# echo -e "\n\n\n" >> "${REPOPATH}/data/greek_names_1.txt"


# getStdWikiCatNames "${REPOPATH}/data/japanese_names_1.txt" "/wiki/Category:Japanese_unisex_given_names" "/wiki/Category:Japanese_masculine_given_names" "/wiki/Category:Japanese_feminine_given_names" &
# getStdWikiCatNames "${REPOPATH}/data/greek_names_1.txt" "/wiki/Category:Greek_masculine_given_names" "/wiki/Category:Greek_feminine_given_names" &
# getStdWikiCatNames "${REPOPATH}/data/english_names_1.txt" "/wiki/Category:English_feminine_given_names" "/wiki/Category:English_masculine_given_names" &
# getFirstCategsStdWikiCatNames "${REPOPATH}/data/slavic_names_1.txt" "/wiki/Category:Slavic_masculine_given_names" "/wiki/Category:Slavic_feminine_given_names"

# getFirstCategsStdWikiCatNames "${REPOPATH}/data/turkish_names_1.txt" "/wiki/Category:Turkish_given_names"
getSecCategsStdWikiCatNames "${REPOPATH}/data/french_names_1.txt" "/wiki/Category:French_given_names"