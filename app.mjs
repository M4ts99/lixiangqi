import { initial, side, moves, play, check, outcome } from './rules.mjs';
import { courses } from './lessons.mjs';

const $ = id => document.getElementById(id);
const glyphs = { r:'車', h:'馬', e:'象', a:'士', k:'將', c:'砲', p:'卒',
  R:'俥', H:'傌', E:'相', A:'仕', K:'帥', C:'炮', P:'兵' };
const names = { r:'Wagen', h:'Pferd', e:'Elefant', a:'Berater', k:'General', c:'Kanone', p:'Soldat' };
const silhouettes = {
  r: 'M2 10h19l-3 6H5z M5 16v3m13-3v3 M8 10V6h8v4 M17 8l4-2',
  h: 'M5 20h15l-3-10-6-4-1-3-3 6-4 4 3 3 5-3z M9 10h.1',
  e: 'M4 17V9q1-4 8-4t8 5v5h-3v4q0 2-3 2 M6 16v4m5-4v4 M4 11q4-4 7 0v4h-7 M16 9h.1',
  a: 'M12 3l8 4v5q0 6-8 9-8-3-8-9V7z M12 8v7m-3-4h6',
  k: 'M4 19h16M5 16L3 7l5 4 4-6 4 6 5-4-2 9z M12 2v1',
  c: 'M4 9h14l3 3v2H4z M7 9V7m10 7 3 5 M12 17a3 3 0 1 0-6 0 3 3 0 0 0 6 0z',
  p: 'M9 18l3-4m0 0 3 4m-3-4V9m-4 3 4-3 4 2m2-8 3 2-3 2v13 M14 5a2 2 0 1 0-4 0 2 2 0 0 0 4 0z',
};
const color = team => team === 1 ? 'Rot' : 'Schwarz';
const field = index => 'abcdefghi'[index % 9] + (10 - Math.floor(index / 9));
const notation = ([from, to]) => field(from) + '–' + field(to);
const fresh = (human = 1, depth = 2) => ({ human, depth, log: [], result: null });
let game = fresh();
try { game = JSON.parse(localStorage.getItem('xiangqi-v1')) ?? game; } catch {}
let history = [initial()];
for (const move of game.log) history.push(play(history.at(-1), move));
let cursor = game.log.length, selected, suggested, worker, serial = 0, busy = false;
let analysis = [], analysisInfo = '';
let theme = 'wood', pieceStyle = 'han';
try {
  const preferences = JSON.parse(localStorage.getItem('xiangqi-design'));
  if (preferences) ({ theme, pieceStyle } = preferences);
} catch {}

function makePiece(piece) {
  const chip = document.createElement('span');
  chip.className = 'piece' + (side(piece) === 1 ? ' red' : '');
  if (pieceStyle === 'icons') {
    chip.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'
      +silhouettes[piece.toLowerCase()]+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  } else chip.textContent = glyphs[piece];
  return chip;
}
const turn = () => game.log.length % 2 ? -1 : 1;
const save = () => {
  try { localStorage.setItem('xiangqi-v1', JSON.stringify(game)); } catch {}
};

function makeBoard(board, onSquare) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 800 900');
  svg.setAttribute('class', 'lines');
  svg.setAttribute('aria-hidden', 'true');
  const paths = [];
  for (let y = 0; y <= 900; y += 100) paths.push('M0 '+y+'H800');
  for (let x = 0; x <= 800; x += 100) {
    paths.push('M'+x+' 0V'+(x === 0 || x === 800 ? 900 : 400));
    if (x > 0 && x < 800) paths.push('M'+x+' 500V900');
  }
  paths.push('M300 0L500 200M500 0L300 200M300 700L500 900M500 700L300 900');
  svg.innerHTML = '<path stroke="currentColor" stroke-width="3" fill="none" d="'+paths.join(' ')+'"/>';
  for (const [x, label] of [[210,'楚 河'],[590,'漢 界']]) {
    const text = document.createElementNS(svg.namespaceURI, 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', 470);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'currentColor');
    text.setAttribute('font-size', '43');
    text.textContent = label;
    svg.append(text);
  }
  if (board.id === 'training-board') {
    const labels = [
      ...[...'abcdefghi'].map((label, index) => [index * 100, 940, label]),
      ...Array.from({ length: 10 }, (_, index) => [-38, index * 100 + 7, 10 - index]),
    ];
    for (const [x, y, label] of labels) {
      const text = document.createElementNS(svg.namespaceURI, 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'currentColor');
      text.setAttribute('font-size', '23');
      text.textContent = label;
      svg.append(text);
    }
  }
  board.append(svg);
  return Array.from({ length: 90 }, (_, index) => {
    const button = document.createElement('button');
    button.className = 'point';
    button.style.left = (index % 9) * 12.5 + '%';
    button.style.top = Math.floor(index / 9) / 9 * 100 + '%';
    button.onclick = () => onSquare(index);
    board.append(button);
    return button;
  });
}

