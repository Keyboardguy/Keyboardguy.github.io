"use strict";
//coding is hard

import { get_reaction } from calculations.js

class Force {
	// left force is negative, right force is positive.
	// down force is negative, up force is positive.
	constructor(force, angle) {
		this.force = force;
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
}

function get_data() {
	function sanitize(x) {
		const x_to_number = Number(x.replaceAll(/^0*/gi, ""));
		return isNaN(x_to_number) ? 0 : x_to_number;
	}
	
	function add_forces_to_data(fieldsets) {
		// document.querySelector(".simple").classList[0];
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
					
		add_force_type(properties, Force, 3);
		
		data.forces = force_list;
	}
	
	const data = {};
	const forces_fieldset = document.querySelectorAll(".oriented fieldset");
	add_forces_to_data(forces_fieldset);
	
	return data;
}

function do_calculations() {
	data = get_data();
	get_reaction(data);
	draw_diagram(data);
}


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
		div.appendChild(make_property_para("position", "Position (m): "));
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