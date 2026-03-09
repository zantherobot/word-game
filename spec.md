# Word Tetris — Game Spec

## Concept
A Tetris-style browser game where lettered blocks fall and are cleared by forming valid English words instead of filling lines.

## Platform
- Web browser (HTML, CSS, JavaScript)
- No framework required — vanilla JS with Canvas or DOM rendering

## Core Mechanics

### Board
- 10 columns x 20 rows (classic Tetris dimensions)
- Standard grid-based playfield

### Falling Pieces
- **Tetrominoes** (classic Tetris shapes: I, O, T, S, Z, L, J)
- Each cell of a tetromino contains a **letter**
- Player can **move** (left/right), **rotate**, **soft drop**, and **hard drop** pieces — same controls as Tetris

### Letter Distribution
- **Adaptive** — letter selection is biased toward letters that can form words with what's already on the board
- Ensures the game stays playable and doesn't fill up with unusable letters

### Word Detection
- **Automatic** — the game continuously scans the board after each piece locks
- Words are detected **horizontally** (left-to-right) and **vertically** (top-to-bottom)
- **Minimum word length: 3 letters**
- Words must be contiguous (no gaps)

### Word Clearing
- When a valid word is detected, those letter blocks are **removed** from the board
- Blocks above cleared letters **fall straight down** (column-based gravity)
- After settling, the board is re-scanned for new words (chain/cascade clears possible)

### Dictionary
- Use a reasonable English word list (start simple, can swap to a more comprehensive list later)
- ~10-20k common words is a good starting point

## Scoring
- **Word length based:**
  - 3 letters: 100 points
  - 4 letters: 200 points
  - 5 letters: 400 points
  - 6 letters: 800 points
  - 7+ letters: 1600 points
- Chain/cascade bonus: multiply by chain count (x2 for 2nd word in a cascade, x3 for 3rd, etc.)

## Game Over
- Same as Tetris: game ends when a new piece cannot spawn because the top of the board is blocked

## Speed / Difficulty
- Pieces fall faster over time (level-based, like Tetris)
- Level increases every N words cleared (not lines)

## Controls
| Action      | Key              |
|-------------|------------------|
| Move left   | Left arrow / A   |
| Move right  | Right arrow / D  |
| Rotate CW   | Up arrow / W     |
| Rotate CCW  | Z                |
| Soft drop   | Down arrow / S   |
| Hard drop   | Space            |
| Pause       | Escape / P       |

## UI Elements
- Game board (center)
- Next piece preview
- Score display
- Level display
- Words cleared count

## Open Questions / Future Ideas
- Sound effects and music
- Mobile touch controls
- Multiplayer mode
- Power-ups or special blocks (wildcard, bomb, etc.)
- High score persistence (localStorage)
