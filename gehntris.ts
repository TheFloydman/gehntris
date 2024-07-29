import { Board, PieceTemplate, PieceInPlay, svgMain, svgUpcoming, svgStorage } from "./gehntris-objects";

const colorCombos = [
    "#FF0000", /* red */
    "#00FF00", /* green */
    "#FFAF2E", /* orange */
    "#0000FF", /* blue */
    "#8D28B8", /* violet */
    "#FFFF00" /* yellow */
];
const randomIndices: number[] = [];
while (randomIndices.length < colorCombos.length) {
    var random = Math.floor(Math.random() * colorCombos.length);
    if (randomIndices.indexOf(random) === -1 && random < colorCombos.length) {
        randomIndices.push(random);
    }
}
const allTemplates: PieceTemplate[] = [];

const squareSize = 8;
const boardSize = { x: 10, y: 25 };
const upcomingSize = { x: 5, y: 4 };
const storageSize = { x: 5, y: 5 };
const board: Board = new Board(squareSize, boardSize.x, boardSize.y);

let tickTime = 1000;
let tickTimer: NodeJS.Timeout;
let pieceInPlay: PieceInPlay;
let pieceUpcoming: PieceInPlay;
let pieceStored: PieceInPlay;
let okayToAddPiece = true;
let isGameOver = false;
let isPaused = true;
let score = 0;
let linesCleared = 0;
let gameTicks = 0;
let actionHandled = false;
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let touchTime = 50;
let touchTimer: NodeJS.Timeout = undefined;
let timeDown = 0;
let cancelNext = false;
let skipNextDown = false;
let skipTicks = 0;
let swappedThisTurn = false;
let mouseDownOverPauseButton = false;
let mouseDownInStorage = false;

export async function onBodyLoad() {
    await setupPieceTemplates();
    setBoardProperties();
    addEventListeners();
}

async function setupPieceTemplates() {
    const templates = await fetch("./templates.json");
    const json = await templates.json();
    for (let i = 0; i < json.templates.length; i++) {
        const template = json.templates[i];
        const pieceTemplate = new PieceTemplate(template.shape, colorCombos[randomIndices[i]], template.weight);
        allTemplates.push(pieceTemplate);
    }
}

function setBoardProperties() {
    svgMain().setAttribute("viewBox", `0 0 ${boardSize.x * squareSize} ${boardSize.y * squareSize}`);

    svgUpcoming().setAttribute("viewBox", `0 0 ${upcomingSize.x * squareSize} ${upcomingSize.y * squareSize}`);

    svgStorage().setAttribute("viewBox", `0 0 ${storageSize.x * squareSize} ${storageSize.y * squareSize}`);

    addPieceToWaiting();
}

function addPieceToWaiting() {
    const totalWeight: number = allTemplates.map(template => template.weight).reduce((sum, weight) => sum + weight, 0);
    let currentValue = 0;
    const weightMap = allTemplates.reduce((map, template) => {
        map.set([currentValue, currentValue + (template.weight / totalWeight)], template);
        currentValue += template.weight / totalWeight;
        return map;
    }, new Map<number[], PieceTemplate>());
    let chosenTemplate: PieceTemplate | undefined;
    const entries = weightMap.entries();
    while (!chosenTemplate) {
        const random = Math.random();
        for (const [range, template] of entries) {
            if (random >= range[0] && random <= range[1]) {
                chosenTemplate = template;
            }
        }
    }
    const foo = new PieceInPlay(chosenTemplate, true);
    pieceUpcoming = foo;
}

function storePiece() {
    let pieceToStore = pieceInPlay;
    addPieceToBoard(pieceStored != undefined);
    swappedThisTurn = true;
    pieceStored = pieceToStore;
    pieceStored.stored = true;
    pieceStored.setPos(0, 0);
    clearInterval(tickTimer);
    tickTimer = undefined;
    tick();
    skipTicks++;
}

