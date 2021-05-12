// FROM : https://github.com/ryelle/naming-language

import { shuffle, sortBy, sortedUniq } from 'lodash-es';

const FALLBACK_MAX = 500;

function choose(list, exponent = 1) {
    return list[Math.floor(Math.pow(Math.random(), exponent) * list.length)];
}

function randrange(lo, hi = 0) {
    return Math.floor(Math.random() * (hi - lo)) + lo;
}

function capitalize(word = '') {
    if (word.length < 2) {
        return word;
    }
    return word[0].toUpperCase() + word.slice(1);
}

export class Language {
    phonemes: { C: string; V: string; S: string; F: string; L: string; };
    structure: string;
    exponent: number;
    restricts: any[];
    cortho: {};
    vortho: {};
    noortho: boolean;
    nomorph: boolean;
    nowordpool: boolean;
    minsyll: number;
    maxsyll: number;
    morphemes: {};
    words: {};
    names: any[];
    joiner: string;
    maxchar: number;
    minchar: number;
    genitive: any;
    definite: any;

    constructor() {
        this.phonemes = {
            C: 'ptkmnls',
            V: 'aeiou',
            S: 's',
            F: 'mn',
            L: 'rl',
        };
        this.structure = 'CVC';
        this.exponent = 2;
        this.restricts = [];
        this.cortho = {};
        this.vortho = {};
        this.noortho = true;
        this.nomorph = true;
        this.nowordpool = true;
        this.minsyll = 1;
        this.maxsyll = 1;
        this.morphemes = {};
        this.words = {};
        this.names = [];
        this.joiner = ' ';
        this.maxchar = 12;
        this.minchar = 5;
    }

    makeOrthoLanguage() {
        this.noortho = false;
    }

    makeRandomLanguage() {
        this.noortho = false;
        this.nomorph = false;
        this.nowordpool = false;
        this.phonemes.C = shuffle(choose(consets, 1).C) as any;
        this.phonemes.V = shuffle(choose(vowsets, 1).V) as any;
        this.phonemes.L = shuffle(choose(lsets, 1).L) as any;
        this.phonemes.S = shuffle(choose(ssets, 1).S) as any;
        this.phonemes.F = shuffle(choose(fsets, 1).F) as any;
        this.structure = choose(syllstructs);
        this.restricts = ressets[2].res;
        this.cortho = choose(corthsets, 2).orth;
        this.vortho = choose(vorthsets, 2).orth;
        this.minsyll = randrange(1, 3);
        if (this.structure.length < 3) {
            this.minsyll++;
        }
        this.maxsyll = randrange(this.minsyll + 1, 7);
        this.joiner = choose(joinsets);
    }

    spell(syll) {
        if (this.noortho) {
            return syll;
        }
        let s = '';
        for (let i = 0; i < syll.length; i++) {
            const c = syll[i];
            s += this.cortho[c] || this.vortho[c] || defaultOrtho[c] || c;
        }
        return s;
    }

    makeSyllable() {
        var fallbackCnt = 0;
        while (true) {
            let syll = '';
            if (fallbackCnt++ > FALLBACK_MAX)
                return this.spell(syll);
            for (let i = 0; i < this.structure.length; i++) {
                const ptype = this.structure[i];
                if (this.structure[i + 1] == '?') {
                    i++;
                    if (Math.random() < 0.5) {
                        continue;
                    }
                }
                syll += choose(this.phonemes[ptype], this.exponent);
            }
            let bad = false;
            for (let i = 0; i < this.restricts.length; i++) {
                if (this.restricts[i].test(syll)) {
                    bad = true;
                    break;
                }
            }
            if (bad) {
                continue;
            }
            return this.spell(syll);
        }
    }

    getMorpheme(key = '') {
        if (this.nomorph) {
            return this.makeSyllable();
        }
        const list = this.morphemes[key] || [];
        let extras = 10;
        if (key) {
            extras = 1;
        }
        var fallbackCnt = 0;
        while (true) {
            const n = randrange(list.length + extras);
            if (list[n]) {
                return list[n];
            }
            const morph = this.makeSyllable();
            if (fallbackCnt++ > FALLBACK_MAX)
                return morph;
            let bad = false;
            for (const k in this.morphemes) {
                if (this.morphemes[k].includes(morph)) {
                    bad = true;
                    break;
                }
            }
            if (bad) {
                continue;
            }
            list.push(morph);
            this.morphemes[key] = list;
            return morph;
        }
    }

