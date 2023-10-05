"use strict"

function orient_forces(data) {
	// Orients the forces such that the known force is STRAIGHT DOWN VERTICAL (i.e. no horizontal force)
	const angle_difference = 180 - data.known_force.positive_angle;
	const len = data.unknown_forces.length;
	for (let i = 0; i < len; i++) {
		let calculation_angle = data.unknown_forces[i].positive_angle + angle_difference;
		// Only allowing a clockwise turn to get to 180deg. If I allowed anticlockwise, calculation_angle would be negative, which messes with things.
		if (calculation_angle < 0) {
			calculation_angle += 360;
		}
		calculation_angle %= 360;
		data.unknown_forces[i].set_trig_values(calculation_angle);
	}
}

export function calculate_forces(data) {
	orient_forces(data);
	const m1 = data.unknown_forces[0];
	const m2 = data.unknown_forces[1];

	// This variable has m2 ALREADY factored out, so must remember this.
	// This result comes from the horizontal force (m1) = horizontal force (m2)
	const m1_in_terms_of_m2 = m2.horizontal_trig / m1.horizontal_trig;

	// I factor out the m2 from the line just above here.
	m2.force = data.known_force.force / (m1_in_terms_of_m2 * m1.vertical_trig + m2.vertical_trig);
	m1.force = m2.force * m1_in_terms_of_m2;
}



