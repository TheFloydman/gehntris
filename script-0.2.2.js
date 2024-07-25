class Board {
    constructor(squareSize, width, height) {
        this.state = [];
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
    constructor(shape, fill) {
        this.shape = shape;
        this.fill = fill;
    }
}
class Square {
    constructor(x, y, fill, isShadow) {
        this.x = x;
        this.y = y;
        this.fill = fill;
        this.isShadow = isShadow;
    }
    draw(x, y, board, svgCanvas, waiting = false) {
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
    canMove(x, y, board) {
        const newX = this.x + x;
        const newY = this.y + y;
        const newSpaceOccupied = board.state[newY] && board.state[newY][newX];
        const leftWallCrossed = newX < 0;
        const rightWallCrossed = newX >= board.width;
        const ceilingCrossed = newY < 0;
        const floorCrossed = newY >= board.height;
        return !newSpaceOccupied && !leftWallCrossed && !rightWallCrossed && !ceilingCrossed && !floorCrossed;
    }
    move(x, y, board) {
        if (this.canMove(x, y, board)) {
            this.setPos(x, y, board);
        }
    }
    setPos(x, y, board) {
        this.x += x;
        this.y += y;
    }
}
class PieceInPlay {
    constructor(template, waiting = false) {
        this.squares = [];
        this.shadowSquares = [];
        this.ticksAlive = 0;
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
    draw(x, y, board, svgInfo, svgMain) {
        if (!this.waiting) {
            this.drawShadow(board, svgInfo, svgMain);
        }
        for (let i = 0; i < this.squares.length; i++) {
            this.squares[i].draw(x, y, board, this.waiting ? svgInfo : svgMain, this.waiting);
        }
    }
    drawShadow(board, svgInfo, svgMain) {
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
    canMove(x, y, board) {
        for (let i = 0; i < this.squares.length; i++) {
            const currentSquare = this.squares[i];
            if (!currentSquare.canMove(x, y, board)) {
                return false;
            }
        }
        return true;
    }
    move(x, y, board) {
        let canMove = this.canMove(x, y, board);
        if (canMove) {
            for (let i = 0; i < this.squares.length; i++) {
                const currentSquare = this.squares[i];
                currentSquare.move(x, y, board);
            }
        }
    }
    setPos(x, y, board) {
        for (let i = 0; i < this.squares.length; i++) {
            const currentSquare = this.squares[i];
            currentSquare.setPos(x, y, board);
        }
    }
    drop(board) {
        let yOffset = 1;
        while (this.canMove(0, yOffset, board)) {
            yOffset++;
        }
        yOffset--;
        this.move(0, yOffset, board);
    }
    convert(board) {
        for (let i = 0; i < this.squares.length; i++) {
            const currentSquare = this.squares[i];
            if (board.state[currentSquare.y][currentSquare.x]) {
                return false;
            }
            board.state[currentSquare.y][currentSquare.x] = currentSquare;
        }
        return true;
    }
    rotate(board) {
        const offsetX = Math.min(...this.squares.map(square => square.x));
        const offsetY = Math.min(...this.squares.map(square => square.y));
        const output = this.rotate2DArray(this.template.shape);
        const newSquares = [];
        for (let i = 0; i < output.length; i++) {
            for (let j = 0; j < output[i].length; j++) {
                if (output[i][j]) {
                    newSquares.push(new Square(offsetX + j, offsetY + i, this.fill, false));
                }
            }
        }
        let minX = Math.min(...newSquares.map(square => square.x));
        let maxX = Math.max(...newSquares.map(square => square.x));
        let minY = Math.min(...newSquares.map(square => square.y));
        let maxY = Math.max(...newSquares.map(square => square.y));
        let moveX = 0;
        let moveY = 0;
        if (minX < 0) {
            moveX = -minX;
        }
        else if (maxX >= board.width) {
            moveX = board.width - 1 - maxX;
        }
        if (minY < 0) {
            moveY = -minY;
        }
        else if (maxY >= board.height) {
            moveY = board.height - 1 - maxY;
        }
        for (let square of newSquares) {
            square.x += moveX;
            square.y += moveY;
        }
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
    rotate2DArray(array) {
        const result = [];
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
const templateStraight = new PieceTemplate([[true, true, true, true, true]], colorCombos[randomIndices[5]]);
const allTemplates = [templatePrison, templateBoiler, templateTemple, templateSurvey, templateJungle, templateStraight];
const squareSize = 8;
const boardSize = { x: 10, y: 25 };
const infoSize = { x: 5, y: 4 };
const board = new Board(squareSize, boardSize.x, boardSize.y);
let svgMain;
let svgInfo;
let tickTime = 1000;
let tickTimer = undefined;
let pieceInPlay;
let pieceInWaiting;
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
let touchTimer = undefined;
let timeDown = 0;
let cancelNext = false;
let skipNextDown = false;
let skipTicks = 0;
let mouseDown = false;
function onBodyLoad() {
    setBoardProperties();
    addEventListeners();
}
function setBoardProperties() {
    svgMain = document.getElementById("svg-main");
    svgMain.setAttribute("viewBox", `0 0 ${boardSize.x * squareSize} ${boardSize.y * squareSize}`);
    svgMain.style.maxWidth = "256px";
    svgMain.style.width = "100%";
    svgInfo = document.getElementById("svg-info");
    svgInfo.setAttribute("viewBox", `0 0 ${infoSize.x * squareSize} ${infoSize.y * squareSize}`);
    svgInfo.style.maxWidth = "128px";
    svgInfo.style.width = "100%";
    addPieceToWaiting();
}
function addPieceToWaiting() {
    const randomPiece = allTemplates[Math.floor(Math.random() * allTemplates.length)];
    const foo = new PieceInPlay(randomPiece, true);
    pieceInWaiting = foo;
}
function addPieceToBoard() {
    pieceInPlay = pieceInWaiting;
    pieceInPlay.move(3, 0, board);
    pieceInPlay.waiting = false;
    addPieceToWaiting();
    okayToAddPiece = false;
}
function convertPiece(piece) {
    const continueGame = piece.convert(board);
    if (continueGame) {
        pieceInPlay = undefined;
        okayToAddPiece = true;
    }
    piece.draw(0, 0, board, svgInfo, svgMain);
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
                }
                else {
                    board.state[i][j] = undefined;
                }
            }
        }
        for (let j = 0; j < board.state[0].length; j++) {
            board.state[0][j] = undefined;
        }
        fullLine = scanForFullLines();
    }
    addToScore(currentLinesCleared == 5 ? currentLinesCleared * 125 : currentLinesCleared * 25);
    increaseLinesCleared(currentLinesCleared);
}
function addToScore(points) {
    score += points;
    setScore(score);
}
function setScore(score) {
    document.getElementById("score-value").innerHTML = score.toString();
}
function increaseLinesCleared(lines) {
    linesCleared += lines;
    setLevel(Math.floor(linesCleared / 5) + 1);
}
function setLevel(level) {
    levelGlobal = level;
    document.getElementById("level-value").innerHTML = level.toString();
    tickTime = 1000 - (50 * (level + 1));
}
function scanForFullLines() {
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
    const gameOverSvg = document.getElementById("game-over").cloneNode(true);
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
    }
    else {
        undoPause();
    }
}
function doPause() {
    document.getElementById("pause-button").innerHTML = "Resume";
    clearInterval(tickTimer);
    const pauseSvg = document.getElementById("pause").cloneNode(true);
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
        svgInfo.innerHTML = "";
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
                }
                else {
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
        pieceInWaiting.draw(0, 0, board, svgInfo, svgMain);
        if (pieceInPlay) {
            pieceInPlay.draw(0, 0, board, svgInfo, svgMain);
        }
        if (isGameOver) {
            doGameOver();
        }
        skipNextDown = false;
        gameTicks++;
    }
    else {
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
    const pauseButton = document.getElementById("pause-button");
    pauseButton.addEventListener("click", (event) => {
        pauseButton.blur();
        event.stopPropagation();
    });
    document.addEventListener("keydown", event => {
        if (!isGameOver && pieceInPlay) {
            if (event.code == "Escape") {
                togglePause();
            }
            if (!isPaused) {
                if (event.code == "ArrowLeft" || event.code == "KeyA") {
                    movePieceLeft();
                }
                else if (event.code == "ArrowRight" || event.code == "KeyD") {
                    movePieceRight();
                }
                else if (event.code == "ArrowDown" || event.code == "KeyS") {
                    movePieceDown();
                }
                else if (event.code == "ArrowUp" || event.code == "KeyW") {
                    rotatePiece();
                }
                else if (event.code == "Space") {
                    dropPiece();
                }
            }
            event.preventDefault();
        }
    });
    ["mousemove", "touchmove", "pointermove", "drag"].forEach(eventName => {
        document.addEventListener(eventName, function (event) {
            if (event instanceof TouchEvent) {
                touchEndX = event.changedTouches[0].clientX;
                touchEndY = event.changedTouches[0].clientY;
            }
            else {
                touchEndX = event.clientX;
                touchEndY = event.clientY;
            }
        });
    });
    ["mousedown", "touchstart", "pointerdown", "dragstart"].forEach(eventName => {
        const gameplayContainer = document.getElementById("gameplay-container");
        document.addEventListener(eventName, function (event) {
            if (event instanceof TouchEvent && event.touches.length !== 1) {
                return;
            }
            if (touchTimer == undefined) {
                cancelNext = false;
                if (event instanceof TouchEvent) {
                    touchStartX = event.touches[0].clientX;
                    touchStartY = event.touches[0].clientY;
                }
                else {
                    touchStartX = event.clientX;
                    touchStartY = event.clientY;
                }
                timeDown = 0;
                clearInterval(touchTimer);
                touchTimer = setInterval(touchTimerUpdater, touchTime);
            }
        }, { passive: false });
    });
    ["mouseup", "mouseleave", "touchend", "touchcancel", "pointerup", "pointercancel", "dragend"].forEach(eventName => {
        document.addEventListener(eventName, function (event) {
            if (event instanceof TouchEvent && event.changedTouches.length !== 1) {
                return;
            }
            if (event instanceof TouchEvent) {
                touchEndX = event.changedTouches[0].clientX;
                touchEndY = event.changedTouches[0].clientY;
            }
            else {
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
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 50) {
                movePieceRight();
            }
            else if (deltaX < -50) {
                movePieceLeft();
            }
            else if (timeDown < 250) {
                rotatePiece();
            }
        }
        else {
            if (deltaY > 50) {
                movePieceDown();
            }
            else if (deltaY < -50 && timeDown < 250) {
                dropPiece();
            }
            else if (timeDown < 250) {
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
    pieceInPlay.draw(0, 0, board, svgInfo, svgMain);
}
function redrawPieceInPlay() {
    for (let i = 0; i < pieceInPlay.squares.length; i++) {
        pieceInPlay.squares[i].svgElement.remove();
    }
    pieceInPlay.draw(0, 0, board, svgInfo, svgMain);
}
//# sourceMappingURL=script-0.2.2.js.map