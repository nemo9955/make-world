



import { generateWords } from "../libs/wordGen";
import { Language as LangRy } from "../libs/naming-language-ryelle";
import { getWord, getName, makeBasicLanguage, makeOrthoLanguage, makeRandomLanguage } from "../libs/naming-language-mewo2";
import { zip } from 'lodash-es';

import * as d3 from "d3"
import { Language } from "../language/Language";


const listFiles = [
    "romaninan_names_1.txt",
    "russian_1.txt",
    "slavic_names_1.txt",
    "french_1.txt",
    "french_names_1.txt",
    "japanese_1.txt",
    "japanese_names_1.txt",
    "latin_1.txt",
    "Shakespeare_1.txt",
    "organs_1.txt",
    "turkish_names_1.txt",
    "lorem_ipsum.txt",
    "hillbilly_names_1.txt",
    "baltagul.txt",
    "luceafarul.txt",
    "russian_2.txt",
]

export class MainLanguageManager {
    textIn: d3.Selection<HTMLTextAreaElement, unknown, HTMLElement, any>;
    textProc: d3.Selection<HTMLTextAreaElement, unknown, HTMLElement, any>;
    textOut: d3.Selection<HTMLTextAreaElement, unknown, HTMLElement, any>;


    weights = {};
    langWords: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;




    wordsToGenerate = 100;
    increaseEndWeight = 4;

    langParams = {
        minLen: 5,
        maxLen: 10,
        maxSame: 2,
        maxConsons: 3,
        maxSameConsons: 1,
        maxSameVowels: 1,
        maxVowels: 2,
    };


    constructor() {


    }

    setMainText(text: string) {
        // console.log("text", text);
        this.textIn.node().value = text;
        // this.textIn.node().value = longTextRus
        // this.textIn.node().value = longTestBaltagul
        this.extractWeights();

    }

    readFileButton(file_: string) {
        // console.log("event.target.value", event.target.value);
        var path = `../data/${file_}`
        console.log("path", path);
        fetch(path)
            .then(response => response.text())
            .then(text => {
                // console.log("text", text);
                this.setMainText(text)
            })


        // fetch('../../data/romaninan_names_1.txt')
        //     .then(response => response.text())
        //     .then(text => console.log(text))

    }

    init() {
        this.makeGui();
        this.readFileButton(listFiles[0]);
        // this.setMainText(randomText);
    }


    makeGui() {
        const body = d3.select("body");

        // body.append("input")
        //     .attr("type", "button")
        //     .attr("class", "btn btn-primary")
        //     .attr("value", "randomText")
        //     .on("click", () => this.setMainText(randomText))

        for (const iterator of listFiles) {
            body.append("input")
                .attr("type", "button")
                .attr("class", "btn btn-primary")
                .attr("value", iterator)
                .on("click", event => { this.readFileButton(event.target.value) })
        }

        this.textIn = body.append("textarea")
            .style("width", "98%")
            .style("height", "200px")

        body.append("input")
            .attr("type", "button")
            .attr("class", "btn btn-primary")
            .attr("value", "Gen lang weights")
            .on("click", this.extractWeights.bind(this))

        body.append("label").html("increaseEndWeight").append("input").attr("type", "number")
            .attr("value", this.increaseEndWeight).style("width", "50px")
            .on("change", eve => { this.increaseEndWeight = eve.target.valueAsNumber; this.extractWeights(); })

        this.textOut = body.append("textarea")
            .style("width", "98%")
            .style("height", "100px")
        // .html("Gen lang weights")

        this.textProc = body.append("textarea")
            .style("width", "98%")
            .style("height", "100px")
        // .html("Gen lang weights")


        body.append("label").html("minLen").append("input").attr("type", "number")
            .attr("value", this.langParams.minLen).style("width", "50px")
            .on("change", eve => { this.langParams.minLen = eve.target.valueAsNumber; this.generateText(); })

        body.append("label").html("maxLen").append("input").attr("type", "number")
            .attr("value", this.langParams.maxLen).style("width", "50px")
            .on("change", eve => { this.langParams.maxLen = eve.target.valueAsNumber; this.generateText(); })

        body.append("label").html("maxSame").append("input").attr("type", "number")
            .attr("value", this.langParams.maxSame).style("width", "50px")
            .on("change", eve => { this.langParams.maxSame = eve.target.valueAsNumber; this.generateText(); })

        body.append("label").html("maxConsons").append("input").attr("type", "number")
            .attr("value", this.langParams.maxConsons).style("width", "50px")
            .on("change", eve => { this.langParams.maxConsons = eve.target.valueAsNumber; this.generateText(); })

        body.append("label").html("maxSameConsons").append("input").attr("type", "number")
            .attr("value", this.langParams.maxSameConsons).style("width", "50px")
            .on("change", eve => { this.langParams.maxSameConsons = eve.target.valueAsNumber; this.generateText(); })

        body.append("label").html("maxSameVowels").append("input").attr("type", "number")
            .attr("value", this.langParams.maxSameVowels).style("width", "50px")
            .on("change", eve => { this.langParams.maxSameVowels = eve.target.valueAsNumber; this.generateText(); })

        body.append("label").html("maxVowels").append("input").attr("type", "number")
            .attr("value", this.langParams.maxVowels).style("width", "50px")
            .on("change", eve => { this.langParams.maxVowels = eve.target.valueAsNumber; this.generateText(); })

        body.append("br")

        body.append("input")
            .attr("type", "button")
            .attr("class", "btn btn-primary")
            .attr("value", "Gen text")
            .on("click", this.generateText.bind(this))

        body.append("label").html("wordsToGenerate").append("input").attr("type", "number")
            .attr("value", this.wordsToGenerate).attr("step", 10).style("width", "50px")
            .on("change", eve => { this.wordsToGenerate = eve.target.valueAsNumber; this.generateText(); })


        this.langWords = body.append("p")
            .attr("class", "text-start")
    }