const points = makeBoard($('board'), index => clickSquare(game.human === 1 ? index : 89 - index));
const trainingPoints = makeBoard($('training-board'), trainSquare);

function paintSquare(button, index, piece, active, targets, last, suggestion) {
  button.replaceChildren();
  button.setAttribute('aria-label', field(index) + (piece === '.' ? '' : ' '+color(side(piece))+' '+names[piece.toLowerCase()]));
  button.classList.toggle('last', Boolean(last?.includes(index)));
  button.classList.toggle('selected', active === index);
  button.classList.toggle('legal', targets.includes(index));
  button.classList.toggle('suggested', Boolean(suggestion?.includes(index)));
  if (piece !== '.') button.append(makePiece(piece));
}

function render() {
  const position = history[cursor];
  const atEnd = cursor === game.log.length;
  const targets = selected === undefined ? [] : moves(position, turn(), selected).map(move => move[1]);
  const last = game.log[cursor - 1];
  points.forEach((button, display) => {
    const index = game.human === 1 ? display : 89 - display;
    paintSquare(button, index, position[index], selected, targets, last, suggested);
  });
  $('black-role').textContent = game.human === -1 ? 'Du' : 'KI';
  $('red-role').textContent = game.human === 1 ? 'Du' : 'KI';
  document.querySelector('.game').style.display = 'flex';
  document.querySelector('.game').style.flexDirection = game.human === 1 ? 'column' : 'column-reverse';
  $('status').textContent = !atEnd ? 'Replay · Zug '+cursor+' von '+game.log.length
    : game.result !== null ? game.result === 0 ? 'Remis' : color(game.result)+' gewinnt'
    : busy ? 'KI denkt …' : color(turn())+' am Zug'+(check(position, turn()) ? ' · Schach' : '');
  $('prev').disabled = cursor === 0;
  $('next').disabled = $('live').disabled = atEnd;
  $('resign').disabled = game.result !== null;
  const list = $('moves');
  list.replaceChildren(...game.log.map((move, index) => {
    const button = document.createElement('button');
    button.textContent = (index + 1)+'. '+notation(move);
    button.className = index + 1 === cursor ? 'current' : '';
    button.onclick = () => seek(index + 1);
    return button;
  }));
  if (atEnd) list.scrollTop = list.scrollHeight;
  $('analysis-panel').hidden = game.result === null || !game.log.length;
  $('analysis-status').textContent = analysisInfo;
  $('mistakes').replaceChildren(...analysis.filter(item => item.loss > 0)
    .sort((a, b) => b.loss - a.loss).slice(0, 3).map(item => {
      const button = document.createElement('button');
      button.textContent = 'Zug '+(item.index + 1)+' · '+notation(item.actual)+' → '+notation(item.best);
      button.onclick = () => { seek(item.index); suggested = item.best; render(); };
      return button;
    }));
}

function seek(index) {
  cursor = Math.max(0, Math.min(index, game.log.length));
  selected = suggested = undefined;
  render();
}

function clickSquare(index) {
  if (cursor !== game.log.length || game.result !== null || busy || turn() !== game.human) return;
  const board = history.at(-1);
  if (selected !== undefined && moves(board, turn(), selected).some(move => move[1] === index)) {
    commit([selected, index]);
  } else {
    selected = selected !== index && side(board[index]) === game.human ? index : undefined;
    render();
  }
}

function commit(move) {
  const follow = cursor === game.log.length;
  history.push(play(history.at(-1), move));
  game.log.push(move);
  if (follow) cursor = game.log.length;
  selected = suggested = undefined;
  game.result = outcome(history, history.at(-1), turn());
  save();
  advance();
}

