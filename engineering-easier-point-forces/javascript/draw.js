"use strict"

function deg_to_rad(x) {
	return x * (Math.PI / 180);
}

function rad_to_deg(x) {
	return x * (180 / Math.PI);
} 

export function draw_diagram(data) {
	function draw_line(x1, y1, x2, y2) {
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
	}
	
	//https://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag
	function draw_arrow(fromx, fromy, tox, toy) {
		ctx.beginPath();
		const headlen = 8; // length of head in pixels
		const dx = tox - fromx;
		const dy = toy - fromy;
		const angle = Math.atan2(dy, dx);
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
		ctx.moveTo(tox, toy);
		ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
		ctx.stroke();
	}
	
	function draw_filled_circle(x, y, radius) {
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI);
		ctx.fill();
    }
	
	function draw_angle_from_vertical(x, y, angle, arrow_length) {
		ctx.save();
		ctx.setLineDash([5, 5]);
		draw_line(x, y, x, y - arrow_length);
		ctx.restore();
		ctx.beginPath();
		ctx.arc(x, y, arrow_length / 2, 1.5 * Math.PI, deg_to_rad(270 + angle));
		ctx.stroke();
		ctx.fillText(`${angle.toFixed(2)}°`,
					  x + 5, y - arrow_length / 2 - 5);
	}
	
	function rotate_points_by_angle(x, y, angle, arrow_length) {
		// assume the angle is measured clockwise from the vertical
		// returns an array with new x at 0 index and y at 1 index.
		// x and y are the tail end of the arrow that needs to be rotated (the centre),
		// the new points are the points on the tip of the arrow.
		
		return [Math.sin(deg_to_rad(angle)) * arrow_length + x,
				y - Math.cos(deg_to_rad(angle)) * arrow_length]
	}

	function make_force_angle_drawer() {
		const current_quadrant_angles = [0,0,0,0]

		function draw_force_angle(force, arrow_length) {
			ctx.save()
			const quadrant = Math.floor(force.positive_angle / 90);
			const acute_angle = force.positive_angle % 90;	
			const start_angle_radians = -0.5 * Math.PI + (quadrant * (Math.PI / 2));
			ctx.beginPath();
			ctx.arc(canvas_data.centre[0], canvas_data.centre[1], arrow_length / 2,
					start_angle_radians + deg_to_rad(current_quadrant_angles[quadrant]),
				    start_angle_radians + deg_to_rad(acute_angle));
			ctx.stroke();

			// so quadrant angle text doesn't overlap with the angle circle bit.
			const adjusting_length = quadrant % 2 === 0
								     ? acute_angle / 90 * 10
									 : 15;

			const text_position = rotate_points_by_angle(canvas_data.centre[0],
														 canvas_data.centre[1],
														 force.positive_angle - ((acute_angle - current_quadrant_angles[quadrant]) / 2),
														 arrow_length / 2 + 20 + adjusting_length);
			ctx.fillText(`${(acute_angle - current_quadrant_angles[quadrant]).toFixed(2)}°`,
						  text_position[0], text_position[1]);
			ctx.restore()
			current_quadrant_angles[quadrant] = acute_angle;
		}
		return draw_force_angle;
	}

	const draw_force_angle = make_force_angle_drawer();

	function draw_axis(size) {
		ctx.save();
		ctx.setLineDash([5, 5]);
		ctx.strokeStyle = "#777777"
		draw_line(canvas_data.centre[0] - (size / 2), canvas_data.centre[1],
				  canvas_data.centre[0] + (size / 2), canvas_data.centre[1]);
		draw_line(canvas_data.centre[0], canvas_data.centre[1] - (size / 2),
				  canvas_data.centre[0], canvas_data.centre[1] + (size / 2));
		ctx.restore();
	}
	
	function draw_centre_point() {
		ctx.save();
		ctx.fillStyle = "#000000";
        draw_filled_circle(canvas_data.centre[0], canvas_data.centre[1], 4);
		ctx.restore();
	}
	
	function draw_forces(arrow_length) {
0        // This function draws the reaction force as well.

		function draw_force_arrow(x1, y1, x2, y2, force) {
			return force < 0
				   ? draw_arrow(x2, y2, x1, y1)
				   : draw_arrow(x1, y1, x2, y2)
		}

		function draw_force(force) {
			const xy2 = rotate_points_by_angle(canvas_data.centre[0],
											   canvas_data.centre[1],
											   force.positive_angle,
											   arrow_length);

			const text_xy2 = rotate_points_by_angle(canvas_data.centre[0],
											   	    canvas_data.centre[1],
											        force.positive_angle,
										  	        arrow_length + 25);
											   
			draw_force_arrow(canvas_data.centre[0], canvas_data.centre[1], xy2[0], xy2[1], force.force);
			draw_force_angle(force, arrow_length);
			
            /* TODO
			draw_angle_from_vertical(force_x,
									 canvas_data.beam_y,
									 force.positive_angle,
									 arrow_length); */
									 
			ctx.fillText(`${Math.abs(force.force.toFixed(2))}kN`,
					     text_xy2[0], text_xy2[1]);
        }

        function draw_and_display_reaction() {
            ctx.save();
            ctx.strokeStyle = "#ff0000";
            ctx.fillStyle = "#ff0000";
            // I'm drawing the force backwards. At all times.
            draw_force({positive_angle: data.reaction_angle,
                        force: data.reaction_force});
            ctx.restore();
            
            document.querySelector("#reaction_horizontal_force").innerHTML = data.reaction_horizontal_force.toFixed(2);
            document.querySelector("#reaction_vertical_force").innerHTML = data.reaction_vertical_force.toFixed(2);
            document.querySelector("#reaction_force").innerHTML = data.reaction_force.toFixed(2);
            document.querySelector("#reaction_angle").innerHTML = data.reaction_angle.toFixed(2);
            document.querySelector("#reaction_strut_or_tie").innerHTML = data.reaction_force < 0 ? "Strut" : "Tie";
        }

		
		for (const force of data.forces) {
			if (force.force === 0) {
				continue;
			}
			draw_force(force);
		}

        draw_and_display_reaction()
	}		
				
	const canvas = document.querySelector("#diagram");
	const ctx = canvas.getContext("2d");
	
	const canvas_data = {};
	ctx.font = "20px Helvetica";
	ctx.textBaseline = "middle";
	ctx.textAlign = "center";
    canvas_data.centre = [canvas.width / 2, canvas.height / 2]
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#000000";

	draw_axis(350);
	draw_forces(150);
	draw_centre_point();

    return 1;
}