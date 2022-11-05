import {syllable} from 'syllable'
import * as monaco from 'monaco-editor'
import * as cssgen from 'css-generator'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { MonacoBinding } from 'y-monaco'

const ydocument = new Y.Doc()
ydocument.getText(ydocument.clientID.toString()).insert(0, window.prompt("Enter name"))

const provider = new WebrtcProvider("thebestparodyeditor", ydocument, {signaling:  ['wss://signaling.yjs.dev'] })
const type = ydocument.getText('monaco')
const type2 = ydocument.getText('orig')

const conf = {
    snippetSuggestions: "none",
    quickSuggestions: false
}

function hashCode(str) { // java String#hashCode
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
} 

function intToRGB(i){
    var c = (i & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    return "00000".substring(0, 6 - c.length) + c;
}



var editor = monaco.editor.create(document.getElementById('container2'), {...conf, /*value: localStorage.getItem("parody")*/});

const monacoBinding = new MonacoBinding(type, editor.getModel(), new Set([editor]), provider.awareness)

provider.awareness.on("update", () => {
    let css = cssgen.create()
    provider.awareness.states.forEach((value, key) => {
        let col = intToRGB(hashCode(key.toString()))
        css.addRule(`.yRemoteSelection-${key}`, {
            "z-index": 9999,
            "background-color": `#${col}7F`
        })
        css.addRule(`.yRemoteSelectionHead-${key}`, {
            "z-index": 9999,
            position: "absolute",
            "border-left": `#${col} solid 2px`,
            "border-top": `#${col} solid 2px`,
            "border-bottom": `#${col} solid 2px`,
            height: "100%",
            "box-sizing": "border-box"
        })
        css.addRule(`.yRemoteSelectionHead-${key}::after`, {
            position: "absolute",
            "border": `3px solid #${col}`,
            "border-radius": "4px",
            "color": "white",
            "background-color": `#${col}E6`,
            "top": "15px",
            content: "\"" + ydocument.getText(key.toString()).toString() + "\"",
            display: "block"
        })
    })
    document.getElementById("gencursor").innerHTML = css.getOutput()

})

var original_lyrics = monaco.editor.create(document.getElementById('container1'), {...conf, /*value: localStorage.getItem("source")*/});
const monacoBinding2 = new MonacoBinding(type2, original_lyrics.getModel(), new Set([original_lyrics]), provider.awareness)

if (provider.awareness.states.size < 2) {
    original_lyrics.setValue(localStorage.getItem("source"))
    editor.setValue(localStorage.getItem("parody"))
}

var decorations = editor.createDecorationsCollection([])

function updateSyllables(e) {
    localStorage.setItem("source", original_lyrics.getValue())
    localStorage.setItem("parody", editor.getValue())
    let lineSylCounts = {}
    let lineSylLength = 0
    original_lyrics.getValue().split(/\r?\n/).forEach((line, idx) => {
        line = line.replace(/\([^()]*\)/g, '')
        lineSylCounts[idx+1] = syllable(line)
        lineSylLength++
    })
    let newDecs = []
    let l2s = new Map()
    editor.getValue().split(/\r?\n/).forEach((line, idx) =>  {
        idx = idx + 1
        line = line.replace(/\([^()]*\)/g, '')
        if (idx > lineSylLength) {
            return
        }
        newDecs.push({range: new monaco.Range(idx, 0, idx, 1), options: {afterContentClassName: "afterLine" + idx, isWholeLine: true}})
        let sylDiff = syllable(line) - lineSylCounts[idx]
        l2s.set(idx, {content: '"' + (sylDiff > 0 ? "+" : "") + sylDiff + '"', color: sylDiff == 0 ? "green" : "red", "margin-left": "2em"})
    })
    decorations.set(newDecs)
    genCss(l2s)
}

function genCss(m) {
    let css = cssgen.create()
    m.forEach((value, key) => {
        css.addRule(".afterLine" + key + "::after", value)
    })
    document.getElementById("gencss").innerHTML = css.getOutput()
}

original_lyrics.onDidChangeModelContent(updateSyllables)
editor.onDidChangeModelContent(updateSyllables)
