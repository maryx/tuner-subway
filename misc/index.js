window.AudioContext = window.AudioContext || window.webkitAudioContext;
var CONFIG = {
    'E': {
        s: 'Standard E Station / The Wall Street', // station name
        f: [82.4069, 110.000, 146.832, 195.998, 246.942, 329.628], // freq
        n: ['E', 'A', 'D', 'G', 'B', 'E'], // note
        m: ['E', 'A', 'D', 'G', 'B', 'E2'] // mp3
    },
    'D': {
        s: 'Downtown D / Rocker Fellows Center',
        f: [73.4162, 110.000, 146.832, 195.998, 246.942, 329.628],
        n: ['D', 'A', 'D', 'G', 'B', 'E']
    },
    'B': {
        s: 'Bass Phish Park',
        f: [41.2034, 55.0000, 73.4162, 97.9989],
        n: ['E', 'A', 'D', 'G']
    },
    '1': {
        s: 'Siren Charms Hall / Drop A# Avenue',
        f: [58.2705, 87.3071, 116.541, 146.832, 195.998, 261.626],
        n: ['A<span class="h">#</span>', 'F', 'A<span class="h">#</span>', 'D<span class="h">#</span>', 'G', 'C']
    },
    'G': {
        s: 'Banjo Blue Grass Garden',
        f: [391.995, 146.832, 195.998, 246.942, 293.665],
        n: ['G', 'D', 'G', 'B', 'D']
    },
    'V': {
        s: 'Violin Bridge / Grand Fiddle Junction',
        f: [195.998, 293.665, 440.000, 659.255],
        n: ['G', 'D', 'A', 'E']
    },
    'U': {
        s: 'Ukulele Circle Beach-by-the-Sea',
        f: [391.995, 261.626, 329.628, 440.000],
        n: ['G', 'C', 'E', 'A']
    }
};
var KEY_OFFSET = 49;
var CHANNELS = 2;
var SAMPLE_RATE = 44100;
var FRAME_COUNT = 1.5 * SAMPLE_RATE; // length of sound = time * SAMPLE_RATE.
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
var aud = new AudioContext();
var src1 = null;
var src2 = null;

document.addEventListener('DOMContentLoaded', function(ev) {
    updateNotes();
    addTuners();
    addListeners();

    var tuners = document.querySelectorAll('.t');
    [].forEach.call(tuners, function(tuner, i) { // can't use tuners.forEach because Safari is being weird
        tuner.addEventListener('mousedown', function(e) {
            ct = CONFIG[tuner.innerText];
            document.getElementById('s').innerText = ct.s;
            updateNotes();
        });
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

function addListeners() {
    document.onkeydown = function(e) {
        var keyIndex = e.keyCode - KEY_OFFSET;
        if (keyIndex > -1 && keyIndex < ct.f.length) {
            notes[keyIndex].classList.add('ac');
        };
    };
    document.onkeyup = function(e) {
        var keyIndex = e.keyCode - KEY_OFFSET;
        if (keyIndex > -1 && keyIndex < ct.f.length) {
            notes[keyIndex].classList.remove('ac');
            clearAudio();
            try {
                playSyntheticNote(keyIndex);
            } catch(e) {
                playFallbackNote(e, keyIndex);
            }
        }
    };
    var notes = document.querySelectorAll('.n');
    [].forEach.call(notes, function(note, i) { // can't use notes.forEach because safari
        note.addEventListener('mouseup', function(e) {
            clearAudio();
            try {
                playSyntheticNote(i);
            } catch(e) {
                playFallbackNote(e, i);
            }
        });
    });
}

function clearAudio() {
    if (src1 && src1 !== null) {
        src1.stop();
        src1 = null;
    }
    if (src2 && src2 !== null) {
        src2.stop();
        src2 = null;
    }
    if (aud && aud !== null && aud.state !== 'closed') {
        aud.close(); // FYI this returns a promise
    }
}

function playSyntheticNote(keyIndex) {
    aud = new AudioContext();
    var buffer = aud.createBuffer(CHANNELS, FRAME_COUNT, SAMPLE_RATE);
    src1 = createSource(buffer, keyIndex, 10000, function(s) {
        return s;
    });
    if (ct.s.startsWith('S') || ct.s.startsWith('D') || ct.s.endsWith('k')) {
        src2 = createSource(buffer, keyIndex, -5000, function(s) {
            return Math.floor(s * 5000) / 2500;
        });
    }
}

function playFallbackNote(e, i) {
    console.error(e);
    var player = document.getElementById('p');
    if (ct.m) {
        player.setAttribute('src', ct.m[i] + '.mp3');
    }
}

function createSource(buffer, keyIndex, gain, editor) {
    var src = aud.createBufferSource();
    for (var channel = 0; channel < CHANNELS; channel++) {
        var frames = buffer.getChannelData(channel);
        for (var i = 0; i < FRAME_COUNT; i++) {
            // sound * fadeIn * fadeOut
            frames[i] = editor(Math.sin(i * 2 * Math.PI * ct.f[keyIndex] / SAMPLE_RATE))
                * i / FRAME_COUNT
                * (FRAME_COUNT - i) / FRAME_COUNT;
        }
    }
    src.buffer = buffer;
    src.connect(aud.destination);

    var g = aud.createGain();
    src.connect(g);
    g.connect(aud.destination);
    g.gain.value = gain;

    src.start(0);
    return src;
}
