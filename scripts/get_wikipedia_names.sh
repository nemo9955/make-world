




SCRIPTSPATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
REPOPATH="$(realpath "${SCRIPTSPATH}/..")"

source ${SCRIPTSPATH}/common.sh


allLinks=(
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


echo "" > "${REPOPATH}/data/romaninan_names_1.txt"

function getAllNames(){
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

for link in ${allLinks[*]};do
    evars link
    tmpWords=( $(getAllNames ${link} ) )
    echo ${tmpWords[*]} | sort -u >> "${REPOPATH}/data/romaninan_names_1.txt"
done

echo -e "\n\n" >> "${REPOPATH}/data/romaninan_names_1.txt"
getAllNames "https://ro.wikipedia.org/wiki/List%C4%83_de_prenume_rom%C3%A2ne%C8%99ti" >> "${REPOPATH}/data/romaninan_names_1.txt"



# function recursiveGetAllNames(){
#     local root="$1"
#     local link="$1$2"
#     local page="$(run curl -s "${link}")"

#     local next="$(echo "${page}" | grep "next page</a>" | grep -oP "<a href=\"\S\S\S*\"" | head -1  )"
#     next="${next//<a href=}"
#     next="${next// }"
#     next="${next//\"}"
#     evars next
#     recursiveGetAllNames "$1" "${next}"
# }

# recursiveGetAllNames "https://en.wikipedia.org" "/wiki/Category:Nicknames"
# https://en.wikipedia.org/wiki/Category:Nicknames&action=query&list=categorymembers&cmlimit=500&cmprop=title
# https://en.wikipedia.org/wiki/Category:Nicknames
# http://en.wikipedia.org/w/api.php?cmtitle=Category:Nicknames&action=query&list=categorymembers&cmlimit=500&cmprop=title