    addWeight(from: string, to: string) {
        if (this.weights[from] === undefined)
            this.weights[from] = {}
        const fromw = this.weights[from];
        if (fromw[to] === undefined)
            fromw[to] = 0;
        if (to === " ")
            fromw[to] += this.increaseEndWeight;
        else
            fromw[to]++;
    }

    extractWeights() {
        this.weights = {};
        var text = this.textIn.node().value;
        // text = text.toLowerCase();
        // text = text.replace(/[\s\d]/gi, " ");
        // text = text.replace(/[\W\s\d]/gi, " ");
        text = text.replace(/[\…\,\.\(\)\[\]\!\?\»\”\„\"\'\`\;\:\—\-\d\s]/gi, " ");
        // text = text.replace(/[\…\,\.\(\)\[\]\!\?\»\”\„\"\'\`\’\;\:\—\-\d\s]/gi, " ");
        text = text.replace(/ +/gi, " ");
        // var words = text.split(" ");
        var words = new Set(text.split(" "));
        console.log("words", words);
        for (const word of words) {
            if (word.length <= 2) continue;
            for (let index = 0; index < word.length; index++) {
                const leter = word[index];
                if (index == 0)
                    this.addWeight(" ", leter);
                if (index + 1 == word.length)
                    this.addWeight(leter, " ");
                if (index + 1 < word.length)
                    this.addWeight(leter, word[index + 1]);
                // if (index + 2 < word.length)
                //     this.addWeight(leter, word[index + 1] + word[index + 2]);
                // if (index + 3 < word.length)
                //     this.addWeight(leter, word[index + 1] + word[index + 2] + word[index + 3]);
            }
        }

        // for (const from in this.weights) {
        //     for (const to in this.weights[from]) {
        //         if (this.weights[from][to] <= 2)
        //             delete this.weights[from][to];
        //     }
        // }

        console.log("this.weights", this.weights);
        // this.textOut.text(JSON.stringify(this.weights))
        this.textOut.node().value = JSON.stringify(this.weights)
        // this.textOut.html(this.weights)
        this.textOut.node().value = this.textOut.node().value.replace(/(\".+\"\:\{)/gi, "\n$1")
        this.textOut.node().value = this.textOut.node().value.split('},"').join('},\n\n"')
        this.textOut.node().value = this.textOut.node().value.split('":{').join('":\n{')

        this.textProc.node().value = [...words].join(" ")

        this.generateText();

    }


    generateText() {
        const lang = new Language();
        lang.useCustomRaw(JSON.parse(this.textOut.node().value));

        const langWords = [];
        // console.log("this.langParams", this.langParams);

        for (let index = 0; index < this.wordsToGenerate; index++)
            langWords.push(lang.getWord(this.langParams))
        // console.log("langWords", langWords);

        this.langWords.html(langWords.join("   "))
    }


    init2() {

        const numWords = 10
        const lkey = "fantastic"
        const lang = new LangRy();
        lang.makeRandomLanguage();
        // lang.makeOrthoLanguage();

        const lang2 = makeRandomLanguage()
        // const lang2 = makeOrthoLanguage()
        // const lang2 = makeBasicLanguage()

        const l1word = generateWords(numWords);
        const l2name = []; const l2word = []; const l3name = []; const l3word = [];
        for (let index = 0; index < numWords; index++) {
            l2name.push(lang.makeName(lkey)); l2word.push(lang.makeWord(lkey),);
            l3name.push(getName(lang2, lkey)); l3word.push(getWord(lang2, lkey));
        }
        const tabLang = zip(l1word, l2name, l2word, l3name, l3word)
        tabLang.unshift([null, lkey, lkey, lkey, lkey])
        tabLang.unshift(["l1word", "l2name", "l2word", "l3name", "l3word"])
        tabLang.push(["l1word", "l2name", "l2word", "l3name", "l3word"])
        console.table(tabLang);
        // console.table(tabLang, ["l1word", "l2name", "l2word", "l3name", "l3word"]);

    }

}

// const ronames = require("../../data/romaninan_names_1.txt")

// http://www.russianlessons.net/articles/mynameismasha.php