    makeWord(key) {
        const nsylls = parseInt(randrange(randrange(this.minsyll, this.maxsyll + 1)), 10);
        const keys = [];
        keys[nsylls] = key;
        let w = '';
        for (let i = 0; i < nsylls; i++) {
            w += this.getMorpheme(keys[i]);
        }
        return w;
    }

    getWord(key = '') {
        const ws = this.words[key] || [];
        let extras = 3;
        if (key) {
            extras = 2;
        }
        var fallbackCnt = 0;
        while (true) {
            const n = randrange(ws.length + extras);
            let w = ws[n];
            if (fallbackCnt++ > FALLBACK_MAX)
                return w;
            if (w) {
                return w;
            }
            w = this.makeWord(key);
            let bad = false;
            for (const k in this.words) {
                if (this.words[k].includes(w)) {
                    bad = true;
                    break;
                }
            }
            if (bad) {
                continue;
            }
            ws.push(w);
            this.words[key] = ws;
            return w;
        }
    }

    makeName(key) {
        this.genitive = this.genitive || this.getMorpheme('of');
        this.definite = this.definite || this.getMorpheme('the');

        var fallbackCnt = 0;
        while (true) {
            let name = null;
            if (fallbackCnt++ > FALLBACK_MAX)
                return name;
            if (Math.random() < 0.5) {
                name = capitalize(this.getWord(key));
            } else {
                const w1 = capitalize(this.getWord(Math.random() < 0.6 ? key : ''));
                const w2 = capitalize(this.getWord(Math.random() < 0.6 ? key : ''));
                if (w1 == w2) {
                    continue;
                }
                if ('region' === key || Math.random() > 0.5) {
                    name = [w1, w2].join(this.joiner);
                } else {
                    name = [w1, this.genitive, w2].join(this.joiner);
                }
            }
            if (Math.random() < 0.1) {
                name = capitalize([this.definite, name].join(this.joiner));
            }
            // Trim leading/trailing spaces
            name = name.replace(/^[\s-]+/, '').replace(/[\s-]+$/, '');

            if ((name.length < this.minchar) || (name.length > this.maxchar)) {
                continue;
            }
            let used = false;
            for (let i = 0; i < this.names.length; i++) {
                const name2 = this.names[i];
                if ((name.indexOf(name2) != -1) || (name2.indexOf(name) != -1)) {
                    used = true;
                    break;
                }
            }
            if (used) {
                continue;
            }
            this.names.push(name);
            return name;
        }
    }

    getAlphabet() {
        const partsList = [];
        for (let i = 0; i < this.structure.length; i++) {
            const part = this.structure[i];
            if ('undefined' !== typeof this.phonemes[part]) {
                partsList.push(...this.phonemes[part]);
            }
        }
        const list = sortBy(partsList);
        return this.spell(sortedUniq(list).join(' '));
    }
}


/* eslint-disable quote-props */

export const defaultOrtho = {
    'ʃ': 'sh',
    'ʒ': 'zh',
    'ʧ': 'ch',
    'ʤ': 'j',
    'ŋ': 'ng',
    'j': 'y',
    'x': 'kh',
    'ɣ': 'gh',
    'ʔ': '‘',
    A: 'á',
    E: 'é',
    I: 'í',
    O: 'ó',
    U: 'ú'
};

export const corthsets = [
    {
        name: 'Default',
        orth: {}
    },
    {
        name: 'Slavic',
        orth: {
            'ʃ': 'š',
            'ʒ': 'ž',
            'ʧ': 'č',
            'ʤ': 'ǧ',
            'j': 'j'
        }
    },
    {
        name: 'German',
        orth: {
            'ʃ': 'sch',
            'ʒ': 'zh',
            'ʧ': 'tsch',
            'ʤ': 'dz',
            'j': 'j',
            'x': 'ch'
        }
    },
    {
        name: 'French',
        orth: {
            'ʃ': 'ch',
            'ʒ': 'j',
            'ʧ': 'tch',
            'ʤ': 'dj',
            'x': 'kh'
        }
    },
    {
        name: 'Chinese (pinyin)',
        orth: {
            'ʃ': 'x',
            'ʧ': 'q',
            'ʤ': 'j',
        }
    },
    {
        name: 'Japanese (romanji)',
        orth: {
            'ʃ': 'sh',
        }
    }
];