function addPieceToBoard(fromStorage: boolean = false) {
    if (fromStorage) {
        pieceInPlay = pieceStored;
        pieceInPlay.setPos(3, 0);
        pieceInPlay.stored = false;
    } else {
        pieceInPlay = pieceUpcoming;
        pieceInPlay.setPos(3, 0)
        pieceInPlay.waiting = false;
        addPieceToWaiting();
        okayToAddPiece = false;
    }
}

function convertPiece(piece: PieceInPlay): boolean {
    const continueGame = piece.convert(board);
    if (continueGame) {
        pieceInPlay = undefined;
        okayToAddPiece = true;
    }
    piece.draw(0, 0, board);
    addToScore(5);
    return continueGame;
}

function clearLines() {
    let currentLinesCleared = 0;
    let fullLine = scanForFullLines();
    while (fullLine >= 0) {
        currentLinesCleared += 1;
        for (let i = fullLine; i > 0; i--) {
            for (let j = 0; j < board.state[i].length; j++) {
                if (board.state[i - 1][j]) {
                    board.state[i][j] = board.state[i - 1][j];
                    board.state[i][j].y += 1;
                } else {
                    board.state[i][j] = undefined;
                }
            }
        }
        // Clear the top row
        for (let j = 0; j < board.state[0].length; j++) {
            board.state[0][j] = undefined;
        }
        fullLine = scanForFullLines();
    }
    addToScore(currentLinesCleared == 5 ? currentLinesCleared * 125 : currentLinesCleared * 25);
    increaseLinesCleared(currentLinesCleared);
    swappedThisTurn = false;
}

function addToScore(points: number) {
    score += points;
    setScore(score);
}

function setScore(score: number) {
    document.getElementById("score-value").innerHTML = score.toString();
}

function increaseLinesCleared(lines: number) {
    linesCleared += lines;
    setLevel(Math.floor(linesCleared / 5) + 1);
}

function setLevel(level: number) {
    document.getElementById("level-value").innerHTML = level.toString();
    tickTime = Math.max(50, 1000 - (50 * (level + 1)));
    clearInterval(tickTimer);
    startTickTimer();
}

function scanForFullLines(): number {
    for (let i = 0; i < board.state.length; i++) {
        let complete = true;
        for (let j = 0; j < board.state[i].length; j++) {
            if (!board.state[i][j]) {
                complete = false;
                break;
            }
        }
        if (complete) {
            return i;
        }
    }
    return -1;
}

function doGameOver() {
    clearInterval(tickTimer);
    tickTimer = undefined;
    const gameOverSvg = <SVGElement><unknown>document.getElementById("game-over").cloneNode(true);
    svgMain().append(gameOverSvg);
    document.getElementById("pause-button").innerHTML = "Restart";
    isGameOver = true;
    board.clear();
}

export function togglePause() {
    if (isGameOver) {
        svgMain().innerHTML = "";
        gameTicks = 0;
        score = 0;
        linesCleared = 0;
        setScore(0);
        setLevel(0);
        isGameOver = false;
        isPaused = false;
        tickTime = 1000;
        startTickTimer();
        document.getElementById("pause-button").innerHTML = "Pause";
        return;
    }
    isPaused = !isPaused;
    if (isPaused) {
        doPause();
    } else {
        undoPause();
    }
}

function doPause() {
    document.getElementById("pause-button").innerHTML = "Resume";
    clearInterval(tickTimer);
    tickTimer = undefined;
    const pauseSvg = <SVGElement><unknown>document.getElementById("pause").cloneNode(true);
    pauseSvg.id = "pause-copy";
    svgMain().append(pauseSvg);
}

function undoPause() {
    document.getElementById("pause-button").innerHTML = "Pause";
    document.getElementById("pause-copy")?.remove();
    startTickTimer();
}

function startTickTimer() {
    clearInterval(tickTimer);
    tickTimer = setInterval(tick, tickTime);
    tick();
}

