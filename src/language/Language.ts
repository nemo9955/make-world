import { customComparator } from "../utils/Random";


import { last } from "lodash-es"

const eng1 = require("../../data/lang-english-v1_1.json")
const eng2 = require("../../data/lang-english-v1_2.json")


// for (const key1 in eng1) {
//     for (const key2 in eng1[key1]) {
//         if (isFinite(eng1[key1][key2]))
//             eng1[key1][key2] = Math.ceil(eng1[key1][key2] * 1000)
//     }
// }
// this.textOut.html(JSON.stringify(eng1))
// console.log("eng1", eng1);


export const VOWEL = "aeiouăîâ"
export const CONSONS = "bcdfghjklmnpqrsșțtvwxzy"

export class Language {

    totalWeight = new Map<string, number>();
    sortedWeight = new Map<string, [number, string][]>();

    constructor() {

    }

    usePredefined(name: string) {
        switch (name) {
            case "eng1": this.useCustomRaw(eng1); break;
            case "eng2": this.useCustomRaw(eng2); break;
        }
    }

    useCustomRaw(langJson: any) {
        for (const key1 in langJson) {
            if (key1.startsWith("__")) continue;
            this.totalWeight.set(key1, 0);
            var swarr = [];
            for (const key2 in langJson[key1]) {
                const lnum = langJson[key1][key2];
                if (isNaN(lnum)) continue;
                var incr = this.totalWeight.get(key1) + lnum;
                this.totalWeight.set(key1, incr);
                swarr.push([lnum, key2])
            }
            swarr.sort(customComparator(0));
            this.sortedWeight.set(key1, swarr);
        }
    }

    getWord({
        minLen = 5,
        maxLen = 10,
        maxSame = 2,
        maxConsons = 3,
        maxSameConsons = 1,
        maxVowels = 2,
    } = {}) {
        var word = "";
        var lastPick = " ";

        var attempts = 500;
        while (attempts-- > 0) {

            if (word.length >= maxLen) return word;

            const lastTotal = this.totalWeight.get(lastPick)
            const lastPicks = this.sortedWeight.get(lastPick)

            var pickRand = Math.random() * lastTotal;
            var pickCnt = 0;
            var pickCharr: string = " ";

            for (let index = 0; index < lastPicks.length; index++) {
                const [weigth, charr] = lastPicks[index];
                pickCnt += weigth;
                if (pickCnt >= pickRand) {
                    pickCharr = charr;
                    break;
                }
            }


            if (pickCharr === " ") {
                if ((word.length + pickCharr.length) >= minLen)
                    return word;
            }
            else {

                var isValid = true;
                const testWord = word + pickCharr;

                var cntSame = 0, cntCheck = last(testWord), cntConsons = 0, cntVowels = 0;
                for (var index = testWord.length - 1; index >= 0; index--) {
                    const char = testWord[index];
                    if (char == cntCheck) cntSame++;
                    else { cntCheck = char; cntSame = 1; }

                    if (VOWEL.includes(char)) cntVowels++;
                    const isCons = CONSONS.includes(char);
                    if (isCons) cntConsons++;

                    if (isCons && cntSame > maxSameConsons) { isValid = false; break; }
                    if (cntSame > maxSame) { isValid = false; break; }
                    if (cntVowels > maxConsons) { isValid = false; break; }
                    if (cntConsons > maxVowels) { isValid = false; break; }
                }

                if (isValid) {
                    word = testWord;
                    lastPick = last(pickCharr);
                }
            }
        }
        return word;
    }

}