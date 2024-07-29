export class Board {

    squareSize: number;
    width: number;
    height: number;
    state: Square[][] | undefined[][] = [];

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

export class PieceTemplate {

    shape: boolean[][];
    fill: string;
    weight: number;

    constructor(shape: boolean[][], fill: string, weight: number) {
        this.shape = shape;
        this.fill = fill;
        this.weight = weight;
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

        function createSquare(size: number, x: number, y: number, fill: string, opacity: string = "100%"): SVGRectElement {
            const rectElement = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rectElement.setAttribute("width", size.toString());
            rectElement.setAttribute("height", size.toString());
            rectElement.setAttribute("x", x.toString());
            rectElement.setAttribute("y", y.toString());
            rectElement.setAttribute("fill", fill);
            rectElement.setAttribute("fill-opacity", opacity);
            return rectElement;
        }

        const svgBorderTL = createSquare(
            board.squareSize,
            x + (this.x * board.squareSize),
            y + (this.y * board.squareSize),
            "#666666"
        );

        const svgBorderBR = createSquare(
            board.squareSize - 1,
            x + (this.x * board.squareSize) + 1,
            y + (this.y * board.squareSize) + 1,
            "#CCCCCC"
        );

        const svgBorderBL = createSquare(
            1,
            x + (this.x * board.squareSize),
            y + (this.y * board.squareSize) + 7,
            "#999999"
        );

        const svgBorderTR = createSquare(
            1,
            x + (this.x * board.squareSize) + 7,
            y + (this.y * board.squareSize),
            "#999999"
        );

        const svgBorderFill = createSquare(
            board.squareSize - 2,
            x + (this.x * board.squareSize) + 1,
            y + (this.y * board.squareSize) + 1,
            "#FFFFFF"
        );

        const svgBorderOverlay = createSquare(
            board.squareSize,
            x + (this.x * board.squareSize),
            y + (this.y * board.squareSize),
            this.fill,
            "50%"
        );

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

export class PieceInPlay {

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
            this.drawShadow(board);
        }
        for (let i = 0; i < this.squares.length; i++) {
            let svgElement = svgMain();
            if (this.waiting) svgElement = svgUpcoming();
            if (this.stored) svgElement = svgStorage();
            this.squares[i].draw(x, y, board, svgElement, this.waiting);
        }
    }

    drawShadow(board: Board) {
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
            this.shadowSquares[i].draw(0, 0, board, svgMain());
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
            this.template = new PieceTemplate(output, this.fill, 1);
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

export function svgMain(): SVGElement {
    return <SVGElement><unknown>document.getElementById("svg-main");
}

export function svgUpcoming(): SVGElement {
    return <SVGElement><unknown>document.getElementById("svg-upcoming");
}

export function svgStorage(): SVGElement {
    return <SVGElement><unknown>document.getElementById("svg-storage");
}