"use strict"

function deg_to_rad(x) {
	return x * (Math.PI / 180);
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
	
	function rotate_points_by_angle(x, y, angle, arrow_length) {
		// assume the angle is measured clockwise from the vertical
		// returns an array with new x at 0 index and y at 1 index.
		// x and y are the tail end of the arrow that needs to be rotated (the centre),
		// the new points are the points on the tip of the arrow.
		
		return [Math.sin(deg_to_rad(angle)) * arrow_length + x,
				y - Math.cos(deg_to_rad(angle)) * arrow_length]
	}


	function make_force_angle_drawer() {
		const forces_in_quadrant = [[],[],[],[]];

		function draw_force_angle(force, arrow_length, current_angles) {
			if (force === 0 || force.positive_angle === 0) {
				return;
			}
			ctx.save()
			ctx.strokeStyle = force.color;
			const quadrant = Math.floor(force.positive_angle / 90);

			let acute_angle = force.positive_angle % 90;	
			let start_angle_radians = 0;
			let end_angle_radians = 0;
			if (current_angles === 0) {
				start_angle_radians = -0.5 * Math.PI + (quadrant * (Math.PI / 2));
				end_angle_radians = start_angle_radians + deg_to_rad(acute_angle);
			} else if (current_angles === 1) {
				acute_angle = 90 - acute_angle;
				// end_angle should be the horizontal/vertical AFTER the force's quadrant, so remove -0.5 * PI.
				end_angle_radians = quadrant * (Math.PI / 2);
				start_angle_radians = end_angle_radians - deg_to_rad(acute_angle);
			} else {
				return;
			}

			ctx.beginPath();
			ctx.arc(canvas_data.centre[0], canvas_data.centre[1], arrow_length / 2,
					start_angle_radians,
					end_angle_radians);
			ctx.stroke();

			// so quadrant angle text doesn't overlap with the angle circle bit.
			const adjusting_length = quadrant % 2 === 0
										? current_angles === 0
										? acute_angle / 90 * 10
										: (90 - acute_angle) / 90 * 5 + 10
										: 15;
			const angle_to_rotate_by = current_angles === 0
										? force.positive_angle - (acute_angle / 2)
										: force.positive_angle + (acute_angle / 2)

			const text_position = rotate_points_by_angle(canvas_data.centre[0],
															canvas_data.centre[1],
															angle_to_rotate_by,
															arrow_length / 2 + 20 + adjusting_length);
			ctx.fillText(`${acute_angle.toFixed(2)}°`,
							text_position[0], text_position[1]);
			ctx.restore()
		}

		function add_force(force, color) {
			force.color = color;
			const quadrant = Math.floor(force.positive_angle / 90);
			forces_in_quadrant[quadrant].push(force);
		}

		function draw_forces(arrow_length) {
			// Must be called last. Once all the forces have been added.
			for (const quadrant of forces_in_quadrant) {
				if (quadrant.length === 1) {
					draw_force_angle(quadrant[0], arrow_length, 0);
				} else if (quadrant.length > 1) {
					function get_value(a, b, predicate) {
						return b === 0
								? a
								: a === 0
								? b
								: predicate(b.positive_angle, a.positive_angle)
								? b
								: a
					}

					draw_force_angle(quadrant.reduce((a,b) => get_value(a, b, (x, y) => x < y), 0), arrow_length, 0);
					draw_force_angle(quadrant.reduce((a,b) => get_value(a, b, (x, y) => x > y), 0), arrow_length, 1);
				}
			}
		}
		
		function dispatch(message) {
			return message === "add"
					? add_force
					: message === "draw"
					? draw_forces 
					: console.error("This should not happen. Ever. Please message me.");
		}	
		return dispatch;
	}


	const force_angle_drawer = make_force_angle_drawer();

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
		function draw_force_arrow(x1, y1, x2, y2, force) {
			return force < 0
				   ? draw_arrow(x2, y2, x1, y1)
				   : draw_arrow(x1, y1, x2, y2)
		}

		function draw_force(force, color) {
			ctx.save();
			ctx.strokeStyle = color;
			ctx.fillStyle = color;
			const xy2 = rotate_points_by_angle(canvas_data.centre[0],
											   canvas_data.centre[1],
											   force.positive_angle,
											   arrow_length);

			const text_xy2 = rotate_points_by_angle(canvas_data.centre[0],
											   	    canvas_data.centre[1],
											        force.positive_angle,
										  	        arrow_length + 25);
											   
			draw_force_arrow(canvas_data.centre[0], canvas_data.centre[1], xy2[0], xy2[1], force.force);
			force_angle_drawer("add")(force, color)
									 
			ctx.fillText(`${Math.abs(force.force.toFixed(2))}${data.force_unit}N`,
					     text_xy2[0], text_xy2[1]);
			
			ctx.restore();
        }

		function draw_unknown_force(force) {
            draw_force(force, "#000000");
			force.update_force_span();
			force.update_type_span();
		}

        function draw_known_force(force) {
            draw_force({positive_angle: force.positive_angle,
                        force: force.force}, "#ff0000");
			force.update_type_span();
        }
		
		for (const force of data.unknown_forces) {
			if (force.force === 0 || isNaN(force.force)) {
				force.force = 0;
				force.update_force_span();
				continue;
			}
			draw_unknown_force(force);
		}

        draw_known_force(data.known_force);
		force_angle_drawer("draw")(arrow_length);
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