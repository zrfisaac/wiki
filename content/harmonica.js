(function () {
    const NOTE_FREQUENCIES = {
        '-10': 1760.00, '-9': 1396.91, '-8': 1174.66, '-7': 987.77, '-6': 880.00,
        '-5': 698.46, '-4': 587.33, '-3': 493.88, '-2': 392.00, '-1': 293.66,
        "-1'": 311.13, "-2'": 369.99, "-2''": 349.23, "-3'": 466.16, "-3''": 440.00,
        "-7'": 932.33, '1*': 311.13, '4*': 622.25, '5*': 739.99,
        '1': 261.63, '2': 329.63, '3': 392.00, '4': 523.25, '5': 659.25,
        '6': 783.99, '7': 1046.50, '8': 1318.51, '9': 1567.98, '10': 2093.00,
        'c': 261.63, 'd': 293.66, 'e': 329.63, 'f': 349.23, 'g': 392.00, 'a': 440.00, 'b': 493.88,
        'c#': 277.18, 'db': 277.18, 'd#': 311.13, 'eb': 311.13, 'f#': 369.99, 'gb': 369.99, 'g#': 415.30, 'ab': 415.30, 'a#': 466.16, 'bb': 466.16,
        'sol': 392.00, 'lá♭': 415.30, 'lá': 440.00, 'si♭': 466.16, 'si': 493.88,
        'dó': 523.25, 'ré♭': 554.37, 'ré': 587.33, 'mi♭': 622.25, 'mi': 659.25,
        'fá': 698.46, 'fá♯': 739.99,
    };

    const TUNING_OFFSETS = { c: 0, g: 7, a: 9 };
    // VCSL's filenames use an octave label one octave below the sounding pitch.
    const HARMONICA_SAMPLES = { C3: 261.63, E3: 329.63, C4: 523.25, E4: 659.25, G4: 783.99, C5: 1046.50, E5: 1318.51, G5: 1567.98, C6: 2093.00 };
    const harmonicaBuffers = new Map();
    const NOTE_DURATION = 0.25;
    const HOLD_PER_EXTRA_SPACE = 0.16;
    const PAUSE_PER_UNDERSCORE = 0.2;

    function escapeHtml(value) {
        return value.replace(/[&<>'"]/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
        }[character]));
    }

    function loadHarmonicaBuffer(context, sampleName) {
        if (!harmonicaBuffers.has(sampleName)) {
            const url = `content/harmonica/samples/hohner-special20/${sampleName}.wav`;
            harmonicaBuffers.set(sampleName, fetch(url)
                .then((response) => {
                    if (!response.ok) throw new Error(`Harmonica sample unavailable: ${sampleName}`);
                    return response.arrayBuffer();
                })
                .then((data) => context.decodeAudioData(data)));
        }
        return harmonicaBuffers.get(sampleName);
    }

    function getClosestHarmonicaSample(frequency) {
        return Object.entries(HARMONICA_SAMPLES).reduce((best, [name, sampleFrequency]) => (
            Math.abs(Math.log2(frequency / sampleFrequency)) < Math.abs(Math.log2(frequency / HARMONICA_SAMPLES[best])) ? name : best
        ), Object.keys(HARMONICA_SAMPLES)[0]);
    }

    async function playSampledHarmonica(button, events, context, multiplier) {
        const noteEvents = events.filter((event) => event.type === 'note');
        const sampleForNote = new Map();
        noteEvents.forEach((event) => event.notes.forEach((note) => {
            const frequency = (getNoteFrequency(note) || 261.63) * multiplier;
            sampleForNote.set(note, getClosestHarmonicaSample(frequency));
        }));
        try {
            const sampleNames = [...new Set(sampleForNote.values())];
            const buffers = new Map(await Promise.all(sampleNames.map(async (name) => [name, await loadHarmonicaBuffer(context, name)])));
            await context.resume();
            let start = context.currentTime + 0.04;
            events.forEach((event) => {
                if (event.type === 'pause') {
                    start += event.duration;
                    return;
                }
                event.notes.forEach((note) => {
                    const sampleName = sampleForNote.get(note);
                    const frequency = (getNoteFrequency(note) || 261.63) * multiplier;
                    const source = context.createBufferSource();
                    const envelope = context.createGain();
                    source.buffer = buffers.get(sampleName);
                    source.playbackRate.value = frequency / HARMONICA_SAMPLES[sampleName];
                    source.connect(envelope).connect(context.destination);
                    envelope.gain.setValueAtTime(0.0001, start);
                    envelope.gain.exponentialRampToValueAtTime(0.72, start + 0.012);
                    envelope.gain.setValueAtTime(0.72, start + Math.max(0.013, event.duration - 0.025));
                    envelope.gain.exponentialRampToValueAtTime(0.0001, start + event.duration);
                    source.start(start);
                    source.stop(start + event.duration + 0.01);
                });
                start += event.duration;
            });
            button.classList.add('is-playing');
            window.setTimeout(() => button.classList.remove('is-playing'), Math.max(250, (start - context.currentTime) * 1000));
        } catch (error) {
            console.error('Unable to play Hohner Special 20 samples.', error);
        }
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
        const tokenPattern = /-?\(\d+\)|-?\d+(?:''|'|\*)?|[A-Ga-g](?:#|b)?|_+/g;
        let match;
        let previousEnd = null;

        while ((match = tokenPattern.exec(source)) !== null) {
            const token = match[0];
            const gapBefore = previousEnd === null ? match.index : match.index - previousEnd;
            if (token[0] === '_') {
                events.push({ type: 'pause', value: token, duration: PAUSE_PER_UNDERSCORE * token.length });
            } else {
                const chord = token.match(/^(-?)\((\d+)\)$/);
                const notes = chord ? chord[2].split('').map((note) => `${chord[1]}${note}`) : [token];
                events.push({
                    type: 'note',
                    value: token,
                    notes,
                    duration: NOTE_DURATION + Math.max(0, gapBefore - 1) * HOLD_PER_EXTRA_SPACE,
                });
            }
            previousEnd = match.index + token.length;
        }
        return events;
    }

    function isNoteLine(value) {
        const tokenPattern = /-?\(\d+\)|-?\d+(?:''|'|\*)?|[A-Ga-g](?:#|b)?|_+/g;
        const tokens = value.match(tokenPattern);
        return Boolean(tokens && tokens.length && value.replace(tokenPattern, '').trim() === '');
    }

    function renderLine(notes, lyric, index, tuning, stanzaBreak) {
        const events = parseEvents(notes);
        const noteMarkup = events.map((event) => {
            const textWidth = 12 + event.value.length * 8;
            const durationWidth = Math.round(28 * event.duration / NOTE_DURATION);
            const width = Math.min(140, Math.max(28, textWidth, durationWidth));
            return `<span class="harmonica-note${event.type === 'pause' ? ' is-pause' : ''}" style="--harmonica-note-width:${width}px">${escapeHtml(event.value)}</span>`;
        }).join('');
        return `<div class="harmonica-line${stanzaBreak ? ' is-stanza-break' : ''}" data-events="${escapeHtml(JSON.stringify(events))}">
            <button class="harmonica-play" type="button" aria-label="Tocar linha ${index + 1} em ${tuning.toUpperCase()}"><i class="fa-solid fa-play" aria-hidden="true"></i></button>
            <div class="harmonica-line-content"><div class="harmonica-notes">${noteMarkup}</div><div class="harmonica-lyric">${escapeHtml(lyric || '')}</div></div>
        </div>`;
    }

    function renderBlock(source, tuning, stanzaBreak) {
        const lines = source.split(/\r?\n/);
        const rows = [];
        let pendingNotes = null;
        let pendingStanzaBreak = false;
        let blankLineCount = 0;
        let lineIndex = 0;

        lines.forEach((line) => {
            const value = line.trim();
            if (!value) {
                if (rows.length) blankLineCount += 1;
                return;
            }
            if (pendingNotes === null) {
                pendingNotes = line;
                pendingStanzaBreak = blankLineCount >= 2;
                blankLineCount = 0;
                return;
            }
            if (isNoteLine(value)) {
                rows.push(renderLine(pendingNotes, '', lineIndex, tuning, pendingStanzaBreak));
                pendingNotes = line;
                pendingStanzaBreak = blankLineCount >= 2;
                blankLineCount = 0;
                lineIndex += 1;
                return;
            }
            rows.push(renderLine(pendingNotes, value, lineIndex, tuning, pendingStanzaBreak));
            pendingNotes = null;
            pendingStanzaBreak = false;
            blankLineCount = 0;
            lineIndex += 1;
        });

        if (pendingNotes !== null) rows.push(renderLine(pendingNotes, '', lineIndex, tuning, pendingStanzaBreak));
        const key = tuning.toUpperCase();
        const playerClass = stanzaBreak ? 'harmonica-player is-stanza-break' : 'harmonica-player';
        return `<div class="${playerClass}" data-tuning="${key}" role="group" aria-label="Tablatura de harmonica em ${key}">${rows.join('')}</div>`;
    }

    function playLine(button, line) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const context = window.harmonicaAudioContext || (window.harmonicaAudioContext = new AudioContext());
        context.resume();
        const events = JSON.parse(line.dataset.events);
        const player = line.closest ? line.closest('.harmonica-player') : null;
        const tuning = ((player ? player.dataset.tuning : line.dataset.tuning) || 'C').toLowerCase();
        const multiplier = Math.pow(2, (TUNING_OFFSETS[tuning] || 0) / 12);
        playSampledHarmonica(button, events, context, multiplier);
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

    function playSong(button) {
        const lines = [...document.querySelectorAll('.markdown-section .harmonica-line')];
        if (!lines.length) return;
        const events = lines.flatMap((line) => JSON.parse(line.dataset.events));
        const firstPlayer = lines[0].closest('.harmonica-player');
        playLine(button, {
            dataset: { events: JSON.stringify(events) },
            closest: () => firstPlayer,
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
        hook.beforeEach((markdown) => markdown.replace(/```(harmonica|harmonicac|harmonicag|harmonicaa)\s*\n([\s\S]*?)\n```/gi, (match, language, source, offset, fullMarkdown) => {
            const beforeBlock = fullMarkdown.slice(0, offset);
            const stanzaBreak = /(?:\r?\n[ \t]*){3,}$/.test(beforeBlock);
            return renderBlock(source, language.replace('harmonica', '') || 'c', stanzaBreak);
        }));
        hook.doneEach(() => {
            document.querySelector('.harmonica-song-play')?.remove();
            const route = (window.location.hash || '').split('?')[0].toLowerCase();
            const isSongPage = route.startsWith('#/harmonica/tablatura/')
                && !route.endsWith('/readme')
                && document.querySelector('.markdown-section .harmonica-player');
            if (isSongPage) {
                const firstPlayer = document.querySelector('.markdown-section .harmonica-player');
                const songTuning = (firstPlayer.dataset.tuning || 'C').toUpperCase();
                const songInstrument = 'Harmonica';
                const songButton = document.createElement('button');
                songButton.className = 'harmonica-song-play';
                songButton.type = 'button';
                songButton.setAttribute('aria-label', `Reproduzir música em ${songTuning}`);
                songButton.innerHTML = `<i class="fa-solid fa-play" aria-hidden="true"></i><span>${songInstrument} ${songTuning}</span>`;
                firstPlayer.parentElement.insertBefore(songButton, firstPlayer);
                songButton.addEventListener('click', () => playSong(songButton));
            }
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
