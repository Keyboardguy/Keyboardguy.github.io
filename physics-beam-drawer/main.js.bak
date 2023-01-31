// coding is hard

class SimpleForce {
	constructor(force, position) {
		this.type = "simple";
		this.position = position;
		this.force = force;
	}
	
	moment(pivot_position) {
		return this.force * (this.position - pivot_position);
	}
}

class OrientedForce extends SimpleForce {
	// left force is negative, right force is positive.
	// down force is negative, up force is positive.
	constructor(force, position, angle) {
		super(force, position);
		this.type = "oriented";
		this.angle = Math.abs(angle) === 360 ? 0 : angle;
		this.positive_angle = this.angle < 0 ? 360 + this.angle : this.angle;
		
		this.horizontal_force =
			   (this.positive_angle <= 90 
			   ? Math.sin(deg_to_rad(this.positive_angle)) * -1
			   : this.positive_angle <= 180
			   ? Math.cos(deg_to_rad(this.positive_angle - 90)) * -1
			   : this.positive_angle <= 270
			   ? Math.sin(deg_to_rad(this.positive_angle - 180))
			   : Math.cos(deg_to_rad(this.positive_angle - 270)))
			   * this.force;
		
		this.vertical_force = 
		       (this.positive_angle <= 90 
			   ? Math.cos(deg_to_rad(this.positive_angle))
			   : this.positive_angle <= 180
			   ? Math.sin(deg_to_rad(this.positive_angle - 90)) * -1
			   : this.positive_angle <= 270
			   ? Math.cos(deg_to_rad(this.positive_angle - 180)) * -1
			   : Math.sin(deg_to_rad(this.positive_angle - 270)))
			   * this.force;
	}
	
	moment(pivot_position) {
		const positive_angle = this.angle < 0 ? 360 - this.angle : this.angle;
		
		return this.vertical_force * (this.position - pivot_position);
	}
	
}

class UniformForce {
	constructor(newtons_per_metre, starting_position, ending_position) {
		this.type = "uniform";
		this.newtons_per_metre = newtons_per_metre;
		this.starting_position = starting_position;
		this.ending_position = ending_position;
		
		this.width = Math.abs(this.ending_position - this.starting_position);
		this.force = this.width * this.newtons_per_metre;
		this.uniform_to_simple_position = (this.ending_position + this.starting_position) / 2;
		
	}
	
	moment(pivot_position) {
		return this.force * (this.uniform_to_simple_position - pivot_position);
	}
}

function deg_to_rad(x) {
	return x * (Math.PI / 180);
}

function rad_to_deg(x) {
	return x * (180 / Math.PI);
}

function square(x) {
	return x * x;
}

function get_data() {
	function sanitize(x) {
		const x_to_number = Number(x.replaceAll(/^0*/gi, ""));
		return isNaN(x_to_number) ? 0 : x_to_number;
	}
	
	function add_loads_to_data(fieldsets) {
		// document.querySelector(".simple").classList[0];
		function add_force_type(properties, force_class, group_length) {
			if (properties.length < group_length) {
				return undefined;
			} else {
				force_list.push(new force_class(...properties.slice(0, group_length)));
				add_force_type(properties.slice(group_length), force_class, group_length);
			}
		}
		
		const force_list = [];
		for (const force_type of fieldsets.values()) {
			
			const input_force_properties = document.querySelectorAll(`.${force_type.classList[0]} input`);
			const properties = [];
			
			for (const property of input_force_properties.values()) {
				properties.push(sanitize(property.value));
			}
			
			switch (force_type.classList[0]) {
				case "simple":
					add_force_type(properties, SimpleForce, 2);
					break;
				case "oriented":
					add_force_type(properties, OrientedForce, 3);
					break;
				case "uniform":
					add_force_type(properties, UniformForce, 3);
					break;
				default:
					console.error("Cannot tell the type of force of: " + force_type);
			}
		}
		
		data.forces = force_list;
	}
	
	const data = {};
	
	data.beam_length = sanitize(document.querySelector("#beam-length").value);
	data.roller_position = sanitize(document.querySelector("#roller-position").value);
	data.hinge_position = sanitize(document.querySelector("#hinge-position").value);
	data.show_forces = document.querySelector("#show-forces").checked;
	data.show_reactions = document.querySelector("#show-reactions").checked;
	
	const fieldsets = document.querySelectorAll("form > section > fieldset");
	add_loads_to_data(fieldsets);
	
	return data;
}