export const vorthsets = [
    {
        name: 'Ácutes',
        orth: {}
    },
    {
        name: 'Ümlauts',
        orth: {
            A: 'ä',
            E: 'ë',
            I: 'ï',
            O: 'ö',
            U: 'ü'
        }
    },
    // {
    // 	name: 'Welsh',
    // 	orth: {
    // 		A: 'â',
    // 		E: 'ê',
    // 		I: 'y',
    // 		O: 'ô',
    // 		U: 'w'
    // 	}
    // },
    {
        name: 'Diphthongs',
        orth: {
            A: 'au',
            E: 'ei',
            I: 'ie',
            O: 'ou',
            U: 'oo'
        }
    },
    {
        name: 'Doubles',
        orth: {
            A: 'aa',
            E: 'ee',
            I: 'ii',
            O: 'oo',
            U: 'uu'
        }
    }
];

export const consets = [
    {
        name: 'Minimal',
        C: 'ptkmnls'
    },
    {
        name: 'English-ish',
        C: 'ptkbdgmnlrsʃzʒʧ'
    },
    {
        name: 'Pirahã (very simple)',
        C: 'ptkmnh'
    },
    {
        name: 'Hawaiian-ish',
        C: 'hklmnpwʔ'
    },
    {
        name: 'Greenlandic-ish',
        C: 'ptkqvsgrmnŋlj'
    },
    {
        name: 'Arabic-ish',
        C: 'tksʃdbqɣxmnlrwj'
    },
    {
        name: 'Arabic-lite',
        C: 'tkdgmnsʃ'
    },
    {
        name: 'English-lite',
        C: 'ptkbdgmnszʒʧhjw'
    },
    {
        name: 'Japanese-ish',
        C: 'ksʃtnhmyrw'
    },
];

export const ssets = [
    {
        name: 'Just s',
        S: 's'
    },
    {
        name: 's ʃ',
        S: 'sʃ'
    },
    {
        name: 's ʃ f',
        S: 'sʃf'
    }
];

export const lsets = [
    {
        name: 'r l',
        L: 'rl'
    },
    {
        name: 'Just r',
        L: 'r'
    },
    {
        name: 'Just l',
        L: 'l'
    },
    {
        name: 'w j',
        L: 'wj'
    },
    {
        name: 'r l w j',
        L: 'rlwj'
    }
];

export const fsets = [
    {
        name: 'm n',
        F: 'mn'
    },
    {
        name: 's k',
        F: 'sk'
    },
    {
        name: 'm n ŋ',
        F: 'mnŋ'
    },
    {
        name: 's ʃ z ʒ',
        F: 'sʃzʒ'
    },
    {
        name: 'Just n',
        F: 'n'
    },
];

export const vowsets = [
    {
        name: 'Standard 5-vowel',
        V: 'aeiou'
    },
    {
        name: '3-vowel a i u',
        V: 'aiu'
    },
    {
        name: 'Extra A E I',
        V: 'aeiouAEI'
    },
    {
        name: 'Extra U',
        V: 'aeiouU'
    },
    {
        name: '5-vowel a i u A I',
        V: 'aiuAI'
    },
    {
        name: '3-vowel e o u',
        V: 'eou'
    },
    {
        name: 'Extra A O U',
        V: 'aeiouAOU'
    }
];

export const syllstructs = [
    'CVC',
    'CVV?C',
    'CVVC?', 'CVC?', 'CV', 'VC', 'CVF', 'C?VC', 'CVF?',
    'CL?VC', 'CL?VF', 'S?CVC', 'S?CVF', 'S?CVC?',
    'C?VF', 'C?VC?', 'C?VF?', 'C?L?VC', 'VC',
    'CVL?C?', 'C?VL?C', 'C?VLC?'
];

export const ressets = [
    {
        name: 'None',
        res: []
    },
    {
        name: 'Double sounds',
        res: [/(.)\1/]
    },
    {
        name: 'Doubles and hard clusters',
        res: [/[sʃf][sʃ]/, /(ʃq)/, /(.)\1/, /(rl|lr|rw|wr|ww)/]
    }
];

export const joinsets = '   -';

