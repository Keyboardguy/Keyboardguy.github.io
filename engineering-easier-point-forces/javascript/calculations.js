function deg_to_rad(x) {
	return x * (Math.PI / 180);
}

function rad_to_deg(x) {
	return x * (180 / Math.PI);
} 

function square(x) {
	return x * x;
}

export function get_reaction(data) {
    // expects a list of force classes in a data object, and adds the reaction details to the data object.
    const reaction_vertical_force = -data.forces.reduce((a,b) => a + b.vertical_force, 0);
    const reaction_horizontal_force = -data.forces.reduce((a,b) => a + b.horizontal_force, 0);

    data.reaction_force = Math.sqrt(square(reaction_vertical_force)
                                    + square(reaction_horizontal_force));

    // the angle is clockwise from the normal, so 90 deg will be subtracted
    // from 90 deg making it 0 deg in total with no horizontal forces.
    const angle = (reaction_horizontal_force !== 0)
    ? rad_to_deg(Math.atan(Math.abs(reaction_vertical_force) / Math.abs(reaction_horizontal_force)))
    : 90;

    data.reaction_angle = (reaction_horizontal_force >= 0 && reaction_vertical_force >= 0
    ? 90 - angle
    : reaction_horizontal_force >= 0 
    ? 90 + angle
    : reaction_vertical_force >= 0
    ? 270 + angle
    : 270 - angle);

    data.reaction_vertical_force = reaction_vertical_force;
    data.reaction_horizontal_force = reaction_horizontal_force;

    return 1;
}