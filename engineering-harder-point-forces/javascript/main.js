"use strict";
//coding is hard

import { calculate_forces } from "./calculations.js";
import { draw_diagram } from "./draw.js";

class Force {
	constructor(angle, type_span) {
		this.angle = Math.abs(angle) === 360 ? 0 : angle;
		this.positive_angle = this.angle < 0 ? 360 + this.angle : this.angle;
		this.type_span = type_span;
	}

	update_type_span() {
		if (typeof this.force !== 'undefined') {
			this.type_span.innerHTML = this.force < 0 ? "Strut" : "Tie";
		} else {
			this.type_span.innerHTML = "?"
		}
	}
}
class UnknownForce extends Force { 
	// The force will get assigned in the calculations.js file.
	constructor(angle, type_span, force_span) {
		super(angle, type_span);
		this.force_span = force_span;
	}

	set_trig_values(angle) {
		// These are NOT the trig values of the actual angle, its the ones were the known force has been set vertically.
		this.horizontal_trig =
			angle <= 90
			? Math.sin(deg_to_rad(angle))
			: angle <= 180
			? Math.cos(deg_to_rad(angle - 90))
			: angle <= 270
			? Math.sin(deg_to_rad(angle - 180)) 
			: Math.cos(deg_to_rad(angle - 270));

		this.vertical_trig =
			angle <= 90
			? Math.cos(deg_to_rad(angle))
			: angle <= 180
			? Math.sin(deg_to_rad(angle - 90))
			: angle <= 270
			? Math.cos(deg_to_rad(angle - 180))
			: Math.sin(deg_to_rad(angle - 270));
	}

	update_force_span() {
		if (typeof this.force !== 'undefined') {
			this.force_span.innerHTML = this.force.toFixed(2);
		} else {
			this.force_span.innerHTML = "?"
		}
	}
}

class KnownForce extends Force {
	// the negative multiplying for the horiz/vertical force is different for the beam drawer,
	// because a pulling force is entered instead of a pushing force.
	// left force is negative, right force is positive.
	// down force is negative, up force is positive.
	constructor(force, angle, type_span) {
		super(angle, type_span);
		this.force = force;
	}
}

// globals
let force_unit = "k";

function deg_to_rad(x) {
	return x * (Math.PI / 180);
}

function get_data() {
	function sanitize(x) {
		const x_to_number = Number(x.replaceAll(/^0*/gi, ""));
		return isNaN(x_to_number) ? 0 : x_to_number;
	}
	
	function add_forces_to_data() {
		// This is VERY finicky. The inputs must come in a very specific order for this to work.
		const input_force_properties = document.querySelectorAll(".oriented input");
		const calculated_force_spans = document.querySelectorAll(".calculated_force");
		const force_type_spans = document.querySelectorAll(".strut_or_tie");
		const properties = [];
			
		for (const property of input_force_properties.values()) {
			properties.push(sanitize(property.value));
		}

		// I literally put in the values by hand. That's how finicky this is.
		data.known_force = new KnownForce(properties[0], properties[1], force_type_spans[0]);
		data.unknown_forces = [new UnknownForce(properties[2], force_type_spans[1], calculated_force_spans[0]),
							   new UnknownForce(properties[3], force_type_spans[2], calculated_force_spans[1])];
	}
	
	const data = {};
	data.force_unit = force_unit
	add_forces_to_data();
	return data;
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

function do_calculations(event=false) {
	if (event) {
		if (check_validation()) {
			return 0;
		}
		event.preventDefault();
	}
	
	const data = get_data();
	calculate_forces(data);
	draw_diagram(data);
}

const button = document.querySelector("button[type='submit']");

button.addEventListener("click", do_calculations);


//note - sometimes keydown lags behind by like 1 input. So keyup is used here instead.
function calculate_as_you_enter() {
	const all_inputs = document.querySelectorAll("input");
	
	for (const input of all_inputs.values()) {
		input.addEventListener("keyup", do_calculations);
	}
}

calculate_as_you_enter();

function allow_switch_force_units() {
	const unit_buttons = document.querySelectorAll("input[name='force_units']");
	
	for (const button of unit_buttons.values()) {
		button.addEventListener("click", event => {
			const labels = document.querySelectorAll("fieldset:nth-child(n + 2) label");
			force_unit = button.value;
			for (const label of labels.values()) {
				label.textContent = label.textContent.replaceAll(/[kMG]?N/g, `${force_unit}N`);
			}
			
			do_calculations();
		});
	}
}

//switch to kN once page loads so it doesn't load as N checked with kN displayed.
//the global variable force_unit is defined wayyy up.
window.addEventListener("load", (event) => {
  document.querySelector("#kN").checked = true;
});

allow_switch_force_units();

function prevent_accidental_reset() {
	const resetButton = document.querySelector("input[type='reset']");
	let true_reset = false;
	resetButton.addEventListener("click", event => {
		if (true_reset) {
			clearTimeout(true_reset);
			true_reset = false;
			resetButton.value = "Reset Data";
			return undefined;
		} else {
			event.preventDefault();
			true_reset = setTimeout(() => {
							true_reset = false;
							resetButton.value = "Reset Data";
					     }, 1000);
			
			resetButton.value = "Are you sure?";
		}
	});
}

prevent_accidental_reset();