(function () {
    const NOTE_FREQUENCIES = {
        '-10': 1760.00, '-9': 1396.91, '-8': 1174.66, '-7': 987.77, '-6': 880.00,
        '-5': 698.46, '-4': 587.33, '-3': 493.88, '-2': 392.00, '-1': 293.66,
        '1': 261.63, '2': 329.63, '3': 392.00, '4': 523.25, '5': 659.25,
        '6': 783.99, '7': 1046.50, '8': 1318.51, '9': 1567.98, '10': 2093.00,
        'c': 261.63, 'd': 293.66, 'e': 329.63, 'f': 349.23, 'g': 392.00, 'a': 440.00, 'b': 493.88,
        'c#': 277.18, 'db': 277.18, 'd#': 311.13, 'eb': 311.13, 'f#': 369.99, 'gb': 369.99, 'g#': 415.30, 'ab': 415.30, 'a#': 466.16, 'bb': 466.16,
        'sol': 392.00, 'lá♭': 415.30, 'lá': 440.00, 'si♭': 466.16, 'si': 493.88,
        'dó': 523.25, 'ré♭': 554.37, 'ré': 587.33, 'mi♭': 622.25, 'mi': 659.25,
        'fá': 698.46, 'fá♯': 739.99,
    };

    const TUNING_OFFSETS = { c: 0, g: 7, a: 9 };
    const NATURAL_TIMBRE = { main: 'sawtooth', overtone: 'triangle', overtoneGain: 0.08, filter: 1900, q: 1.2, breath: 0.018, vibrato: 0.7, tremolo: 0.006, drive: 0 };
    const NOTE_DURATION = 0.25;
    const HOLD_PER_EXTRA_SPACE = 0.16;
    const PAUSE_PER_UNDERSCORE = 0.2;

    function escapeHtml(value) {
        return value.replace(/[&<>'"]/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
        }[character]));
    }

    function createDriveCurve(amount) {
        const curve = new Float32Array(256);
        const drive = Math.max(1, amount);
        for (let index = 0; index < curve.length; index += 1) {
            const input = (index * 2) / (curve.length - 1) - 1;
            curve[index] = Math.tanh(input * drive) / Math.tanh(drive);
        }
        return curve;
    }

    function getNoteFrequency(note) {
        return NOTE_FREQUENCIES[note] || NOTE_FREQUENCIES[note.toLowerCase()] || null;
    }

    function getPitchBase(value) {
        return ({
            c: 261.63, 'c#': 277.18, db: 277.18, d: 293.66, 'd#': 311.13, eb: 311.13,
            e: 329.63, f: 349.23, 'f#': 369.99, gb: 369.99, g: 392.00,
            'g#': 415.30, ab: 415.30, a: 440.00, 'a#': 466.16, bb: 466.16, b: 493.88,
            dó: 261.63, 'ré♭': 277.18, ré: 293.66, 'mi♭': 311.13, mi: 329.63,
            fá: 349.23, 'fá♯': 369.99, sol: 392.00, 'lá♭': 415.30, lá: 440.00,
            'si♭': 466.16, si: 493.88,
        }[value.toLowerCase()] || null);
    }

    function getOctave(frequency) {
        const midi = 69 + 12 * Math.log2(frequency / 440);
        return Math.floor(midi / 12) - 1;
    }

    function getTableNoteLabel(value, previousFrequency) {
        const base = getPitchBase(value);
        if (!base) return null;
        let frequency = base;
        while (frequency <= previousFrequency * 1.01) frequency *= 2;
        return { label: `${value}${getOctave(frequency)}`, frequency };
    }

    function parseEvents(source) {
        const events = [];
        const tokenPattern = /(-?\(\d+\)|-?\d+(?:''|')?|_+)([ \t]*)/g;
        let match;
        while ((match = tokenPattern.exec(source)) !== null) {
            const token = match[1];
            const spaces = match[2].length;
            if (token[0] === '_') {
                events.push({ type: 'pause', value: token, duration: PAUSE_PER_UNDERSCORE * token.length });
            } else {
                const chord = token.match(/^(-?)\((\d+)\)$/);
                const notes = chord ? chord[2].split('').map((note) => `${chord[1]}${note}`) : [token];
                events.push({
                    type: 'note',
                    value: token,
                    notes,
                    duration: NOTE_DURATION + Math.max(0, spaces - 1) * HOLD_PER_EXTRA_SPACE,
                });
            }
        }
        return events;
    }

    function renderLine(notes, lyric, index, tuning) {
        const events = parseEvents(notes);
        const noteMarkup = events.map((event) => {
            const textWidth = 12 + event.value.length * 8;
            const durationWidth = Math.round(28 * event.duration / NOTE_DURATION);
            const width = Math.min(140, Math.max(28, textWidth, durationWidth));
            return `<span class="harmonica-note${event.type === 'pause' ? ' is-pause' : ''}" style="--harmonica-note-width:${width}px">${escapeHtml(event.value)}</span>`;
        }).join('');
        return `<div class="harmonica-line" data-events="${escapeHtml(JSON.stringify(events))}">
            <button class="harmonica-play" type="button" aria-label="Tocar linha ${index + 1} em ${tuning.toUpperCase()}">${escapeHtml(tuning.toUpperCase())}</button>
            <div class="harmonica-line-content"><div class="harmonica-notes">${noteMarkup}</div><div class="harmonica-lyric">${escapeHtml(lyric || '')}</div></div>
        </div>`;
    }

    function renderBlock(source, tuning) {
        const lines = source.split(/\r?\n/);
        const rows = [];
        let pendingNotes = null;
        let lineIndex = 0;

        lines.forEach((line) => {
            const value = line.trim();
            if (!value) return;
            if (pendingNotes === null) {
                pendingNotes = line;
                return;
            }
            rows.push(renderLine(pendingNotes, value, lineIndex, tuning));
            pendingNotes = null;
            lineIndex += 1;
        });

        if (pendingNotes !== null) rows.push(renderLine(pendingNotes, '', lineIndex, tuning));
        const key = tuning.toUpperCase();
        return `<div class="harmonica-player" data-tuning="${key}" role="group" aria-label="Tablatura de harmônica em ${key}">${rows.join('')}</div>`;
    }

    function playLine(button, line) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const context = window.harmonicaAudioContext || (window.harmonicaAudioContext = new AudioContext());
        context.resume();
        const timbre = NATURAL_TIMBRE;
        const events = JSON.parse(line.dataset.events);
        const player = line.closest ? line.closest('.harmonica-player') : null;
        const tuning = ((player ? player.dataset.tuning : line.dataset.tuning) || 'C').toLowerCase();
        const multiplier = Math.pow(2, (TUNING_OFFSETS[tuning] || 0) / 12);
        let start = context.currentTime;
        events.forEach((event) => {
            if (event.type === 'pause') {
                start += event.duration;
                return;
            }
            const vibrato = context.createOscillator();
            const vibratoDepth = context.createGain();
            const gain = context.createGain();
            const filter = context.createBiquadFilter();
            const shaper = context.createWaveShaper();
            const tremolo = context.createOscillator();
            const tremoloDepth = context.createGain();
            const breath = context.createBufferSource();
            const breathFilter = context.createBiquadFilter();
            const breathGain = context.createGain();
            const breathBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.045), context.sampleRate);
            const breathData = breathBuffer.getChannelData(0);
            for (let sample = 0; sample < breathData.length; sample += 1) breathData[sample] = Math.random() * 2 - 1;
            breath.buffer = breathBuffer;
            breathFilter.type = 'bandpass';
            breathFilter.frequency.value = 1300;
            breathFilter.Q.value = 0.7;
            breathGain.gain.setValueAtTime(0.0001, start);
            breathGain.gain.exponentialRampToValueAtTime(timbre.breath, start + 0.012);
            breathGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.04);
            vibrato.type = 'sine';
            vibrato.frequency.value = 5.5;
            vibratoDepth.gain.value = timbre.vibrato;
            tremolo.type = 'sine';
            tremolo.frequency.value = 5.8;
            tremoloDepth.gain.value = timbre.tremolo;
            filter.type = 'lowpass';
            filter.frequency.value = timbre.filter;
            filter.Q.value = timbre.q;
            shaper.curve = createDriveCurve(timbre.drive);
            shaper.oversample = '2x';
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.12, start + 0.035);
            gain.gain.setValueAtTime(0.10, start + Math.max(0.06, event.duration - 0.08));
            gain.gain.exponentialRampToValueAtTime(0.0001, start + event.duration);
            filter.connect(shaper).connect(gain).connect(context.destination);
            tremolo.connect(tremoloDepth).connect(gain.gain);
            breath.connect(breathFilter).connect(breathGain).connect(context.destination);
            vibrato.start(start);
            tremolo.start(start);
            breath.start(start);
            vibrato.stop(start + event.duration);
            tremolo.stop(start + event.duration);
            breath.stop(start + 0.045);
            event.notes.forEach((note, noteIndex) => {
                const oscillator = context.createOscillator();
                const overtone = context.createOscillator();
                const overtoneGain = context.createGain();
                oscillator.type = timbre.main;
                oscillator.frequency.value = (getNoteFrequency(note) || 261.63) * multiplier;
                overtone.type = timbre.overtone;
                overtone.frequency.value = oscillator.frequency.value * 2;
                overtone.detune.value = -3 + noteIndex * 2;
                overtoneGain.gain.value = timbre.overtoneGain / event.notes.length;
                vibrato.connect(vibratoDepth).connect(oscillator.detune);
                oscillator.connect(filter);
                overtone.connect(overtoneGain).connect(filter);
                oscillator.start(start);
                overtone.start(start);
                oscillator.stop(start + event.duration);
                overtone.stop(start + event.duration);
            });
            start += event.duration;
        });
        button.classList.add('is-playing');
        window.setTimeout(() => button.classList.remove('is-playing'), Math.max(250, (start - context.currentTime) * 1000));
    }

    function playTableNote(button, value) {
        const token = value.trim();
        if (!getNoteFrequency(token) && !/^-?\d+$/.test(token)) return;
        const isHarmonicaOverview = window.location.hash.toLowerCase().includes('/harmonica/readme');
        const tableNoteDuration = isHarmonicaOverview ? 0.5 : NOTE_DURATION;
        playLine(button, {
            dataset: {
                events: JSON.stringify([{ type: 'note', value: token, notes: [token], duration: tableNoteDuration }]),
                tuning: 'C',
            },
            closest: () => null,
        });
    }

    function bindClickableNotes() {
        document.querySelectorAll('.markdown-section table tr').forEach((row) => {
            const rowCells = [...row.querySelectorAll('td:not(:first-child)')];
            let previousFrequency = 0;
            rowCells.forEach((cell) => {
                const value = cell.textContent.trim();
                if (!value || value === '—' || (!getNoteFrequency(value) && !/^-?\d+$/.test(value))) return;

                const tableNote = getTableNoteLabel(value, previousFrequency);
                if (tableNote) previousFrequency = tableNote.frequency;
                if (cell.dataset.harmonicaBound) return;

                const displayValue = tableNote ? tableNote.label : value;
                cell.dataset.harmonicaBound = 'true';
                cell.classList.add('is-harmonica-note-cell');
                cell.innerHTML = `<button class="harmonica-table-note" type="button" aria-label="Tocar ${escapeHtml(displayValue)}">${escapeHtml(displayValue)}</button>`;
                cell.querySelector('button').addEventListener('click', () => playTableNote(cell.querySelector('button'), value));
            });
        });

        document.querySelectorAll('.harmonica-note:not(.is-pause)').forEach((note) => {
            if (note.dataset.harmonicaBound) return;
            note.dataset.harmonicaBound = 'true';
            note.setAttribute('role', 'button');
            note.setAttribute('tabindex', '0');
            const play = () => playTableNote(note, note.textContent);
            note.addEventListener('click', play);
            note.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); play(); }
            });
        });
    }

    function registerPlugin(hook) {
        hook.beforeEach((markdown) => markdown.replace(/```(harmonica|harmonicac|harmonicag|harmonicaa)\s*\n([\s\S]*?)\n```/gi, (_, language, source) => renderBlock(source, language.replace('harmonica', '') || 'c')));
        hook.doneEach(() => {
            document.querySelectorAll('.harmonica-play').forEach((button) => {
                if (button.dataset.bound) return;
                button.dataset.bound = 'true';
                button.addEventListener('click', () => playLine(button, button.closest('.harmonica-line')));
            });
            bindClickableNotes();
            document.querySelectorAll('.markdown-section ul').forEach((list) => {
                if ([...list.querySelectorAll('a')].some((link) => link.href.includes('/harmonica/tablatura/'))) {
                    list.classList.add('tablatura-list');
                }
            });
        });
    }

    window.$docsify = window.$docsify || {};
    window.$docsify.plugins = (window.$docsify.plugins || []).concat(registerPlugin);
}());
