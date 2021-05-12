



import { generateWords } from "../libs/wordGen";
import { Language as LangRy } from "../libs/naming-language-ryelle";
import { getWord, getName, makeBasicLanguage, makeOrthoLanguage, makeRandomLanguage } from "../libs/naming-language-mewo2";
import { zip } from 'lodash-es';

import * as d3 from "d3"
import { Language } from "../language/Language";


const listFiles = [
    // "lang-english-v1_1.json",
    // "lang-english-v1_2.json",
    "baltagul.txt",
    "hillbilly_names_1.txt",
    "romaninan_names_1.txt",
]

export class MainLanguageManager {
    textIn: d3.Selection<HTMLTextAreaElement, unknown, HTMLElement, any>;
    textOut: d3.Selection<HTMLTextAreaElement, unknown, HTMLElement, any>;


    weights = {};
    langWords: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;

    constructor() {


    }

    setMainText(text: string) {
        // console.log("text", text);
        this.textIn.node().value = text;
        // this.textIn.node().value = longTextRus
        // this.textIn.node().value = longTestBaltagul
        this.extractWeights();

    }

    readFileButton(event: any) {
        // console.log("event.target.value", event.target.value);
        var path = `../../data/${event.target.value}`
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
        this.setMainText(randomText);
    }

    makeGui() {
        const body = d3.select("body");

        body.append("input")
            .attr("type", "button")
            .attr("class", "btn btn-primary")
            .attr("value", "randomText")
            .on("click", () => this.setMainText(randomText))
        for (const iterator of listFiles) {
            body.append("input")
                .attr("type", "button")
                .attr("class", "btn btn-primary")
                .attr("value", iterator)
                .on("click", this.readFileButton.bind(this))
        }

        this.textIn = body.append("textarea")
            .style("width", "98%")
            .style("height", "200px")

        this.textOut = body.append("textarea")
            .style("width", "98%")
            .style("height", "200px")

        body.append("input")
            .attr("type", "button")
            .attr("class", "btn btn-primary")
            .attr("value", "Gen lang weights")
            .on("click", this.extractWeights.bind(this))
        // .html("Gen lang weights")

        this.langWords = body.append("p")
            .attr("class", "text-start")
    }

    addWeight(from: string, to: string) {
        if (this.weights[from] === undefined)
            this.weights[from] = {}
        const fromw = this.weights[from];
        if (fromw[to] === undefined)
            fromw[to] = 0;
        fromw[to]++;
    }

    extractWeights() {
        this.weights = {};
        var text = this.textIn.node().value;
        text = text.toLowerCase();
        // text = text.replace(/[\s\d]/gi, " ");
        // text = text.replace(/[\W\s\d]/gi, " ");
        text = text.replace(/[\,\.\(\)\[\]\!\?\»\”\„\"\'\`\’\;\—\-\d\s]/gi, " ");
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
                if (index + 1 < word.length)
                    this.addWeight(leter, word[index + 1]);
                if (index + 2 < word.length)
                    this.addWeight(leter, word[index + 1] + word[index + 2]);
                if (index + 3 < word.length)
                    this.addWeight(leter, word[index + 1] + word[index + 2] + word[index + 3]);
                if (index + 1 == word.length)
                    this.addWeight(leter, " ");
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


        const lang = new Language();
        lang.useCustomRaw(this.weights);

        const langWords = []

        for (let index = 0; index < 100; index++)
            langWords.push(lang.getWord())

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

const randomText = "Mouth Teeth Tongue Salivary glands Parotid glands Submandibular glands Sublingual glands Pharynx Esophagus Stomach Small intestine Duodenum Jejunum Ileum Large intestine Cecum Ascending colon Transverse colon Descending colon Sigmoid colon Rectum Liver Gallbladder Mesentery Pancreas Anal canal Nasal cavity Pharynx Larynx Trachea Bronchi Bronchioles and smaller air passages Lungs Muscles of breathing Kidneys Ureter Bladder Urethra Internal reproductive organs Ovaries Fallopian tubes Uterus Cervix Vagina External reproductive organs Vulva Clitoris Placenta Internal reproductive organs Testes Epididymis Vas deferens Seminal vesicles Prostate Bulbourethral glands External reproductive organs Penis Scrotum Pituitary gland Pineal gland Thyroid gland Parathyroid glands Adrenal glands Pancreas Heart Patent Foramen Ovale Arteries Veins Capillaries Lymphatic vessel Lymph node Bone marrow Thymus Spleen Gut-associated lymphoid tissue Tonsils Interstitium Brain Cerebrum Cerebral hemispheres Diencephalon The brainstem Midbrain Pons Medulla oblongata Cerebellum The spinal cord The ventricular system Choroid plexus Nerves Cranial nerves Spinal nerves Ganglia Enteric nervous system Skin Subcutaneous tissue"

