const ROWS = 6;
const COLUMNS = 5;

const CELL_STATES = ['absent', 'present', 'correct'];

const cells = Array.from({ length: ROWS }, () => Array.from({ length: COLUMNS }, () => 0));

const grid = document.querySelector('.grid');

for (let i = 0; i < ROWS; i++) {
    const row = document.createElement('div');
    row.classList.add('row');

    for (let j = 0; j < COLUMNS; j++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = i;
        cell.dataset.col = j;

        row.appendChild(cell);
    }

    grid.appendChild(row);
}

grid.addEventListener('click', event => {
    const cell = event.target;

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