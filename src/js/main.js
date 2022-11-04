import {syllable} from 'syllable'
import * as monaco from 'monaco-editor'
import * as cssgen from 'css-generator'


const conf = {
    snippetSuggestions: "none",
    quickSuggestions: false
}


var original_lyrics = monaco.editor.create(document.getElementById('container1'), {...conf, value: localStorage.getItem("source")});

var editor = monaco.editor.create(document.getElementById('container2'), {...conf, value: localStorage.getItem("parody")});


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

editor.onDidChangeCursorPosition((e) => {
    let line = editor.getPosition().lineNumber
    original_lyrics.setSelection(new monaco.Range(line, 0, line, 500))
})
original_lyrics.onDidChangeCursorPosition((e) => {
    let line = original_lyrics.getPosition().lineNumber
    editor.setSelection(new monaco.Range(line, 0, line, 500))
})