function calculate_roller_reaction(data) {
	// I am taking the hinge as the initial pivot point because why not.
	// ACWM is defined as negative CWM within the classes.
	let CWM = 0;
	for (const force of data.forces) {
		CWM += force.moment(data.hinge_position);
	}
	data.roller_reaction_force = -(CWM / (data.roller_position - data.hinge_position));
	return "ok";
}

function calculate_hinge_reaction(data) {
	//left force is negative, right force is positive.
	// up force is negative, down force is positive.
	let hinge_horizontal_force = 0;
	let hinge_vertical_force = 0;
	
	for (const force of data.forces) {
		if (force.type === "oriented") {
			hinge_horizontal_force += force.horizontal_force;
			hinge_vertical_force += force.vertical_force;
		} else {
			// this looks a bit weird. but, its the force of a force objcet
			// i.e. 5N of the uniform force.
			hinge_vertical_force += force.force;
		}
	}
	
	hinge_vertical_force += data.roller_reaction_force;
	hinge_horizontal_force = hinge_horizontal_force * -1;
	data.hinge_reaction_force = Math.sqrt(square(hinge_vertical_force)
							              + square(hinge_horizontal_force));
	// the angle is clockwise from the normal, so 90 deg will be subtracted
	// from 90 deg making it 0 deg in total with no horizontal forces.
	const angle = (hinge_horizontal_force !== 0)
				  ? rad_to_deg(Math.atan(Math.abs(hinge_vertical_force) / Math.abs(hinge_horizontal_force)))
				  : 90;
	
	data.hinge_angle = (hinge_horizontal_force >= 0 && hinge_vertical_force >= 0
						? 90 - angle
						: hinge_horizontal_force >= 0 
						? 90 + angle
						: hinge_vertical_force >= 0
						? 270 + angle
						: 270 - angle);
}

