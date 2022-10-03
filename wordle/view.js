const ROWS = 6;
const COLUMNS = 5;

const CELL_STATES = ['absent', 'present', 'correct'];

const cells = Array.from({ length: ROWS }, () => Array.from({ length: COLUMNS }, () => 0));
let currentRow = -1;
let currentWord = 'slate';

function initialize() {
    const grid = document.querySelector('.grid');

    for (let i = 0; i < ROWS; i++) {
        const row = document.createElement('div');
        row.classList.add('row');

        for (let j = 0; j < COLUMNS; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;

            const span = document.createElement('span');
            span.classList.add('letter');

            cell.appendChild(span);
            row.appendChild(cell);
        }

        grid.appendChild(row);
    }

    grid.addEventListener('click', event => {
        const cell = event.target.classList.contains('letter') ? event.target.parentElement : event.target;

        if (!cell.classList.contains('cell')) {
            return;
        }

        const row = cell.dataset.row;
        const col = cell.dataset.col;
        const state = CELL_STATES[cells[row][col]];
        const newStateIndex = (cells[row][col] + 1) % CELL_STATES.length;
        const newState = CELL_STATES[newStateIndex];

        cells[row][col] = newStateIndex;

        cell.classList.remove(state);
        cell.classList.add(newState);
    });

    document.addEventListener('keydown', ({ key }) => {
        if (key === 'Enter') {
            showNextWord();
        }
    });
}

function showNextWord() {
    currentWord = currentRow === -1 ? currentWord : getNextWord(currentWord, parseInt(cells[currentRow].join(''), 3));

    const row = document.querySelectorAll('.row')[++currentRow];
    const children = row.children;

    for (let i = 0; i < children.length; i++) {
        const child = children[i];

        child.children[0].textContent = currentWord[i];

        setTimeout(() => {
            child.classList.add('revealed', 'absent');
        }, i * 250);
    }
}

initialize();
showNextWord();