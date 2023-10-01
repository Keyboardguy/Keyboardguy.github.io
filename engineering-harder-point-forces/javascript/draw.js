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
		
		return [Math.sin(deg_to_rad(angle)) * arrow_length + x,
				y - Math.cos(deg_to_rad(angle)) * arrow_length]
	}
	
	function draw_centre_point(arrow_length) {
		ctx.save();
		ctx.fillStyle = "#000000";
        draw_filled_circle(canvas_data.centre[0], canvas_data.centre[1], 4);
		ctx.restore();
	}
	
	function draw_forces(arrow_length) {
        // This function draws the reaction force as well.

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
											   
			draw_force_arrow(canvas_data.centre[0], canvas_data.centre[1], xy2[0], xy2[1], force.force);
			
            /* TODO
			draw_angle_from_vertical(force_x,
									 canvas_data.beam_y,
									 force.positive_angle,
									 arrow_length); */
									 
			ctx.fillText(`${Math.abs(force.force.toFixed(2))}kN`,
					     xy2[0] + 5, xy2[1] - 5);
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
    canvas_data.centre = [canvas.width / 2, canvas.height / 2]
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#000000";

	draw_forces(150);
	draw_centre_point();

	console.log(data)

    return 1;
}