function draw_diagram(data) {
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
	
	function draw_force_arrow(x1, y1, x2, y2, force) {
		return force < 0
			   ? draw_arrow(x1, y1, x2, y2)
			   : draw_arrow(x2, y2, x1, y1);
	}
	
	function draw_circle(x, y, radius) {
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI);
		ctx.stroke();
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
	
	function real_position_to_canvas_x(position) {
		return (position / data.beam_length
			   * canvas_data.beam_width
			   + canvas_data.beam_start_x);
	}
	
	function rotate_points_by_angle(x, y, angle, arrow_length) {
		// assume the angle is measured clockwise from the vertical
		// returns an array with new x at 0 index and y at 1 index.
		
		return [Math.sin(deg_to_rad(angle)) * arrow_length + x,
				y - Math.cos(deg_to_rad(angle)) * arrow_length]
	}
	
	
	function draw_beam() {
		canvas_data.beam_start_x = 150;
		canvas_data.beam_end_x = canvas_data.width - 150;
		canvas_data.beam_y = canvas_data.height / 3 * 2;
		
		canvas_data.beam_width = canvas_data.width - 300;
		draw_line(canvas_data.beam_start_x,
				  canvas_data.beam_y,
				  canvas_data.beam_end_x,
				  canvas_data.beam_y);
	}

	
	function draw_support_all(arrow_length, draw_force) {
		const support_x = real_position_to_canvas_x(data.roller_position);
		
		ctx.save();
		draw_circle(support_x, canvas_data.beam_y + 10, 10);
		ctx.fillStyle = "#FF0000";
		ctx.strokeStyle = "#FF0000";

		if (!draw_force) {
			ctx.restore();
			return undefined;
		}
		
		//Note -  I do not know what to draw if the reaction force is downwards. This is a temporary fix.
		draw_force_arrow(support_x, canvas_data.beam_y,
						 support_x, canvas_data.beam_y - arrow_length,
						 data.roller_reaction_force);
		
		if (isNaN(data.roller_reaction_force)) {
			ctx.fillText(`RB = ? kN`,
						  support_x + 5, canvas_data.beam_y - arrow_length - 5);
		} else {
			ctx.fillText(`RB = ${Math.abs(data.roller_reaction_force.toFixed(2))}kN`,
						  support_x + 5, canvas_data.beam_y - arrow_length - 5);
		}
		ctx.restore();
	}
	
	function draw_hinge_all(arrow_length, draw_force) {
		function draw_hinge_part(x, y, size) {
			ctx.save();
			function draw_hinge_shape(x, y, size) {
				ctx.beginPath();
				ctx.arc(x, y, size, Math.PI, 2 * Math.PI);
				ctx.moveTo(x - size, y);
				ctx.lineTo(x - size, y + size * 1.5);
				ctx.lineTo(x + size, y + size * 1.5);
				ctx.lineTo(x + size, y);
				ctx.fill();
			}
			draw_hinge_shape(x, y, size);
			ctx.fillStyle = "#FFFFFF";
			draw_hinge_shape(x, y, size - 1);
			ctx.fillStyle = "#000000";
			ctx.beginPath();
			ctx.arc(hinge_x, canvas_data.beam_y, 3, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		}
		
		function draw_hinge_arrow(x1, y1) {
			ctx.save();
			const xy2 = rotate_points_by_angle(x1, y1, data.hinge_angle, arrow_length);
			
			ctx.strokeStyle = "#FF0000";
			ctx.fillStyle = "#FF0000";
			draw_arrow(x1, y1, xy2[0], xy2[1]);
			if (isNaN(data.hinge_reaction_force)) {
				ctx.fillText(`RA = ? kN`,
							  xy2[0] + 5, xy2[1] - 5);
			} else {
				ctx.fillText(`RA = ${data.hinge_reaction_force.toFixed(2)}kN`,
							  xy2[0] + 5, xy2[1] - 5);
			}
			ctx.restore();
		}
		
		const hinge_x = real_position_to_canvas_x(data.hinge_position)
		// remind me to link this and the support to be the same.
		
		draw_hinge_part(hinge_x, canvas_data.beam_y, 13.3333);
		if (draw_force) {
			draw_hinge_arrow(hinge_x, canvas_data.beam_y);
			draw_angle_from_vertical(hinge_x, canvas_data.beam_y, data.hinge_angle, arrow_length);
		}
		ctx.restore();
	}
	
	function draw_forces(arrow_length) {
		function draw_simple_force(force) {
			const force_x = real_position_to_canvas_x(force.position);
			
			draw_force_arrow(force_x, canvas_data.beam_y,
							 force_x, canvas_data.beam_y - arrow_length,
							 force.force);
							 
			ctx.fillText(`${Math.abs(force.force.toFixed(2))}kN`,
					     force_x + 5, canvas_data.beam_y - arrow_length - 5);
		}
		
		function draw_oriented_force(force) {
			const force_x = real_position_to_canvas_x(force.position);
			const xy2 = rotate_points_by_angle(force_x,
											   canvas_data.beam_y,
											   force.positive_angle,
											   arrow_length);
											   
			draw_force_arrow(force_x, canvas_data.beam_y, xy2[0], xy2[1], force.force);
			
			draw_angle_from_vertical(force_x,
									 canvas_data.beam_y,
									 force.positive_angle,
									 arrow_length);
									 
			ctx.fillText(`${Math.abs(force.force.toFixed(2))}kN`,
					     xy2[0] + 5, xy2[1] - 5);
		}
		
		function draw_uniform_force(force) {
			function draw_uniform_circles(radius) {
				const width = real_position_to_canvas_x(force.width) - canvas_data.beam_start_x;
				const number_of_circles = Math.floor(width / (2 * radius));
				const circle_radius = (((width % number_of_circles) / number_of_circles) + (radius * 2)) / 2;  
				ctx.beginPath();
				let current_x = real_position_to_canvas_x(force.starting_position) + circle_radius;
				for (let i = 0; i < number_of_circles; i++) {
					ctx.arc(current_x,
							canvas_data.beam_y,
							circle_radius,
							Math.PI,
							Math.PI * 2);
							
					current_x += circle_radius * 2;
				}
				ctx.stroke();
			}
				
			
			function draw_uniform_line() {
				const centre_of_force = real_position_to_canvas_x(Math.abs(force.ending_position
											   + force.starting_position) / 2);
				
				const xy2 = rotate_points_by_angle(centre_of_force, canvas_data.beam_y, 315, arrow_length / 4);
				
				ctx.beginPath();
				ctx.moveTo(centre_of_force, canvas_data.beam_y);
				ctx.lineTo(xy2[0], xy2[1]);
				ctx.lineTo(xy2[0] - arrow_length, xy2[1]);
				ctx.stroke();
				ctx.fillText(`${force.newtons_per_metre.toFixed(2)}kN/m`,
							  xy2[0] - arrow_length, xy2[1] - 5);
			}
			draw_uniform_line();
			draw_uniform_circles(10);
		}
		
		for (const force of data.forces) {
			if (force.force === 0) {
				continue;
			}
			
			if (force.type === "simple") {
				draw_simple_force(force);
			} else if (force.type === "oriented") {
				draw_oriented_force(force);
			} else if (force.type === "uniform") {
				draw_uniform_force(force);
				canvas_data.x_distances.push(force.starting_position);
				canvas_data.x_distances.push(force.ending_position);
				continue;
			} else {
				console.log(`unknown force - ${force}`);
			}
			canvas_data.x_distances.push(force.position);
		}
	}
	
	//Call this function at the end of everything else.
	function draw_distances() {
		function draw_marker(x) {
			x = real_position_to_canvas_x(x);
			ctx.beginPath();
			ctx.moveTo(x, distance_line_y - 5);
			ctx.lineTo(x, distance_line_y + 5);
			ctx.stroke();
		}
		
		function draw_difference_between(x1, x2) {
			//remove any 0.8999999999 stuff and remove trailing zeroes.
			let difference = x2 - x1;
			difference = Number(difference.toFixed(3));
			const canvas_x1 = real_position_to_canvas_x(x1);
			const canvas_x2 = real_position_to_canvas_x(x2);
			const centered_text_x = ((canvas_x1 + canvas_x2) / 2) - (ctx.measureText(`${difference}m`).width / 2);
			
			ctx.fillText(`${difference}m`,
					     centered_text_x, distance_line_y + 25);
		}
		
		let current_distance = 0;
		const sorted_distances = canvas_data.x_distances.sort((a,b) => a - b);
		const distance_line_y = canvas_data.beam_y + 50;
		
		ctx.save();
		ctx.strokeStyle = "#919191";
		ctx.fillStyle = "#696969";
		draw_line(canvas_data.beam_start_x,
				  distance_line_y,
				  canvas_data.beam_end_x,
				  distance_line_y);
					  
		draw_marker(current_distance);
		
		for (const distance of sorted_distances) {
			if (distance === current_distance) {
				continue;
			} else if (distance < current_distance) {
				console.log(distance, "shouldn't happen.");
				continue;
			}
			
			draw_marker(distance);
			draw_difference_between(current_distance, distance);
			current_distance = distance;
		}
		
		if (current_distance < data.beam_length) {
			draw_marker(data.beam_length);
			draw_difference_between(current_distance, data.beam_length);
		}
		ctx.restore();
	}
				
				
	
	const canvas = document.querySelector("#diagram");
	const ctx = canvas.getContext("2d");
	
	const canvas_data = {};
	 ctx.font = "20px Helvetica";
	canvas_data.width = canvas.width;
	canvas_data.height = canvas.height;
	canvas_data.x_distances = [];
	canvas_data.x_distances.push(data.roller_position);
	canvas_data.x_distances.push(data.hinge_position);
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#000000";
	draw_beam();
	if (data.show_forces) {
		draw_forces(100);
	}
	if (data.show_reactions) {
		draw_hinge_all(100, true);
		draw_support_all(100, true);
	} else {
		draw_hinge_all(100, false);
		draw_support_all(100, false);	
	}
	draw_distances();
	
}

//why does this work?
//nevermind i figured it out, this is pretty smart
//if the validation returns false, then the form is allowed
//to submit and return an error so i dont have to write it.
// if it returns true, then it prevents default and draws the diagram.
function check_validation() {
	const all_inputs = document.querySelectorAll("input");
	const angle_inputs = document.querySelectorAll("input[min]");
	
	for (const element of all_inputs.values()) {
		if (element.validity.valueMissing) {
			return true;
		} else if (element.validity.badInput) {
			return true;
		}
	}
	
	for (const element of angle_inputs.values())  {
		if (element.validity.rangeOverflow || element.validity.rangeUnderflow) {
			return true;
		}
	}
	return false;
}


const button = document.querySelector("button[type='submit']");

button.addEventListener("click", event => {
	if (check_validation()) {
		return 0;
	}
	event.preventDefault();
	const data = get_data();
	calculate_roller_reaction(data);
	calculate_hinge_reaction(data);
	draw_diagram(data);
	console.log(data);
});

// add extra forces.

function make_force_adder() {
	let counter = 0;
	
	function assign_basic_attributes(label, input, property, label_text) {
		label.textContent = label_text;
		label.setAttribute("for", counter);
		input.setAttribute("id", counter);
		input.setAttribute("name", property);
		input.setAttribute("type", "number");
		input.setAttribute("step", "any");
		counter += 1;
	}
	
	function make_property_para(property, label_text) {
		const para = document.createElement("p");
		const label = document.createElement("label");
		const input = document.createElement("input");
		para.appendChild(label);
		para.appendChild(input);
		assign_basic_attributes(label, input, property, label_text);
		return para;
	}
	
	function dispatch(force_type, button, fieldset) {
		const hr = document.createElement("hr");
		const div = document.createElement("div");
		fieldset.insertBefore(hr, button);
		
		if (force_type === "uniform") {
			div.appendChild(make_property_para("force", "kN per metre (kN/m): "));
			div.appendChild(make_property_para("starting-position", "Starting position (m): "));
			div.appendChild(make_property_para("ending-position", "Ending position (m): "));
			fieldset.insertBefore(div, button);
			return "finished";
		} 
		
		div.appendChild(make_property_para("force", "Force (kN): "));
		div.appendChild(make_property_para("position", "Position (m): "));
		
		//There are two if statements instead of one else if
		//order to preserve the original order of the fields.
		
		if (force_type === "oriented") {
			const angle_para = document.createElement("p");
			const angle_label = document.createElement("label");
			const angle_input = document.createElement("input");
			assign_basic_attributes(angle_label,
									angle_input,
									"angle",
									"Angle measured from clockwise vertical (°): ");
									
			angle_input.setAttribute("min", "-360");
			angle_input.setAttribute("max", "360");
			angle_para.appendChild(angle_label);
			angle_para.appendChild(angle_input);	
			div.appendChild(angle_para);
		} 
		
		fieldset.insertBefore(div, button);
		return;
	}
	return dispatch;
}

const force_adder = make_force_adder();

const simple_force_button = document.getElementById("add-simple-force");
const oriented_force_button = document.getElementById("add-oriented-force");
const uniform_force_button = document.getElementById("add-uniform-force");

simple_force_button.addEventListener("click", event => {
	const fieldset = document.querySelector(".simple");
	force_adder("simple", event.currentTarget, fieldset);
});

oriented_force_button.addEventListener("click", event => {
	const fieldset = document.querySelector(".oriented");
	force_adder("oriented", event.currentTarget, fieldset);
});

uniform_force_button.addEventListener("click", event => {
	const fieldset = document.querySelector(".uniform");
	force_adder("uniform", event.currentTarget, fieldset);
});