function animateOpponent(move) {
  const [from, to] = move;
  const board = $('board');
  if ($('play').hidden || cursor !== game.log.length || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    commit(move);
    return;
  }
  const display = square => points[game.human === 1 ? square : 89 - square];
  const origin = display(from), destination = display(to);
  const chip = makePiece(history.at(-1)[from]);
  chip.classList.add('flying');
  chip.style.left = origin.style.left;
  chip.style.top = origin.style.top;
  const dx = destination.offsetLeft - origin.offsetLeft;
  const dy = destination.offsetTop - origin.offsetTop;
  board.append(chip);
  commit(move);
  destination.classList.add('arriving');
  const animation = chip.animate([
    { transform: 'translate(-50%, -50%)' },
    { transform: 'translate(calc(-50% + '+dx+'px), calc(-50% + '+dy+'px))' },
  ], { duration: 260, easing: 'ease-in-out' });
  busy = true;
  animation.onfinish = () => {
    chip.remove();
    destination.classList.remove('arriving');
    busy = false;
    render();
  };
  animation.oncancel = () => {
    chip.remove();
    destination.classList.remove('arriving');
  };
}

function ask(board, team, depth, compare, done) {
  worker ??= new Worker(new URL('./worker.mjs', import.meta.url), { type: 'module' });
  const id = ++serial;
  worker.onmessage = ({ data }) => { if (data.id === serial) done(data); };
  worker.onerror = () => {
    busy = false;
    analysisInfo = 'Die lokale Analyse konnte nicht gestartet werden.';
    render();
    if (game.result === null) $('status').textContent = 'Die lokale KI konnte nicht gestartet werden.';
  };
  worker.postMessage({ id, board, team, depth, compare });
}

function analyze() {
  const indices = game.log.map((_, index) => index).filter(index => (index % 2 ? -1 : 1) === game.human);
  function step(offset) {
    if (offset === indices.length) {
      analysisInfo = analysis.some(item => item.loss > 0)
        ? 'Größte Abweichungen laut lokaler Analyse.' : 'Keine bessere Alternative in der lokalen Analyse gefunden.';
      render();
      return;
    }
    const index = indices[offset];
    analysisInfo = 'Analysiere deine Züge · '+(offset + 1)+' / '+indices.length;
    render();
    ask(history[index], game.human, 2, true, ({ ranked }) => {
      const actual = game.log[index];
      const score = ranked.find(entry => entry.move[0] === actual[0] && entry.move[1] === actual[1])?.score;
      if (score !== undefined) analysis.push({ index, actual, best: ranked[0].move, loss: ranked[0].score - score });
      step(offset + 1);
    });
  }
  step(0);
}

function advance() {
  if (game.result !== null) {
    analyze();
  } else if (turn() !== game.human) {
    busy = true;
    render();
    ask(history.at(-1), turn(), game.depth, false, ({ choice }) => {
      busy = false;
      if (choice) animateOpponent(choice.move);
    });
  } else render();
}

function stop() {
  serial++;
  worker?.terminate();
  worker = undefined;
  $('board').querySelector('.flying')?.getAnimations()[0]?.cancel();
  busy = false;
}

$('level').value = game.depth;
$('team').value = game.human;
$('start').onclick = () => {
  if (game.log.length && game.result === null && !confirm('Die laufende Partie durch eine neue ersetzen?')) return;
  stop();
  game = fresh(Number($('team').value), Number($('level').value));
  history = [initial()];
  analysis = [];
  analysisInfo = '';
  save();
  seek(0);
  advance();
};
$('prev').onclick = () => seek(cursor - 1);
$('next').onclick = () => seek(cursor + 1);
$('live').onclick = () => seek(game.log.length);
$('resign').onclick = () => {
  if (!confirm('Partie aufgeben?')) return;
  stop();
  game.result = -game.human;
  save();
  seek(game.log.length);
  advance();
};

function showPage(page) {
  for (const id of ['menu', 'play', 'training', 'settings']) $(id).hidden = id !== page;
  $('home').hidden = page === 'menu';
}
document.querySelectorAll('[data-page]').forEach(button => {
  button.onclick = () => showPage(button.dataset.page);
});
$('home').onclick = () => showPage('menu');

function applyDesign() {
  document.documentElement.dataset.theme = theme;
  $('theme').value = theme;
  $('pieces').value = pieceStyle;
  $('piece-preview').replaceChildren(...[...'RHEAKCPrheakcp'].map(piece => {
    const chip = makePiece(piece);
    chip.title = color(side(piece))+' '+names[piece.toLowerCase()];
    return chip;
  }));
  try { localStorage.setItem('xiangqi-design', JSON.stringify({ theme, pieceStyle })); } catch {}
  render();
  if (practice) renderTraining();
}
$('theme').onchange = () => { theme = $('theme').value; applyDesign(); };
$('pieces').onchange = () => { pieceStyle = $('pieces').value; applyDesign(); };

