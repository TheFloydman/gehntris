class Board {

    squareSize: number;
    width: number;
    height: number;
    state: Square[][] = [];

    constructor(squareSize: number, width: number, height: number) {
        this.squareSize = squareSize;
        this.width = width;
        this.height = height;
        this.clear();
    }

    clear() {
        for (let i = 0; i < this.height; i++) {
            this.state[i] = [];
            for (let j = 0; j < this.width; j++) {
                this.state[i][j] = undefined;
            }
        }
    }

}

class PieceTemplate {

    shape: boolean[][];
    fill: string;

    constructor(shape: boolean[][], fill: string) {
        this.shape = shape;
        this.fill = fill;
    }

}

class Square {

    x: number;
    y: number;
    piece: PieceInPlay;
    svgElement: SVGElement;
    fill: string;
    isShadow: boolean;

    constructor(x: number, y: number, fill: string, isShadow: boolean) {
        this.x = x;
        this.y = y;
        this.fill = fill;
        this.isShadow = isShadow;
    }

    draw(x: number, y: number, board: Board, svgCanvas: SVGElement, waiting: boolean = false) {
        this.svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");

        const svgBorderTL = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        svgBorderTL.setAttribute("width", board.squareSize.toString());
        svgBorderTL.setAttribute("height", board.squareSize.toString());
        svgBorderTL.setAttribute("x", (x + (this.x * board.squareSize)).toString());
        svgBorderTL.setAttribute("y", (y + (this.y * board.squareSize)).toString());
        svgBorderTL.setAttribute("fill", "#666666");

        const svgBorderBR = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        svgBorderBR.setAttribute("width", (board.squareSize - 1).toString());
        svgBorderBR.setAttribute("height", (board.squareSize - 1).toString());
        svgBorderBR.setAttribute("x", (x + (this.x * board.squareSize) + 1).toString());
        svgBorderBR.setAttribute("y", (y + (this.y * board.squareSize) + 1).toString());
        svgBorderBR.setAttribute("fill", "#CCCCCC");

        const svgBorderBL = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        svgBorderBL.setAttribute("width", "1");
        svgBorderBL.setAttribute("height", "1");
        svgBorderBL.setAttribute("x", (x + (this.x * board.squareSize)).toString());
        svgBorderBL.setAttribute("y", (y + (this.y * board.squareSize) + 7).toString());
        svgBorderBL.setAttribute("fill", "#999999");

        const svgBorderTR = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        svgBorderTR.setAttribute("width", "1");
        svgBorderTR.setAttribute("height", "1");
        svgBorderTR.setAttribute("x", (x + (this.x * board.squareSize) + 7).toString());
        svgBorderTR.setAttribute("y", (y + (this.y * board.squareSize)).toString());
        svgBorderTR.setAttribute("fill", "#999999");

        const svgBorderFill = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        svgBorderFill.setAttribute("width", (board.squareSize - 2).toString());
        svgBorderFill.setAttribute("height", (board.squareSize - 2).toString());
        svgBorderFill.setAttribute("x", (x + (this.x * board.squareSize) + 1).toString());
        svgBorderFill.setAttribute("y", (y + (this.y * board.squareSize) + 1).toString());
        svgBorderFill.setAttribute("fill", "#FFFFFF");

        const svgBorderOverlay = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        svgBorderOverlay.setAttribute("width", board.squareSize.toString());
        svgBorderOverlay.setAttribute("height", board.squareSize.toString());
        svgBorderOverlay.setAttribute("x", (x + (this.x * board.squareSize)).toString());
        svgBorderOverlay.setAttribute("y", (y + (this.y * board.squareSize)).toString());
        svgBorderOverlay.setAttribute("fill", this.fill);
        svgBorderOverlay.setAttribute("fill-opacity", "50%");

        if (!this.isShadow) {
            this.svgElement.append(svgBorderTL, svgBorderBR, svgBorderBL, svgBorderTR, svgBorderFill);
        }
        this.svgElement.append(svgBorderOverlay);
        svgCanvas.append(this.svgElement);
    }

    canMove(x: number, y: number, board: Board): boolean {
        const newX = this.x + x;
        const newY = this.y + y;
        const newSpaceOccupied = board.state[newY] && board.state[newY][newX];
        const leftWallCrossed = newX < 0;
        const rightWallCrossed = newX >= board.width;
        const ceilingCrossed = newY < 0;
        const floorCrossed = newY >= board.height;
        return !newSpaceOccupied && !leftWallCrossed && !rightWallCrossed && !ceilingCrossed && !floorCrossed;
    }

    move(x: number, y: number, board: Board) {
        if (this.canMove(x, y, board)) {
            this.setPos(this.x + x, this.y + y);
        }
    }

