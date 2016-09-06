var CONFIG = {
    'E': {
        s: 'Standard E Station / The Wall Street', // station name
        c: [1, 1.2, 1.6, 2.0, 2.8, 3.6], // frame count
        f: [329.628, 440.000, 587.330, 783.991, 987.767, 1318.51], // freq
        n: ['E', 'A', 'D', 'G', 'B', 'E'], // note
        m: ['E', 'A', 'D', 'G', 'B', 'E2'] // mp3
    },
    'D': {
        s: 'Downtown D / Rocker Fellows Center',
        c: [1, 1.2, 1.6, 2.0, 2.8, 3.6],
        f: [293.665, 440.000, 587.330, 783.991, 987.767, 1318.51],
        n: ['D', 'A', 'D', 'G', 'B', 'E']
    },
    'B': {
        s: 'Bass Phish Park',
        c: [0.4, 0.5, 0.6, 0.7],
        f: [164.814, 220.000, 293.665, 391.995],
        n: ['E', 'A', 'D', 'G']
    },
    '1': {
        s: 'Siren Charms Hall / Drop A# Avenue',
        c: [1, 1.2, 1.6, 2.0, 2.8, 3.6],
        f: [233.082, 349.228, 466.164, 622.254, 783.991, 1046.50],
        n: ['A<span class="h">#</span>', 'F', 'A<span class="h">#</span>', 'D<span class="h">#</span>', 'G', 'C']
    },
    'G': {
        s: 'Banjo Blue Grass Garden',
        c: [2.2, 0.6, 0.8, 1.2, 1.8],
        f: [391.995, 146.832, 195.998, 246.942, 293.665],
        n: ['G', 'D', 'G', 'B', 'D']
    },
    'V': {
        s: 'Violin Bridge / Grand Fiddle Junction',
        c: [1, 1.6, 2.8, 3.6],
        f: [195.998, 293.665, 440.000, 659.255],
        n: ['G', 'D', 'A', 'E']
    },
    'U': {
        s: 'Ukulele Circle Beach-by-the-Sea',
        c: [1.4, 1, 1.2, 1.5],
        f: [391.995, 261.626, 329.628, 440.000],
        n: ['G', 'C', 'E', 'A']
    }
};
var KEY_OFFSET = 49;
var CHANNELS = 2;
var COLORS = {
    '1': 'g',
    'A': '',
    'A<span class="h">#</span>': 'r',
    'B': 'o',
    'C': '',
    'D': 'o',
    'D<span class="h">#</span>': 'r',
    'E': '',
    'F': 'o',
    'G': 'g',
    'V': 'r',
    'U': 'r',
}
var TUNERS = ['E', 'D', 'B', '1', 'G', 'V', 'U']; // E, D, bass, banjo, A#, violin, ukulele
var ct = CONFIG['E']; // current tuner

document.addEventListener('DOMContentLoaded', function(ev) {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var aud; // audio context
    var source;

    updateNotes();
    addTuners();
    addListeners(aud, source);

    var tuners = document.querySelectorAll('.t');
    tuners.forEach(function(tuner, i) {
        tuner.addEventListener('mousedown', function(e) {
            ct = CONFIG[TUNERS[i]];
            document.getElementById('s').innerText = ct.s;
            updateNotes();
        }, false);
    });
});

function updateNotes() {
    var notes = document.querySelectorAll('.n');
    var initialNotesLength = notes.length;
    for (var i = 0; i < Math.max(ct.f.length, initialNotesLength); i++) {
        var note;
        if (i >= initialNotesLength) {
            note = document.createElement('div');
        } else {
            note = notes[i];
            note.style.display = '';
        }
        if (i >= ct.f.length) {
            note.style.display = 'none';
        }
        note.setAttribute('class', 'n ' + COLORS[ct.n[i]]);
        note.innerHTML = ct.n[i];
        if (i >= initialNotesLength) {
            document.getElementById('ns').appendChild(note);
        }
    }
}

function addTuners() {
    var msg = document.createElement('h3');
    msg.innerText = 'Press above notes or keyboard number keys, starting at 1';
    document.body.appendChild(msg);

    var others = document.createElement('h3');
    others.innerText = 'Other tuners: ';
    document.body.appendChild(others);

    for (var i = 0; i < TUNERS.length; i++) {
        var tuner = document.createElement('div');
        tuner.setAttribute('class', 't ' + COLORS[TUNERS[i]]);
        tuner.innerText = TUNERS[i];
        others.appendChild(tuner);
    }
}

function addListeners(aud, source) {
    var notes = document.querySelectorAll('.n');
    document.onkeydown = function(e) {
        var keyIndex = e.keyCode - KEY_OFFSET;
        if (keyIndex > -1 && keyIndex < ct.f.length) {
            clearAudio(source, aud);
            try {
                aud = playSyntheticNote(source, keyIndex);
            } catch(e) {
                playFallbackNote(e);
            }
            notes[keyIndex].classList.add('ac');
        };
    };

    document.onkeyup = function(e) {
        var keyIndex = e.keyCode - KEY_OFFSET;
        if (keyIndex > -1 && keyIndex < ct.f.length) {
            notes[keyIndex].classList.remove('ac');
        }
    };

    notes.forEach(function(note, i) {
        note.addEventListener('mousedown', function(e) {
            clearAudio(source, aud);
            try {
                aud = playSyntheticNote(source, i);
            } catch(e) {
                playFallbackNote(e);
            }
        }, false);
    });
}

function clearAudio(source, aud) {
    if (source && source !== null) {
        source.stop();
        source = null;
    }
    if (aud && aud !== null && aud.state !== 'closed') {
        aud.close().then(function() {
            aud = null;
        });
    }
}

function playSyntheticNote(source, keyIndex) {
    aud = new AudioContext();
    var frameCount = ct.c[keyIndex] * 30000;
    var buffer = aud.createBuffer(CHANNELS, frameCount, ct.f[keyIndex] * 90);

    createSource(frameCount, buffer, function(s) {
        return s;
    });
    createSource(frameCount, buffer, function(s) {
        return Math.floor(s) / 2;
    });

    return aud;
}

function createSource(frameCount, buffer, editor) {
    source = aud.createBufferSource();
    for (var channel = 0; channel < CHANNELS; channel++) {
        var bufferData = buffer.getChannelData(channel);
        for (var i = 0; i < frameCount; i++) {
            var fadeIn = 0;
            if (frameCount > frameCount / 10) {
                fadeIn = i / frameCount;
            }
            var fadeOut = (frameCount - i) / frameCount;
            bufferData[i] = editor(Math.sin(i * Math.PI/90)) * fadeIn * fadeOut;
        }
    }
    source.buffer = buffer;
    source.connect(aud.destination);
    source.start(0);
}

function playFallbackNote(e) {
    console.error(e);
    var player = document.getElementById('p');
    if (ct.m) {
        player.setAttribute('src', ct.mp3[keyIndex] + '.mp3');
    }
}