function tick() {
    if (skipTicks <= 0) {

        if (isGameOver) {
            doGameOver();
            return;
        }

        svgMain().innerHTML = "";
        svgUpcoming().innerHTML = "";
        svgStorage().innerHTML = "";

        // Draw all stationary squares.
        for (let i = 0; i < board.state.length; i++) {
            for (let j = 0; j < board.state[i].length; j++) {
                if (board.state[i][j] != undefined) {
                    board.state[i][j].draw(0, 0, board, svgMain());
                }
            }
        }

        if (!isPaused) {
            if (pieceInPlay) {
                pieceInPlay.ticksAlive++;
                if (pieceInPlay.canMove(0, 1, board)) {
                    if (pieceInPlay.ticksAlive * tickTime > 1000 && !skipNextDown) {
                        pieceInPlay.move(0, 1, board);
                    }
                } else {
                    convertAndClearLines();
                    if (!isGameOver) {
                        return;
                    }
                }
            }

            if (okayToAddPiece) {
                addPieceToBoard();
            }
        }

        pieceUpcoming.draw(0, 0, board);

        if (pieceInPlay) {
            pieceInPlay.draw(0, 0, board);
        }

        if (pieceStored) {
            pieceStored.draw(0, 0, board);
        }

        skipNextDown = false;
        gameTicks++;
    } else {
        skipTicks--;
    }
}

function convertAndClearLines() {
    isGameOver = !convertPiece(pieceInPlay);
    clearLines();
    clearInterval(touchTimer);
    touchTimer = undefined;
    cancelNext = true;
}

function addEventListeners() {

    const pauseButton: HTMLButtonElement = <HTMLButtonElement><unknown>document.getElementById("pause-button");

    ["mousedown", "touchstart", "pointerdown"].forEach(eventName => {
        svgStorage().addEventListener(eventName, (event) => {
            mouseDownInStorage = true;
        });
        pauseButton.addEventListener(eventName, (event) => {
            mouseDownOverPauseButton = true;
        });
    });
    ["mouseup", "touchend", "pointerup"].forEach(eventName => {
        svgStorage().addEventListener(eventName, (event) => {
            if (mouseDownInStorage && !swappedThisTurn) {
                storePiece();
                rotatePiece();
                rotatePiece();
                rotatePiece();
            }
            mouseDownInStorage = false;
        });
        pauseButton.addEventListener(eventName, (event) => {
            mouseDownOverPauseButton = false;
        });
    });
    ["mouseleave", "touchcancel", "pointercancel"].forEach(eventName => {
        svgStorage().addEventListener(eventName, (event) => {
            mouseDownInStorage = false;
        });
        pauseButton.addEventListener(eventName, (event) => {
            mouseDownOverPauseButton = false;
        });
    });

    // Event listener for keyboard input
    document.addEventListener("keydown", event => {
        if (!isGameOver && pieceInPlay) {
            if (event.code == "Escape") {
                togglePause();
            }
            if (!isPaused) {
                if (event.code == "ArrowLeft" || event.code == "KeyA") {
                    movePieceLeft();
                } else if (event.code == "ArrowRight" || event.code == "KeyD") {
                    movePieceRight();
                } else if (event.code == "ArrowDown" || event.code == "KeyS") {
                    movePieceDown();
                } else if (event.code == "ArrowUp" || event.code == "KeyW") {
                    rotatePiece();
                } else if (event.code == "Space") {
                    dropPiece();
                } else if (event.code == "Tab" && !swappedThisTurn) {
                    storePiece();
                }
            }
            event.preventDefault();
        }
    });


    // Mouse/touch move.
    ["mousemove", "touchmove", "pointermove", "drag"].forEach(eventName => {
        document.addEventListener(eventName, function (event: MouseEvent | TouchEvent | PointerEvent | DragEvent) {
            if (event instanceof TouchEvent) {
                touchEndX = event.changedTouches[0].clientX;
                touchEndY = event.changedTouches[0].clientY;
            } else {
                if (mouseDownOverPauseButton) return;
                touchEndX = event.clientX;
                touchEndY = event.clientY;
            }
        });
    });

    // Mouse/touch down.
    ["mousedown", "touchstart", "pointerdown"].forEach(eventName => {
        document.addEventListener(eventName, function (event: MouseEvent | TouchEvent | PointerEvent | DragEvent) {
            if (touchTimer == undefined) {
                cancelNext = false;
                if (event instanceof TouchEvent) {
                    touchStartX = event.touches[0].clientX;
                    touchStartY = event.touches[0].clientY;
                } else {
                    if (mouseDownOverPauseButton) return;
                    touchStartX = event.clientX;
                    touchStartY = event.clientY;
                }
                timeDown = 0;
                clearInterval(touchTimer);
                touchTimer = setInterval(touchTimerUpdater, touchTime);
            }
            cancelNext = false;
        });
    });

    // Mouse/touch up.
    ["mouseup", "mouseleave", "touchend", "touchcancel", "pointerup", "pointercancel"].forEach(eventName => {
        document.addEventListener(eventName, function (event: MouseEvent | TouchEvent | PointerEvent | DragEvent) {
            if (event instanceof TouchEvent) {
                touchEndX = event.changedTouches[0].clientX;
                touchEndY = event.changedTouches[0].clientY;
            } else {
                if (mouseDownOverPauseButton) return;
                touchEndX = event.clientX;
                touchEndY = event.clientY;
            }
            clearInterval(touchTimer);
            touchTimer = undefined;
            cancelNext = true;
            handleMouseAndTouch();
        });
    });

}