    setPos(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

}

class PieceInPlay {

    template: PieceTemplate;
    squares: Square[] = [];
    shadowSquares: Square[] = [];
    border: string;
    fill: string;
    waiting: boolean;
    stored: boolean = false;
    ticksAlive: number = 0;

    constructor(template: PieceTemplate, waiting: boolean = false) {
        this.template = template;
        this.fill = template.fill;
        this.waiting = waiting;
        for (let i = 0; i < template.shape.length; i++) {
            for (let j = 0; j < template.shape[i].length; j++) {
                if (template.shape[i][j]) {
                    this.squares.push(new Square(j, i, this.fill, false));
                }
            }
        }
    }

    draw(x: number, y: number, board: Board) {
        if (!this.waiting && !this.stored) {
            this.drawShadow(board, svgUpcoming, svgMain);
        }
        for (let i = 0; i < this.squares.length; i++) {
            let svgElement = svgMain;
            if (this.waiting) svgElement = svgUpcoming;
            if (this.stored) svgElement = svgStorage;
            this.squares[i].draw(x, y, board, svgElement, this.waiting);
        }
    }

    drawShadow(board: Board, svgInfo: SVGElement, svgMain: SVGElement) {
        for (let i = 0; i < this.shadowSquares.length; i++) {
            this.shadowSquares[i].svgElement.remove();
        }
        this.shadowSquares = [];
        let yOffset = 1;
        while (this.canMove(0, yOffset, board)) {
            yOffset++;
        }
        yOffset--;
        for (let i = 0; i < this.squares.length; i++) {
            this.shadowSquares.push(new Square(this.squares[i].x, this.squares[i].y + yOffset, "#A0A0A0", true));
        }
        for (let i = 0; i < this.shadowSquares.length; i++) {
            this.shadowSquares[i].draw(0, 0, board, svgMain);
        }
    }

    canMove(x: number, y: number, board: Board): boolean {

        for (let i = 0; i < this.squares.length; i++) {
            const currentSquare = this.squares[i];
            if (!currentSquare.canMove(x, y, board)) {
                return false;
            }
        }

        return true;

    }

    move(x: number, y: number, board: Board) {

        let canMove = this.canMove(x, y, board);

        if (canMove) {
            for (let i = 0; i < this.squares.length; i++) {
                const currentSquare = this.squares[i];
                currentSquare.move(x, y, board);
            }
        }

    }

    setPos(x: number, y: number) {
        const minX = Math.min(...this.squares.map(square => square.x));
        const minY = Math.min(...this.squares.map(square => square.y));
        for (let i = 0; i < this.squares.length; i++) {
            const currentSquare = this.squares[i];
            currentSquare.setPos(currentSquare.x - minX + x, currentSquare.y - minY + y);
        }
    }

    drop(board: Board) {
        let yOffset = 1;
        while (this.canMove(0, yOffset, board)) {
            yOffset++;
        }
        yOffset--;
        this.move(0, yOffset, board);
    }

    /** Returns true if the spaces this piece occupies are empty. */
    convert(board: Board): boolean {
        for (let i = 0; i < this.squares.length; i++) {
            const currentSquare = this.squares[i];
            if (board.state[currentSquare.y][currentSquare.x]) {
                return false;
            }
            board.state[currentSquare.y][currentSquare.x] = currentSquare;
        }
        return true;
    }

    rotate(board: Board) {
        const offsetX = Math.min(...this.squares.map(square => square.x));
        const offsetY = Math.min(...this.squares.map(square => square.y));
        const output = this.rotate2DArray(this.template.shape);
        const newSquares: Square[] = [];

        // Generate new squares based on the rotated shape
        for (let i = 0; i < output.length; i++) {
            for (let j = 0; j < output[i].length; j++) {
                if (output[i][j]) {
                    newSquares.push(new Square(offsetX + j, offsetY + i, this.fill, false));
                }
            }
        }

        // Check if the new squares are within bounds and not overlapping existing pieces
        let minX = Math.min(...newSquares.map(square => square.x));
        let maxX = Math.max(...newSquares.map(square => square.x));
        let minY = Math.min(...newSquares.map(square => square.y));
        let maxY = Math.max(...newSquares.map(square => square.y));

        let moveX = 0;
        let moveY = 0;

        if (minX < 0) {
            moveX = -minX;
        } else if (maxX >= board.width) {
            moveX = board.width - 1 - maxX;
        }

        if (minY < 0) {
            moveY = -minY;
        } else if (maxY >= board.height) {
            moveY = board.height - 1 - maxY;
        }

        for (let square of newSquares) {
            square.x += moveX;
            square.y += moveY;
        }

        // Check if the adjusted new squares are valid
        const isValid = newSquares.every(square => {
            const x = square.x;
            const y = square.y;
            return x >= 0 && x < board.width && y >= 0 && y < board.height && (!board.state[y] || !board.state[y][x]);
        });

        if (isValid) {
            this.template = new PieceTemplate(output, this.fill);
            this.squares = newSquares;
        }
    }

