// ========== Alphabricks Rotation Tests ==========
// Run: node test-rotation.js

// --- Extracted game constants & functions ---
const COLS = 10;
const ROWS = 20;

const SHAPES = {
  I: [[[0,0],[1,0],[2,0],[3,0]], [[0,0],[0,1],[0,2],[0,3]], [[0,0],[1,0],[2,0],[3,0]], [[0,0],[0,1],[0,2],[0,3]]],
  O: [[[0,0],[1,0],[0,1],[1,1]], [[0,0],[1,0],[0,1],[1,1]], [[0,0],[1,0],[0,1],[1,1]], [[0,0],[1,0],[0,1],[1,1]]],
  T: [[[1,0],[0,1],[1,1],[2,1]], [[0,0],[0,1],[0,2],[1,1]], [[0,0],[1,0],[2,0],[1,1]], [[1,0],[1,1],[1,2],[0,1]]],
  S: [[[1,0],[2,0],[0,1],[1,1]], [[0,0],[0,1],[1,1],[1,2]]],
  Z: [[[0,0],[1,0],[1,1],[2,1]], [[1,0],[1,1],[0,1],[0,2]]],
  L: [[[2,0],[0,1],[1,1],[2,1]], [[0,0],[0,1],[0,2],[1,2]], [[0,0],[1,0],[2,0],[0,1]], [[0,0],[1,0],[1,1],[1,2]]],
  J: [[[0,0],[0,1],[1,1],[2,1]], [[0,0],[1,0],[0,1],[0,2]], [[0,0],[1,0],[2,0],[2,1]], [[1,0],[1,1],[1,2],[0,2]]]
};

const SHAPE_NAMES = Object.keys(SHAPES);

let board = [];
function initBoard() {
  board = [];
  for (let r = 0; r < ROWS; r++) board.push(new Array(COLS).fill(null));
}

function isValidPosition(piece, offsetX = 0, offsetY = 0) {
  for (const [cx, cy] of piece.cells) {
    const nx = piece.x + cx + offsetX;
    const ny = piece.y + cy + offsetY;
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false;
    if (board[ny][nx] !== null) return false;
  }
  return true;
}

function rotateLetters(piece, newCells, direction) {
  const oldCells = piece.cells;
  const maxY = Math.max(...oldCells.map(c => c[1]));
  const maxX = Math.max(...oldCells.map(c => c[0]));

  const rotated = (direction === 1)
    ? oldCells.map(([x, y]) => [maxY - y, x])
    : oldCells.map(([x, y]) => [y, maxX - x]);

  const newLetters = new Array(4);
  for (let i = 0; i < 4; i++) {
    const [rx, ry] = rotated[i];
    const j = newCells.findIndex(([nx, ny]) => nx === rx && ny === ry);
    newLetters[j] = piece.letters[i];
  }
  return newLetters;
}

function rotatePiece(piece, direction) {
  const rotations = SHAPES[piece.shapeName];
  const newRot = (piece.rotation + direction + rotations.length) % rotations.length;
  const newCells = rotations[newRot];
  const newLetters = rotateLetters(piece, newCells, direction);

  const testPiece = { ...piece, rotation: newRot, cells: newCells, letters: newLetters };

  for (const dx of [0, -1, 1, -2, 2]) {
    testPiece.x = piece.x + dx;
    if (isValidPosition(testPiece)) {
      piece.rotation = newRot;
      piece.cells = newCells;
      piece.letters = newLetters;
      piece.x = testPiece.x;
      return true;
    }
  }
  return false;
}

// --- Test harness ---
let passed = 0;
let failed = 0;
let currentTest = '';

function describe(name, fn) {
  console.log(`\n  ${name}`);
  fn();
}