function touchTimerUpdater() {
    actionHandled = false;
    timeDown += touchTime;
    if (timeDown % 200 == 0) {
        handleMouseAndTouch();
    }
}

function handleMouseAndTouch() {
    if (!isGameOver && !isPaused && pieceInPlay && !actionHandled) {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Determine if the swipe was primarily horizontal or vertical
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 50 && !cancelNext) {
                movePieceRight();
            } else if (deltaX < -50 && !cancelNext) {
                movePieceLeft();
            } else if (timeDown < 250) {
                rotatePiece();
            }
        } else {
            // Vertical swipe
            if (deltaY > 50 && !cancelNext) {
                movePieceDown();
            } else if (deltaY < -50 && timeDown < 250) {
                dropPiece();
            } else if (timeDown < 250) {
                rotatePiece();
            }
        }
        actionHandled = true;
        cancelNext = false;
    }
}

function movePieceLeft() {
    if (pieceInPlay.canMove(-1, 0, board)) {
        pieceInPlay.move(-1, 0, board);
        redrawPieceInPlay();
    }
}

function movePieceRight() {
    if (pieceInPlay.canMove(1, 0, board)) {
        pieceInPlay.move(1, 0, board);
        redrawPieceInPlay();
    }
}

function movePieceDown() {
    if (pieceInPlay.canMove(0, 1, board)) {
        pieceInPlay.move(0, 1, board);
        redrawPieceInPlay();
        skipNextDown = true;
    }
}

function dropPiece() {
    if (pieceInPlay.canMove(0, 1, board)) {
        for (let i = 0; i < pieceInPlay.squares.length; i++) {
            pieceInPlay.squares[i].svgElement.remove();
        }
        pieceInPlay.drop(board);
        skipTicks++;
        convertAndClearLines();
    }
}

function rotatePiece() {
    for (let i = 0; i < pieceInPlay.squares.length; i++) {
        pieceInPlay.squares[i].svgElement.remove();
    }
    pieceInPlay.rotate(board);
    pieceInPlay.draw(0, 0, board);
}

function redrawPieceInPlay() {
    for (let i = 0; i < pieceInPlay.squares.length; i++) {
        pieceInPlay.squares[i].svgElement.remove();
    }
    pieceInPlay.draw(0, 0, board);
}