    rotate2DArray(array: any[][]) {
        const result: any[] = [];
        array.forEach(function (a, i, aa) {
            a.forEach(function (b, j, bb) {
                result[j] = result[j] || [];
                result[j][aa.length - i - 1] = b;
            });
        });
        return result;
    }

}

const red = "#FF0000";
const green = "#00FF00";
const orange = "#FFAF2E";
const blue = "#0000FF";
const violet = "#8D28B8";
const yellow = "#FFFF00";
const colorCombos = [red, green, orange, blue, violet, yellow];
const randomIndices = [];
while (randomIndices.length < colorCombos.length) {
    var random = Math.floor(Math.random() * colorCombos.length);
    if (randomIndices.indexOf(random) === -1 && random < colorCombos.length) {
        randomIndices.push(random);
    }
}
const templatePrison = new PieceTemplate([[true]], colorCombos[randomIndices[0]]);
const templateBoiler = new PieceTemplate([[true, true], [true, true]], colorCombos[randomIndices[1]]);
const templateTemple = new PieceTemplate([[true, true, false], [true, true, true]], colorCombos[randomIndices[2]]);
const templateSurvey = new PieceTemplate([[true, false], [true, false], [true, true]], colorCombos[randomIndices[3]]);
const templateJungle = new PieceTemplate([[true, true, true, true], [true, true, true, true], [false, true, true, true]], colorCombos[randomIndices[4]]);
const templateStraight = new PieceTemplate([[true, true, true, true, true]], colorCombos[randomIndices[5]])
const allTemplates = [templatePrison, templateBoiler, templateTemple, templateSurvey, templateJungle, templateStraight];

const squareSize = 8;
const boardSize = { x: 10, y: 25 };
const upcomingSize = { x: 5, y: 4 };
const storageSize = { x: 5, y: 5 };
const board: Board = new Board(squareSize, boardSize.x, boardSize.y);

let svgMain: SVGElement;
let svgUpcoming: SVGElement;
let svgStorage: SVGElement;
let tickTime = 1000;
let tickTimer: number = undefined;
let pieceInPlay: PieceInPlay;
let pieceUpcoming: PieceInPlay;
let pieceStored: PieceInPlay;
let okayToAddPiece = true;
let isGameOver = false;
let isPaused = true;
let score = 0;
let levelGlobal = 0;
let linesCleared = 0;
let gameTicks = 0;
let actionHandled = false;
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let touchTime = 50;
let touchTimer: number = undefined;
let timeDown = 0;
let cancelNext = false;
let skipNextDown = false;
let skipTicks = 0;
let mouseDown = false;
let swappedThisTurn = false;
let isMouseOverPauseButton = false;
let mouseDownInStorage = false;

function onBodyLoad() {
    setBoardProperties();
    addEventListeners();
}

function setBoardProperties() {
    svgMain = <SVGElement><unknown>document.getElementById("svg-main");
    svgMain.setAttribute("viewBox", `0 0 ${boardSize.x * squareSize} ${boardSize.y * squareSize}`);

    svgUpcoming = <SVGElement><unknown>document.getElementById("svg-upcoming");
    svgUpcoming.setAttribute("viewBox", `0 0 ${upcomingSize.x * squareSize} ${upcomingSize.y * squareSize}`);

    svgStorage = <SVGElement><unknown>document.getElementById("svg-storage");
    svgStorage.setAttribute("viewBox", `0 0 ${storageSize.x * squareSize} ${storageSize.y * squareSize}`);

    addPieceToWaiting();
}

function addPieceToWaiting() {
    const randomPiece = allTemplates[Math.floor(Math.random() * allTemplates.length)];
    const foo = new PieceInPlay(randomPiece, true);
    pieceUpcoming = foo;
}

function storePiece() {
    let pieceToStore = pieceInPlay;
    addPieceToBoard(pieceStored != undefined);
    swappedThisTurn = true;
    pieceStored = pieceToStore;
    pieceStored.stored = true;
    pieceStored.setPos(0, 0);
    tick();
    skipTicks = 1;
}

function addPieceToBoard(fromStorage: boolean = false) {
    if (fromStorage) {
        pieceInPlay = pieceStored;
        pieceInPlay.setPos(3, -1);
        pieceInPlay.stored = false;
    } else {
        pieceInPlay = pieceUpcoming;
        pieceInPlay.move(3, 0, board)
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
    levelGlobal = level;
    document.getElementById("level-value").innerHTML = level.toString();
    tickTime = 1000 - (50 * (level + 1));
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
    const gameOverSvg = <SVGElement><unknown>document.getElementById("game-over").cloneNode(true);
    svgMain.append(gameOverSvg);
    document.getElementById("pause-button").innerHTML = "Restart";
    isGameOver = true;
    board.clear();
}

function togglePause() {
    if (isGameOver) {
        svgMain.innerHTML = "";
        gameTicks = 0;
        score = 0;
        linesCleared = 0;
        levelGlobal = 0;
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
    const pauseSvg = <SVGElement><unknown>document.getElementById("pause").cloneNode(true);
    pauseSvg.id = "pause-copy";
    svgMain.append(pauseSvg);
}

function undoPause() {
    document.getElementById("pause-button").innerHTML = "Pause";
    document.getElementById("pause-copy")?.remove();
    if (gameTicks == 0) {
        tick();
    }
    startTickTimer();
}

function startTickTimer() {
    tickTimer = setInterval(tick, tickTime);
}

function tick() {
    if (skipTicks == 0) {
        svgMain.innerHTML = "";
        svgUpcoming.innerHTML = "";
        svgStorage.innerHTML = "";

        // Draw all stationary squares.
        for (let i = 0; i < board.state.length; i++) {
            for (let j = 0; j < board.state[i].length; j++) {
                if (board.state[i][j] != undefined) {
                    board.state[i][j].draw(0, 0, board, svgMain);
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

        if (isGameOver) {
            doGameOver();
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
    if (!isGameOver) {
        tick();
    }
}

function addEventListeners() {

    const pauseButton: HTMLButtonElement = <HTMLButtonElement><unknown>document.getElementById("pause-button");
    pauseButton.addEventListener("mouseover", (event) => {
        isMouseOverPauseButton = true;
    });
    pauseButton.addEventListener("mouseout", (event) => {
        isMouseOverPauseButton = false;
    });

    ["mousedown", "touchstart", "pointerdown"].forEach(eventName => {
        svgStorage.addEventListener(eventName, (event) => {
            mouseDownInStorage = true;
        });
    });
    ["mouseup", "touchend", "pointerup"].forEach(eventName => {
        svgStorage.addEventListener(eventName, (event) => {
            if (mouseDownInStorage && !swappedThisTurn) {
                storePiece();
                rotatePiece();
                rotatePiece();
                rotatePiece();
            }
            mouseDownInStorage = false;
        });
    });
    ["mouseleave", "touchcancel", "pointercancel"].forEach(eventName => {
        svgStorage.addEventListener(eventName, (event) => {
            mouseDownInStorage = false;
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
            if (isMouseOverPauseButton) return;
            if (event instanceof TouchEvent) {
                touchEndX = event.changedTouches[0].clientX;
                touchEndY = event.changedTouches[0].clientY;
            } else {
                touchEndX = event.clientX;
                touchEndY = event.clientY;
            }
        });
    });

    // Mouse/touch down.
    ["mousedown", "touchstart", "pointerdown"].forEach(eventName => {
        document.addEventListener(eventName, function (event: MouseEvent | TouchEvent | PointerEvent | DragEvent) {
            if (isMouseOverPauseButton) return;
            if (event instanceof TouchEvent && event.touches.length !== 1) {
                return;
            }
            if (touchTimer == undefined) {
                cancelNext = false;
                if (event instanceof TouchEvent) {
                    touchStartX = event.touches[0].clientX;
                    touchStartY = event.touches[0].clientY;
                } else {
                    touchStartX = event.clientX;
                    touchStartY = event.clientY;
                }
                timeDown = 0;
                clearInterval(touchTimer);
                touchTimer = setInterval(touchTimerUpdater, touchTime);
            }
        }, { passive: false });
    });

    // Mouse/touch up.
    ["mouseup", "mouseleave", "touchend", "touchcancel", "pointerup", "pointercancel"].forEach(eventName => {
        document.addEventListener(eventName, function (event: MouseEvent | TouchEvent | PointerEvent | DragEvent) {
            if (isMouseOverPauseButton) return;
            if (event instanceof TouchEvent && event.changedTouches.length !== 1) {
                return;
            }
            if (event instanceof TouchEvent) {
                touchEndX = event.changedTouches[0].clientX;
                touchEndY = event.changedTouches[0].clientY;
            } else {
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
    if (timeDown % 200 == 0 && !cancelNext) {
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
            if (deltaX > 50) {
                movePieceRight();
            } else if (deltaX < -50) {
                movePieceLeft();
            } else if (timeDown < 250) {
                rotatePiece();
            }
        } else {
            // Vertical swipe
            if (deltaY > 50) {
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