function it(name, fn) {
  currentTest = name;
  try {
    fn();
    passed++;
    console.log(`    \x1b[32m✓\x1b[0m ${name}`);
  } catch (e) {
    failed++;
    console.log(`    \x1b[31m✗\x1b[0m ${name}`);
    console.log(`      ${e.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function arrEq(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function cellsEq(a, b) {
  return a.length === b.length && a.every((v, i) => v[0] === b[i][0] && v[1] === b[i][1]);
}

function makePiece(shapeName, letters) {
  const cells = SHAPES[shapeName][0];
  return { shapeName, rotation: 0, x: 4, y: 5, cells, letters: [...letters], color: '#fff' };
}

// Render piece to a small grid string for visual debugging
function renderPiece(piece) {
  const cells = piece.cells;
  const maxX = Math.max(...cells.map(c => c[0]));
  const maxY = Math.max(...cells.map(c => c[1]));
  const grid = Array.from({ length: maxY + 1 }, () => new Array(maxX + 1).fill('.'));
  for (let i = 0; i < cells.length; i++) {
    grid[cells[i][1]][cells[i][0]] = piece.letters[i];
  }
  return grid.map(row => row.join(' ')).join('\n');
}

// ==================== Tests ====================
console.log('\nAlphabricks Rotation Tests');
console.log('=========================');

initBoard();

// --- Shape validity tests ---
describe('Shape definitions', () => {
  for (const name of SHAPE_NAMES) {
    it(`${name} piece has correct number of cells in all rotations`, () => {
      const rotations = SHAPES[name];
      for (let r = 0; r < rotations.length; r++) {
        assert(rotations[r].length === 4, `${name} rotation ${r} has ${rotations[r].length} cells, expected 4`);
      }
    });

    it(`${name} piece has no duplicate cell positions in any rotation`, () => {
      const rotations = SHAPES[name];
      for (let r = 0; r < rotations.length; r++) {
        const keys = rotations[r].map(([x, y]) => `${x},${y}`);
        const unique = new Set(keys);
        assert(unique.size === 4, `${name} rotation ${r} has duplicate positions: [${keys}]`);
      }
    });

    it(`${name} piece has non-negative cell coordinates`, () => {
      const rotations = SHAPES[name];
      for (let r = 0; r < rotations.length; r++) {
        for (const [x, y] of rotations[r]) {
          assert(x >= 0 && y >= 0, `${name} rotation ${r} has negative coord (${x},${y})`);
        }
      }
    });
  }

  it('I piece has 4 rotation states', () => {
    assert(SHAPES.I.length === 4, `I has ${SHAPES.I.length} states`);
  });

  it('O piece has 4 rotation states', () => {
    assert(SHAPES.O.length === 4, `O has ${SHAPES.O.length} states`);
  });

  it('T piece has 4 rotation states', () => {
    assert(SHAPES.T.length === 4, `T has ${SHAPES.T.length} states`);
  });

  it('L piece has 4 rotation states', () => {
    assert(SHAPES.L.length === 4, `L has ${SHAPES.L.length} states`);
  });

  it('J piece has 4 rotation states', () => {
    assert(SHAPES.J.length === 4, `J has ${SHAPES.J.length} states`);
  });

  it('S piece has 2 rotation states', () => {
    assert(SHAPES.S.length === 2, `S has ${SHAPES.S.length} states`);
  });

  it('Z piece has 2 rotation states', () => {
    assert(SHAPES.Z.length === 2, `Z has ${SHAPES.Z.length} states`);
  });
});

// --- CW rotation returns to original after full cycle ---
describe('Full CW rotation cycle returns to original state', () => {
  for (const name of SHAPE_NAMES) {
    it(`${name} piece: cells return to original after ${SHAPES[name].length} CW rotations`, () => {
      initBoard();
      const piece = makePiece(name, ['A', 'B', 'C', 'D']);
      const origCells = piece.cells.map(c => [...c]);
      const numRots = SHAPES[name].length;
      for (let i = 0; i < numRots; i++) rotatePiece(piece, 1);
      assert(cellsEq(piece.cells, origCells),
        `Cells after ${numRots}x CW: expected ${JSON.stringify(origCells)}, got ${JSON.stringify(piece.cells)}`);
    });

    it(`${name} piece: letters return to original after 4 CW rotations`, () => {
      initBoard();
      const piece = makePiece(name, ['A', 'B', 'C', 'D']);
      const origLetters = [...piece.letters];
      for (let i = 0; i < 4; i++) rotatePiece(piece, 1);
      assert(arrEq(piece.letters, origLetters),
        `Letters after 4x CW: expected [${origLetters}], got [${piece.letters}]`);
    });
  }
});

// --- CCW rotation returns to original after full cycle ---
describe('Full CCW rotation cycle returns to original state', () => {
  for (const name of SHAPE_NAMES) {
    it(`${name} piece: cells return to original after ${SHAPES[name].length} CCW rotations`, () => {
      initBoard();
      const piece = makePiece(name, ['A', 'B', 'C', 'D']);
      const origCells = piece.cells.map(c => [...c]);
      const numRots = SHAPES[name].length;
      for (let i = 0; i < numRots; i++) rotatePiece(piece, -1);
      assert(cellsEq(piece.cells, origCells),
        `Cells after ${numRots}x CCW: expected ${JSON.stringify(origCells)}, got ${JSON.stringify(piece.cells)}`);
    });

    it(`${name} piece: letters return to original after 4 CCW rotations`, () => {
      initBoard();
      const piece = makePiece(name, ['A', 'B', 'C', 'D']);
      const origLetters = [...piece.letters];
      for (let i = 0; i < 4; i++) rotatePiece(piece, -1);
      assert(arrEq(piece.letters, origLetters),
        `Letters after 4x CCW: expected [${origLetters}], got [${piece.letters}]`);
    });
  }
});

// --- CW then CCW returns to original ---
describe('CW followed by CCW returns to original', () => {
  for (const name of SHAPE_NAMES) {
    it(`${name} piece: CW then CCW restores cells and letters`, () => {
      initBoard();
      const piece = makePiece(name, ['A', 'B', 'C', 'D']);
      const origCells = piece.cells.map(c => [...c]);
      const origLetters = [...piece.letters];
      rotatePiece(piece, 1);
      rotatePiece(piece, -1);
      assert(cellsEq(piece.cells, origCells),
        `Cells not restored: expected ${JSON.stringify(origCells)}, got ${JSON.stringify(piece.cells)}`);
      assert(arrEq(piece.letters, origLetters),
        `Letters not restored: expected [${origLetters}], got [${piece.letters}]`);
    });
  }
});

// --- I piece letter rotation ---
describe('I piece letter rotation', () => {
  it('I piece CW: horizontal→vertical preserves reading order', () => {
    initBoard();
    const piece = makePiece('I', ['A', 'B', 'C', 'D']);
    rotatePiece(piece, 1);
    // Left-to-right becomes top-to-bottom in same order
    assert(piece.letters.join('') === 'ABCD',
      `Expected ABCD, got ${piece.letters.join('')}`);
  });

  it('I piece CW: vertical→horizontal reverses order', () => {
    initBoard();
    const piece = makePiece('I', ['A', 'B', 'C', 'D']);
    rotatePiece(piece, 1);
    rotatePiece(piece, 1);
    assert(piece.letters.join('') === 'DCBA',
      `Expected DCBA, got ${piece.letters.join('')}`);
  });

  it('I piece returns to original after 4 CW rotations', () => {
    initBoard();
    const piece = makePiece('I', ['A', 'B', 'C', 'D']);
    for (let i = 0; i < 4; i++) rotatePiece(piece, 1);
    assert(piece.letters.join('') === 'ABCD', 'Should return after 4 CW');
  });

  it('I piece alternates between horizontal and vertical shapes', () => {
    initBoard();
    const piece = makePiece('I', ['A', 'B', 'C', 'D']);
    assert(piece.cells.every(c => c[1] === 0), 'State 0 should be horizontal');
    rotatePiece(piece, 1);
    assert(piece.cells.every(c => c[0] === piece.cells[0][0]), 'State 1 should be vertical');
    rotatePiece(piece, 1);
    assert(piece.cells.every(c => c[1] === 0), 'State 2 should be horizontal');
    rotatePiece(piece, 1);
    assert(piece.cells.every(c => c[0] === piece.cells[0][0]), 'State 3 should be vertical');
  });
});

// --- O piece: 4 distinct letter arrangements ---
describe('O piece letter rotation', () => {
  it('O piece has 4 distinct letter arrangements across CW rotations', () => {
    initBoard();
    const piece = makePiece('O', ['A', 'B', 'C', 'D']);
    const arrangements = [piece.letters.join('')];
    for (let i = 0; i < 3; i++) {
      rotatePiece(piece, 1);
      arrangements.push(piece.letters.join(''));
    }
    const unique = new Set(arrangements);
    assert(unique.size === 4,
      `Expected 4 distinct arrangements, got ${unique.size}: [${arrangements.join(', ')}]`);
  });

  it('O piece CW permutation: AB/CD → CA/DB → DC/BA → BD/AC', () => {
    initBoard();
    const piece = makePiece('O', ['A', 'B', 'C', 'D']);
    // Cell order: [0]=TL [1]=TR [2]=BL [3]=BR
    // State 0: TL=A TR=B BL=C BR=D → visual: AB / CD
    assert(piece.letters.join('') === 'ABCD', 'State 0');
    rotatePiece(piece, 1);
    // CW: TL=C TR=A BL=D BR=B → visual: CA / DB
    assert(piece.letters.join('') === 'CADB', `State 1: expected CADB, got ${piece.letters.join('')}`);
    rotatePiece(piece, 1);
    // CW: TL=D TR=C BL=B BR=A → visual: DC / BA
    assert(piece.letters.join('') === 'DCBA', `State 2: expected DCBA, got ${piece.letters.join('')}`);
    rotatePiece(piece, 1);
    // CW: TL=B TR=D BL=A BR=C → visual: BD / AC
    assert(piece.letters.join('') === 'BDAC', `State 3: expected BDAC, got ${piece.letters.join('')}`);
    rotatePiece(piece, 1);
    assert(piece.letters.join('') === 'ABCD', 'Should return to original after 4 CW');
  });

  it('O piece shape does not change on rotation', () => {
    initBoard();
    const piece = makePiece('O', ['A', 'B', 'C', 'D']);
    const origCells = piece.cells.map(c => [...c]);
    for (let i = 0; i < 4; i++) {
      rotatePiece(piece, 1);
      assert(cellsEq(piece.cells, origCells),
        `O cells changed at rotation ${i + 1}: ${JSON.stringify(piece.cells)}`);
    }
  });
});

// --- All pieces: letters change on rotation (rotate with the piece) ---
describe('Letters rotate with piece (not fixed to indices)', () => {
  for (const name of SHAPE_NAMES) {
    it(`${name} piece: letters return to original after 4 CW rotations`, () => {
      initBoard();
      const piece = makePiece(name, ['A', 'B', 'C', 'D']);
      for (let i = 0; i < 4; i++) rotatePiece(piece, 1);
      assert(arrEq(piece.letters, ['A', 'B', 'C', 'D']),
        `Expected [A,B,C,D] after 4 CW, got [${piece.letters}]`);
    });

    it(`${name} piece: CW then CCW restores letters`, () => {
      initBoard();
      const piece = makePiece(name, ['A', 'B', 'C', 'D']);
      const origLetters = [...piece.letters];
      rotatePiece(piece, 1);
      rotatePiece(piece, -1);
      assert(arrEq(piece.letters, origLetters),
        `Expected [${origLetters}] after CW+CCW, got [${piece.letters}]`);
    });
  }
});

// --- Wall kick tests ---
describe('Wall kicks', () => {
  it('I piece wall kicks when near left edge', () => {
    initBoard();
    const piece = makePiece('I', ['A', 'B', 'C', 'D']);
    piece.x = 0; // at left edge, horizontal
    const result = rotatePiece(piece, 1); // rotate to vertical
    assert(result === true, 'Should successfully rotate with wall kick');
    assert(piece.x >= 0, `Piece x should be >= 0 after wall kick, got ${piece.x}`);
  });

  it('I piece wall kicks when near right edge', () => {
    initBoard();
    const piece = makePiece('I', ['A', 'B', 'C', 'D']);
    piece.x = COLS - 4; // at right edge, horizontal
    const result = rotatePiece(piece, 1);
    assert(result === true, 'Should successfully rotate with wall kick');
  });

  it('Rotation fails when completely blocked', () => {
    initBoard();
    // Fill the board around a piece so it can't rotate
    const piece = makePiece('T', ['A', 'B', 'C', 'D']);
    piece.x = 0;
    piece.y = 0;
    // Block all surrounding cells
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 6; x++) {
        board[y][x] = { letter: 'X', color: '#000' };
      }
    }
    // Clear only the piece's own cells
    for (const [cx, cy] of piece.cells) {
      board[piece.y + cy][piece.x + cx] = null;
    }
    const origRot = piece.rotation;
    const origCells = piece.cells.map(c => [...c]);
    const origLetters = [...piece.letters];
    const result = rotatePiece(piece, 1);
    assert(result === false, 'Rotation should fail when blocked');
    assert(piece.rotation === origRot, 'Rotation index should not change when blocked');
    assert(arrEq(piece.letters, origLetters), 'Letters should not change when rotation fails');
    assert(cellsEq(piece.cells, origCells), 'Cells should not change when rotation fails');
  });
});

// --- Rotation index tracking ---
describe('Rotation index tracking', () => {
  for (const name of SHAPE_NAMES) {
    it(`${name} piece: rotation index cycles correctly CW`, () => {
      initBoard();
      const piece = makePiece(name, ['A', 'B', 'C', 'D']);
      const numRots = SHAPES[name].length;
      for (let i = 0; i < numRots; i++) {
        assert(piece.rotation === i % numRots,
          `Before rotation ${i}: expected rot=${i % numRots}, got ${piece.rotation}`);
        rotatePiece(piece, 1);
      }
      assert(piece.rotation === 0, `After full cycle: expected rot=0, got ${piece.rotation}`);
    });
  }
});

// --- Visual rendering sanity (for debugging) ---
describe('Visual rendering sanity', () => {
  it('I piece horizontal renders as a row', () => {
    initBoard();
    const piece = makePiece('I', ['A', 'B', 'C', 'D']);
    const render = renderPiece(piece);
    assert(render === 'A B C D', `Expected 'A B C D', got:\n${render}`);
  });

  it('I piece vertical renders as a column', () => {
    initBoard();
    const piece = makePiece('I', ['A', 'B', 'C', 'D']);
    rotatePiece(piece, 1);
    const render = renderPiece(piece);
    // CW rotation preserves reading order: left→right becomes top→bottom
    assert(render === 'A\nB\nC\nD', `Expected column A/B/C/D, got:\n${render}`);
  });

  it('O piece renders as 2x2 square', () => {
    initBoard();
    const piece = makePiece('O', ['A', 'B', 'C', 'D']);
    const render = renderPiece(piece);
    // Cell order: [0,0]=A [1,0]=B [0,1]=C [1,1]=D
    assert(render === 'A B\nC D', `Expected 'A B\\nC D', got:\n${render}`);
  });

  it('O piece after CW renders as 2x2 with rotated letters', () => {
    initBoard();
    const piece = makePiece('O', ['A', 'B', 'C', 'D']);
    rotatePiece(piece, 1);
    const render = renderPiece(piece);
    assert(render === 'C A\nD B', `Expected 'C A\\nD B', got:\n${render}`);
  });
});

// --- SRS spawn orientation tests ---
describe('SRS-correct spawn orientations', () => {
  it('T piece spawns with nub on top: .X. / XXX', () => {
    initBoard();
    const piece = makePiece('T', ['A', 'B', 'C', 'D']);
    // State 0: [1,0],[0,1],[1,1],[2,1]
    const render = renderPiece(piece);
    assert(render === '. A .\nB C D', `T spawn should be .X./XXX, got:\n${render}`);
  });

  it('T piece CW rotation: nub points right', () => {
    initBoard();
    const piece = makePiece('T', ['A', 'B', 'C', 'D']);
    rotatePiece(piece, 1);
    const render = renderPiece(piece);
    assert(render === 'B .\nC A\nD .', `T CW should be X./XX/X., got:\n${render}`);
  });

  it('T piece 180 rotation: nub on bottom: XXX / .X.', () => {
    initBoard();
    const piece = makePiece('T', ['A', 'B', 'C', 'D']);
    rotatePiece(piece, 1);
    rotatePiece(piece, 1);
    const render = renderPiece(piece);
    assert(render === 'D C B\n. A .', `T 180 should be XXX/.X., got:\n${render}`);
  });

  it('T piece CCW rotation: nub points left', () => {
    initBoard();
    const piece = makePiece('T', ['A', 'B', 'C', 'D']);
    rotatePiece(piece, -1);
    const render = renderPiece(piece);
    assert(render === '. D\nA C\n. B', `T CCW should be .X/XX/.X, got:\n${render}`);
  });

  it('L piece spawns with corner top-right: ..X / XXX', () => {
    initBoard();
    const piece = makePiece('L', ['A', 'B', 'C', 'D']);
    // State 0: [2,0],[0,1],[1,1],[2,1]
    const render = renderPiece(piece);
    assert(render === '. . A\nB C D', `L spawn should be ..X/XXX, got:\n${render}`);
  });

  it('L piece CW rotation: X. / X. / XX', () => {
    initBoard();
    const piece = makePiece('L', ['A', 'B', 'C', 'D']);
    rotatePiece(piece, 1);
    const render = renderPiece(piece);
    assert(render === 'B .\nC .\nD A', `L CW should be X./X./XX, got:\n${render}`);
  });

  it('L piece 180: XXX / X..', () => {
    initBoard();
    const piece = makePiece('L', ['A', 'B', 'C', 'D']);
    rotatePiece(piece, 1);
    rotatePiece(piece, 1);
    const render = renderPiece(piece);
    assert(render === 'D C B\nA . .', `L 180 should be XXX/X.., got:\n${render}`);
  });

  it('L piece CCW: XX / .X / .X', () => {
    initBoard();
    const piece = makePiece('L', ['A', 'B', 'C', 'D']);
    rotatePiece(piece, -1);
    const render = renderPiece(piece);
    assert(render === 'A D\n. C\n. B', `L CCW should be XX/.X/.X, got:\n${render}`);
  });

  it('J piece spawns with corner top-left: X.. / XXX', () => {
    initBoard();
    const piece = makePiece('J', ['A', 'B', 'C', 'D']);
    // State 0: [0,0],[0,1],[1,1],[2,1] → X../XXX
    const render = renderPiece(piece);
    assert(render === 'A . .\nB C D', `J spawn should be X../XXX, got:\n${render}`);
  });
});

// --- Summary ---
console.log('\n=========================');
if (failed === 0) {
  console.log(`\x1b[32m✓ All ${passed} tests passed\x1b[0m`);
} else {
  console.log(`\x1b[31m✗ ${failed} failed\x1b[0m, ${passed} passed`);
}
process.exit(failed > 0 ? 1 : 0);
