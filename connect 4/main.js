
// note - the rows and columns start at 0.
function check_column_clicked(board, click_position_x) {
	const board_dimensions = board.getBoundingClientRect();
	
	return Math.ceil(((click_position_x - board_dimensions.x) /
					 board_dimensions.width) * 7) - 1;
}

function check_row_clicked(board, click_position_y) {
	const board_dimensions = board.getBoundingClientRect();
	
	return Math.ceil(((click_position_y - board_dimensions.y) /
					 board_dimensions.width) * 6) - 1;
}

function add_piece(gameboard, column, player) {
	for (let row = 0; row < gameboard.length; row++) {
		if (gameboard[row][column] === null) {
			gameboard[row][column] = player
			return {"row": row,
					"column": column}
		}
	}
	return false;
}

function check_win(gameboard, row, column, player) {
	function check_generic(sequence, keyword, n) {
		let in_a_row = 0;
		
		for (const element of sequence) {
			in_a_row = (element === keyword) 
							  ? in_a_row + 1
							  : 0;
							  
			if (in_a_row >= n) {
				return true;
			}
		}
		return false;
	}
	
	function check_horizontally() {
		return check_generic(gameboard[row], player, 4);
	}
	
	function check_vertically() {
		return check_generic(gameboard.map(row => row[column]), player, 4);
	}
	
	function check_diagonally_top_right() {
		let x = row;
		let y = column;
		const sequenceToCheck = [];
		while (x > 0 && y > 0) {
			x -= 1;
			y -= 1;
		}
		
		while (x < 6 && y < 6) {
			sequenceToCheck.push(gameboard[x][y]);
			x += 1;
			y += 1;
		}
		
		return check_generic(sequenceToCheck, player, 4);
	}

	function check_diagonally_top_left() {
		let x = row;
		let y = column;
		const sequenceToCheck = [];
		while (x > 0 && y < 6) {
			x -= 1;
			y += 1;
		}
		
		while (x < 6 && y >= 0) {
			sequenceToCheck.push(gameboard[x][y]);
			x += 1;
			y -= 1;
		}
		
		return check_generic(sequenceToCheck, player, 4);
	}
	
	return (check_vertically() ||
			check_diagonally_top_left() ||
			check_diagonally_top_right() ||
			check_horizontally());
}

function fill_circle(ctx, x, y, radius) {
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, 2 * Math.PI);
	ctx.fill();
}

function draw_empty_board(canvas) {
	const ctx = canvas.getContext("2d");
	const canvas_dimensions = canvas.getBoundingClientRect();
	const canvas_width = canvas_dimensions.width;
	const canvas_height = canvas_dimensions.height;
	
	function draw_circles(num_of_column, num_of_row) {
	
		let currentX = 0;
		let currentY = 0;
		const circle_radius = 25;
		const row_gap_size = (canvas_width / num_of_row - (circle_radius*2)) / 2;
		const column_gap_size = (canvas_height / num_of_column - (circle_radius*2)) / 2;
		//draws a 6 x 7 grid of empty circles.
		for (let row = 0; row < num_of_row; row++) {
			currentY += row_gap_size + circle_radius;
			
			for (let column = 0; column < num_of_column; column++) {
				currentX += column_gap_size + circle_radius;
				fill_circle(ctx, currentX, currentY, circle_radius);
				currentX += circle_radius + column_gap_size;
			}
			
			currentX = 0;
			currentY += circle_radius + row_gap_size;
		}

		return [circle_radius, row_gap_size, column_gap_size];
	}
	ctx.fillStyle = "#3f48cc";
	ctx.fillRect(0, 0, canvas_width, canvas_height);
	ctx.fillStyle = "#ffffff";
	const circle_information = draw_circles(7, 6);
	
	return {
		ctx: ctx,
		width: canvas_width,
		height: canvas_height,
		row_gap_size: circle_information[1],
		column_gap_size: circle_information[2],
		circle_radius: circle_information[0] 
	}
		
}

function draw_piece(player_color, row, column, board_details) {
	const { ctx, circle_radius, row_gap_size, column_gap_size } = board_details;
	ctx.fillStyle = player_color;
	column = column + 1;
	row = 6 - row;
	fill_circle(ctx,
			    (column * circle_radius * 2 - circle_radius) + 
			    (column * column_gap_size * 2 - column_gap_size),
			    (row * circle_radius * 2 - circle_radius) +
			    (row * row_gap_size * 2 - row_gap_size),
			    circle_radius);
}

const connect_4_board = document.getElementById("connect-4-canvas-board");

const gameboard = [];

for (let i = 0; i < 6; i++) {
	gameboard.push([null, null, null, null, null, null, null]);
}

function set_up_game() {
	function handle_click(event) {
		const column = check_column_clicked(connect_4_board, event.clientX);
		const row = check_column_clicked(connect_4_board, event.clientY);
		
		const landedPiece = add_piece(gameboard, column, player);
		if (landedPiece) {
			draw_piece(player === "red" ? "#FF0000" : "#FFFF00",
					   landedPiece["row"],
					   landedPiece["column"],
					   board_details);
					   
			if (check_win(gameboard, landedPiece["row"], landedPiece["column"], player)) {
				const winning_message_paragraph = document.querySelector("p");
				winning_message_paragraph.innerHTML = `${player} won!`;
				connect_4_board.removeEventListener("click", handle_click);
			} else {
				player = (player === "red") ? "yellow" : "red";
			}
		}
	}
	const board_details = draw_empty_board(connect_4_board);
	let player = "red";
	connect_4_board.addEventListener("click", handle_click);
}

set_up_game();
		