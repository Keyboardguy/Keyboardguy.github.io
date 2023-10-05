"use strict";
//coding is hard

import { get_reaction } from "./calculations.js";
import { draw_diagram } from "./draw.js";

class Force {
	// the negative multiplying for the horiz/vertical force is different for the beam drawer,
	// because a pulling force is entered instead of a pushing force.
	// left force is negative, right force is positive.
	// down force is negative, up force is positive.
	constructor(force, angle) {
		this.force = force;
		this.angle = Math.abs(angle) === 360 ? 0 : angle;
		this.positive_angle = this.angle < 0 ? 360 + this.angle : this.angle;
		
		this.horizontal_force =
			   (this.positive_angle <= 90 
			   ? Math.sin(deg_to_rad(this.positive_angle))
			   : this.positive_angle <= 180
			   ? Math.cos(deg_to_rad(this.positive_angle - 90)) 
			   : this.positive_angle <= 270
			   ? Math.sin(deg_to_rad(this.positive_angle - 180)) * -1
			   : Math.cos(deg_to_rad(this.positive_angle - 270)) * -1)
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
		const force_list = [];

		function add_force_type(properties, force_class, group_length) {
			if (properties.length < group_length) {
				return undefined;
			} else {
				force_list.push(new force_class(...properties.slice(0, group_length)));
				add_force_type(properties.slice(group_length), force_class, group_length);
			}
		}
		
		const input_force_properties = document.querySelectorAll(`.oriented input`);
		const properties = [];
			
		for (const property of input_force_properties.values()) {
			properties.push(sanitize(property.value));
		}
					
		add_force_type(properties, Force, 2);
		
		data.forces = force_list;
	}
	
	const data = {};
	data.force_unit = force_unit;
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
	get_reaction(data);
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


//Everything beyond this point is form stuff.

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

//why does this work?
//nevermind i figured it out, this is pretty smart
//if the validation returns false, then the form is allowed
//to submit and return an error so i dont have to write it.
// if it returns true, then it prevents default and draws the diagram.

function make_force_adder() {
	let counter = 0;
	
	function assign_basic_attributes(label, input, property, label_text) {
		label.textContent = label_text;
		label.setAttribute("for", counter);
		input.setAttribute("id", counter);
		input.setAttribute("name", property);
		input.setAttribute("type", "number");
		input.setAttribute("step", "any");
		input.addEventListener("keyup", do_calculations);
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

		const delete_button = document.createElement("button");
		delete_button.setAttribute("type", "button");
		delete_button.textContent = "Delete force";
		delete_button.addEventListener("click", event => { 
			div.remove();
			hr.remove();
			do_calculations;
		});
		div.appendChild(delete_button);
		
		div.appendChild(make_property_para("force", `Force (kN): `));
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
		
		fieldset.insertBefore(div, button);
		return;
	}
	return dispatch;
}

const force_adder = make_force_adder();

const oriented_force_button = document.getElementById("add-oriented-force");

oriented_force_button.addEventListener("click", event => {
	const fieldset = document.querySelector(".oriented");
	force_adder("oriented", event.currentTarget, fieldset);
});

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