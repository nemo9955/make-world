#!/usr/bin/env bash


init_colors() {
	txtblk='\e[0;30m' # Black - Regular
	txtred='\e[0;31m' # Red
	txtgrn='\e[0;32m' # Green
	txtylw='\e[0;33m' # Yellow
	txtblu='\e[0;34m' # Blue
	txtpur='\e[0;35m' # Purple
	txtcyn='\e[0;36m' # Cyan
	txtwht='\e[0;37m' # White
	bldblk='\e[1;30m' # Black - Bold
	bldred='\e[1;31m' # Red
	bldgrn='\e[1;32m' # Green
	bldylw='\e[1;33m' # Yellow
	bldblu='\e[1;34m' # Blue
	bldpur='\e[1;35m' # Purple
	bldcyn='\e[1;36m' # Cyan
	bldwht='\e[1;37m' # White
	unkblk='\e[4;30m' # Black - Underline
	undred='\e[4;31m' # Red
	undgrn='\e[4;32m' # Green
	undylw='\e[4;33m' # Yellow
	undblu='\e[4;34m' # Blue
	undpur='\e[4;35m' # Purple
	undcyn='\e[4;36m' # Cyan
	undwht='\e[4;37m' # White
	bakblk='\e[40m'   # Black - Background
	bakred='\e[41m'   # Red
	bakgrn='\e[42m'   # Green
	bakylw='\e[43m'   # Yellow
	bakblu='\e[44m'   # Blue
	bakpur='\e[45m'   # Purple
	bakcyn='\e[46m'   # Cyan
	bakwht='\e[47m'   # White
	txtrst='\e[0m'    # Text Reset

    bldreg='\e[0m\e[1m' # Regular - Bold
    undreg='\e[0m\e[4m' # Regular - Underline
}

init_colors




function print_runq(){
    local full_cmd_="$1" ; shift
    local param_
    for param_ in "$@" ; do
        full_cmd_="${full_cmd_} \"${param_}\""
    done
	echo -e "${bldblk}[ RUN ] >>>${txtrst} ${full_cmd_} " >&2
}

function print_run(){
	echo -e "${bldblk}[ RUN ] >>>${txtrst} ${*} " >&2
}

function minfo(){
	echo -e "${bldblk}[ INF ] >>>${txtrst} ${*} " >&2
}

function myay(){
	echo -e "${bldgrn}[ YAY ] >>>${bldreg} ${*} ${txtrst}" >&2
}

function mhmm(){
	echo -e "${bldcyn}[ HMM ] >>>${bldreg} ${*} ${txtrst}" >&2
}

function mdebug(){
	if [ "${options['debug']}" ]; then
		echo -e "[ DBG ] >>> ${*} " >&2
	fi
}

function mwarn(){
	warn "$@"
}

function merror(){
	echo -e "${bldred}[ ERR ] >>>${txtred} ${*} ${txtrst}" >&2
}


function evars(){
    # Accepts some variable names and prints them and the values on a line

    for the_variable in $@ ; do

        local variable_ref
        eval variable_ref="\${${the_variable}[*]}" # get the BEST CASE (array) value behind the name of the variable

        if [[ -z "${variable_ref}" ]]; then
            # this means it is an empty string or could not find that variable
            echo -e "${undred}[ VAR ]${txtrst} >>> ${the_variable}=\t ${txtrst}" >&2

        elif [[ "$(declare -p ${the_variable} )" =~ "declare -a" ]]; then
            # https://stackoverflow.com/questions/14525296/bash-check-if-variable-is-array

            eval variable_ref=(\${${the_variable}[*]}) # get the actual array value behind the name of the variable

            echo -e "${undylw}[ VAR ]${txtrst} >>> ${the_variable}=\t ${variable_ref[*]} ${txtrst}" >&2
        else
            eval variable_ref=\${${the_variable}} # get the actual string value behind the name of the variable

            echo -e "${undgrn}[ VAR ]${txtrst} >>> ${the_variable}=\t ${variable_ref} ${txtrst}" >&2
        fi

        unset variable_ref

    done

}


function runq(){
    print_runq "${@}"
    if "${@}" ; then
        return 0
    else
        local the_ec=$?
        warn "Failed, exit code: ${the_ec}"
        return ${the_ec}
    fi
}

function run(){
    print_run "${@}"
    if "${@}" ; then
        return 0
    else
        local the_ec=$?
        warn "Failed, exit code: ${the_ec}"
        return ${the_ec}
    fi
}