const square = text => (10 - Number(text.slice(1))) * 9 + 'abcdefghi'.indexOf(text[0]);
const parseMove = text => text.split(' ').map(square);
let practice;
let completed = new Set();
try { completed = new Set(JSON.parse(localStorage.getItem('xiangqi-lessons')) ?? []); } catch {}

function showCourses() {
  $('exercise').hidden = true;
  $('course-list').hidden = false;
  $('course-list').replaceChildren(...courses.map(course => {
    const section = document.createElement('section');
    section.className = 'panel';
    const heading = document.createElement('h2');
    heading.textContent = course.title;
    const description = document.createElement('p');
    description.textContent = course.description;
    const list = document.createElement('nav');
    list.setAttribute('aria-label', course.title);
    course.lessons.forEach(lesson => {
      const button = document.createElement('button');
      button.textContent = lesson.title;
      if (completed.has(lesson.id)) {
        const badge = document.createElement('span');
        badge.textContent = '✓';
        badge.setAttribute('aria-label', 'Abgeschlossen');
        button.append(badge);
      }
      button.onclick = () => startExercise(course, lesson, 0);
      list.append(button);
    });
    section.append(heading, description, list);
    return section;
  }));
}

function startExercise(course, lesson, index) {
  const exercise = lesson.exercises[index];
  const board = Array(90).fill('.');
  for (const token of exercise.board.split(' ')) board[square(token.slice(1))] = token[0];
  practice = {
    course, lesson, index, exercise, board, expected: parseMove(exercise.move),
    active: undefined, last: undefined, nextGoal: exercise.goal, feedback: '', solved: false,
  };
  $('course-list').hidden = true;
  $('exercise').hidden = false;
  renderTraining();
  $('lesson-title').focus({ preventScroll: true });
}

function renderTraining() {
  const { course, lesson, index, board, active, last, nextGoal, feedback, solved } = practice;
  const targets = course === courses[0] && active !== undefined
    ? moves(board, 1, active).map(move => move[1]) : [];
  trainingPoints.forEach((button, index) => {
    paintSquare(button, index, board[index], active, targets, last);
    button.setAttribute('aria-disabled', String(solved));
  });
  $('lesson-position').textContent = course.title+' · Aufgabe '+(index + 1)+' von '+lesson.exercises.length;
  $('lesson-title').textContent = lesson.title;
  $('lesson-copy').textContent = lesson.description;
  $('lesson-goal').textContent = nextGoal;
  $('lesson-result').textContent = feedback;
  $('lesson-next').hidden = !solved;
  $('lesson-next').textContent = index + 1 < lesson.exercises.length ? 'Nächste Aufgabe' : 'Zur Lektionsübersicht';
}

function trainSquare(index) {
  if (!practice || practice.solved) return;
  const { board, active, exercise, expected, lesson } = practice;
  if (side(board[index]) === 1) {
    practice.active = active === index ? undefined : index;
    practice.feedback = '';
  } else if (active !== undefined) {
    if (!moves(board, 1, active).some(move => move[1] === index)) {
      practice.feedback = 'Dieser Zug ist in der Stellung nicht legal.';
    } else if (expected[0] !== active || expected[1] !== index) {
      practice.feedback = 'Der Zug ist legal, löst aber die Aufgabe noch nicht.';
    } else {
      practice.board = play(board, expected);
      practice.last = expected;
      practice.active = undefined;
      if (exercise.reply && !practice.replied) {
        practice.last = parseMove(exercise.reply);
        practice.board = play(practice.board, practice.last);
        practice.expected = parseMove(exercise.finish);
        practice.replied = true;
        practice.nextGoal = 'Schwarz hat '+notation(practice.last)+' gespielt. Setze jetzt matt.';
        practice.feedback = 'Richtig. Jetzt folgt der zweite rote Zug.';
      } else {
        practice.solved = true;
        practice.feedback = exercise.why;
        if (practice.index + 1 === lesson.exercises.length) {
          completed.add(lesson.id);
          try { localStorage.setItem('xiangqi-lessons', JSON.stringify([...completed])); } catch {}
        }
      }
    }
  } else practice.feedback = 'Wähle zuerst eine rote Figur.';
  renderTraining();
}

$('training-back').onclick = showCourses;
$('lesson-reset').onclick = () => startExercise(practice.course, practice.lesson, practice.index);
$('lesson-next').onclick = () => {
  const { course, lesson, index } = practice;
  if (index + 1 < lesson.exercises.length) startExercise(course, lesson, index + 1);
  else showCourses();
};
showCourses();
applyDesign();
advance();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.error);
