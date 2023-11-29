"use strict"

// IMPORTANT GLOBALS
let balancing_angle = 0;
const all_connections = [];
const all_applied_forces = [];

class Connection {
    constructor(from, to, angle) {
        this._from = from;
        this._to = to;
        this._angle = angle;
        this._should_set_force = false;
    }

    is_known() {
        return (typeof this._force) !== "undefined";
    }

    calculate_force(force_to_balance, direction) {
        this._set_calculation_variables();
        this._force = Math.abs(force_to_balance / this._needed_trig_fun(direction)(this._acute_calc_angle_in_radians));

        // this resolved force is already signed, and assumers that it is a tie. the _calculate_type_and_sign function
        // will swap the forces if it turns out to be a strut.
        this._resolve_self();
        this._calculate_type_and_sign(force_to_balance, direction);
    }

    promise_to_set_force(force, type) {
        this._should_set_force = true;
 
        if (type !== "strut" && type !== "tie") {
            console.error("can only set struts or ties - promise to set force");
        }
        this._force_type = type;
        this._force = force;
    } 

    set_force() {
        if (!this._should_set_force) {
            return console.error(`This connection should not be set, but the function was called anyway - ${this._from}${this._to}`);
        }

        // this MUST be called after the balanced force is set, hence a promise is needed.
        this._resolve_self();
        if (this._force_type === "strut") {
            this.flip_force_signs();
        }
    }

    flip_force_signs() {
        this._calculation_horizontal_force *= -1;
        this._calculation_vertical_force *= -1;
    }

    _needed_trig_fun(direction) {
        if (direction === "horizontal") {
            return this._horizontal_trig_fn;
        } else if (direction === "vertical") {
            return this._vertical_trig_fn;
        } else {
            console.error("not horizontal or vertical force - _needed_trig_fun");
        }
    }

    _resolve_self() {
        const resolved_force = resolve_force(this._force, this.calculation_angle);
        this._calculation_horizontal_force = resolved_force[0];
        this._calculation_vertical_force = resolved_force[1]
    }

    _set_calculation_variables() {
        // save a little bit of computing power by doing this. 
        const calc_angle = this.calculation_angle;
        this._horizontal_trig_fn = Math.floor(calc_angle / 90) % 2 === 0 
                                   ? Math.sin
                                   : Math.cos;   
        this._vertical_trig_fn = Math.floor(calc_angle / 90) % 2 === 0 
                                ? Math.cos
                                : Math.sin;  
        this._acute_calc_angle_in_radians = deg_to_rad(calc_angle % 90);
    }

    _calculate_type_and_sign(force_to_balance, known_direction) {
        let comparing_force = known_direction === "vertical"
                              ? this._calculation_vertical_force
                              : known_direction === "horizontal"
                              ? this._calculation_horizontal_force
                              : console.error("not vertical or horizontal - _calculate_type_and_sign");
        
        if (force_to_balance - comparing_force === 0) {
            // same sign - can't both be the same sign, so swap the force signs and make it a strut.
            this.flip_force_signs();
            this._force_type = "strut";
        } else {
            this._force_type = "tie";
        }
    }

    _switch_self_type() {
        if (this._force_type === "strut") {
            this._force_type = "tie";
        } else {
            this._force_type = "strut";
        }
    }

    _switch_variable_sign(x, sign) {
        // sign is either 1 or -1.
        if (sign === 1) {
            return x < 0 ? x : -x;
        } else if (sign === -1) {
            return x < 0 ? -x : x;
        } else {
            console.error("bad sign --- connections switch_variable_sign");
            return x;
        }
    }

    // calculation_angle_getter 
    get calculation_angle() {
        return make_positive_angle(this._angle - balancing_angle);
    }
    
    // protect properties.
    get from() {
        return this._from;
    }

    get to() {
        return this._to;
    }

    get angle() {
        return this._angle;
    }

    get force() {
        return this._force;
    }

    get force_type() {
        return this._force_type;
    }

    get horizontal_trig_fn() {
        return this._horizontal_trig_fn;
    }

    get vertical_trig_fn() {
        return this._vertical_trig_fn;
    }

    get calculation_horizontal_force() {
        return this._calculation_horizontal_force;
    }

    get calculation_vertical_force() {
        return this._calculation_vertical_force;
    }

    get acute_calc_angle_in_radians() {
        return this._acute_calc_angle_in_radians;
    }

    get should_set_force() {
        return this._should_set_force;
    }
}

class Point {
    constructor(name) {
        this.name = name;
        this.connections = [];
        this.applied_forces = [];
        this._vertical_unbalanced_force = 0;
        this._horizontal_unbalanced_force = 0;
        this._unknown_verticals = 0;
        this._unknown_horizontals = 0;
        this._applied_vertical_force = 0;
        this._applied_horizontal_force = 0;
        this._initialised = false;
    }

    start_solving_connections(applied_force) {
        // This always rotates the force to be vertical. So applied_horizontal_force doesn't exist.
        let starting_force = 0;
        for (const force of this.applied_forces) {
            if (force === applied_force) {
                starting_force = force;
                break;
            }
        }

        if (starting_force === 0) {
            return 0;
        }

        balancing_angle = starting_force.angle;
        this._get_unknowns_and_forces();

        if (this._unknown_verticals === 1 || this._unknown_horizontals === 1) {
            for (const connection of all_connections) {
                if (connection.should_set_force) {
                    connection.set_force();
                }
            }
            this.solve_connections();
        } else {
            console.log("not possible");
            return 0;
        }
    }

    solve_connections() {
        if (this._is_finished()) {
            return;
        }

        if (!this._initialised) {
            this._initialised = true;
            this.applied_forces.forEach(force => {
                const resolved_force = resolve_force(force.force, force.angle - balancing_angle);
                this._applied_horizontal_force += resolved_force[0];
                this._applied_vertical_force += resolved_force[1];
            })
        }

        this._get_unknowns_and_forces();

        if (this._vertical_unbalanced_force === 0 && this._horizontal_unbalanced_force === 0) {
            return;
        }

        if (this._unknown_verticals === 1 && this._vertical_unbalanced_force !== 0) {
            this._solve_unknown_connection([90, 270], this._vertical_unbalanced_force, "vertical");
            this._get_unknowns_and_forces();
        }

        if (this._unknown_horizontals === 1 && this._horizontal_unbalanced_force !== 0) {
            this._solve_unknown_connection([0, 180], this._horizontal_unbalanced_force, "horizontal");
        }

        for (const connection of this.connections) {
            if (connection.from === this) {
                connection.to.solve_connections();
            } else {
                connection.from.solve_connections();
            }
        }
    }

    add_force(applied_force) {
        this.applied_forces.push(applied_force);
    }

    remove_force(applied_force) {
        const index = this.applied_forces.indexOf(applied_force);
        if (index !== -1) {
            this.applied_forces.splice(index, 1);
        }
    }

    _is_finished() {
        return this.connections.every(connection => connection.is_known());
    }

    _get_unknowns_and_forces() {
        this._unknown_verticals = 0;
        this._unknown_horizontals = 0;
        this._vertical_unbalanced_force = 0;
        this._horizontal_unbalanced_force = 0;

        this.connections.forEach(connection => {
            if (connection.is_known()) {
                // because the force acts both directions, depending on what side of the connection you are on
                // i have to check do this if statement. the sign convention is always from - to, not to - from,
                // so -= instead of += if its to - from.
                if (connection.from === this) {
                    this._vertical_unbalanced_force += connection.calculation_vertical_force;
                    this._horizontal_unbalanced_force += connection.calculation_horizontal_force;           
                } else {
                    this._vertical_unbalanced_force -= connection.calculation_vertical_force;
                    this._horizontal_unbalanced_force -= connection.calculation_horizontal_force;       
                }
            } else {
                this._unknown_verticals += 1;
                this._unknown_horizontals += 1;

                if (connection.calculation_angle === 90 || connection.calculation_angle === 270) {
                    this._unknown_verticals -= 1;
                } else if (connection.calculation_angle === 0 || connection.calculation_angle === 180) {
                    this._unknown_horizontals -= 1;
                }
            }
        });

        this._vertical_unbalanced_force += this._applied_vertical_force;
        this._horizontal_unbalanced_force += this._applied_horizontal_force;
    }      

    _solve_unknown_connection(unwanted_angles, unbalanced_force, direction) {
        for (const connection of this.connections) {
            if (unwanted_angles.includes(connection.calculation_angle)) {
                continue;
            } else if (!connection.is_known()) {
                if (connection.from === this) {
                    connection.calculate_force(unbalanced_force, direction);
                } else {
                    connection.calculate_force(unbalanced_force, direction);
                    connection.flip_force_signs();
                }
                return;
            }
        }
    }
}

class AppliedForce {
    constructor(id, force, angle, assosciated_point) {
        this.id = id;
        this.force = force;
        this.angle = angle;
        this.assosciated_point = assosciated_point;
    }

    attempt_to_solve_forces() {
        this.assosciated_point.start_solving_connections(this);
    }
}

function possible_to_solve(applied_force_angle, connections) {
    for (const connection of connections) {
        if ((connection.angle - applied_force_angle) % 90 === 0) {
            return true;
        }
    }
    return false;
}

function resolve_force(force, angle) {
    //angle measured from clockwise vertical, and should be positive.
    const horizontal_force = (angle <= 90 
                              ? Math.sin(deg_to_rad(angle))
                              : angle <= 180
                              ? Math.cos(deg_to_rad(angle - 90)) 
                              : angle <= 270
                              ? Math.sin(deg_to_rad(angle - 180)) * -1
                              : Math.cos(deg_to_rad(angle - 270)) * -1)
                              * force;

    const vertical_force = (angle <= 90 
                           ? Math.cos(deg_to_rad(angle))
                           : angle <= 180
                           ? Math.sin(deg_to_rad(angle - 90)) * -1
                           : angle <= 270
                           ? Math.cos(deg_to_rad(angle - 180)) * -1
                           : Math.sin(deg_to_rad(angle - 270)))
                           * force;

    return [horizontal_force, vertical_force];
}

function make_positive_angle(a) {
    const new_angle = a % 360;
    return new_angle < 0 ? 360 + new_angle : new_angle;
}

function deg_to_rad(angle) {
    return angle * (Math.PI / 180);
}

function make_connection(a, b, angle) {
    // HUGE NOTE 
    // This is the same connection, i.e. the exact same object reference. So thats why i dont have to account for both.
    const connection = new Connection(a, b, angle);
    a.connections.push(connection);
    b.connections.push(connection);
    all_connections.push(connection);
    return connection;
}

function add_force_to_point(force, angle, point) {
    point.add_force(force, angle);
}

function set_connection_force(force, type, connection) {
    connection.promise_to_set_force(force, type);
}

function add_applied_force(id, force, angle, point) {
    // the making of the applied force already attaches it to the point and the global.
    const applied_force = new AppliedForce(id, force, angle, point);
    all_applied_forces.push(applied_force);
    point.add_force(applied_force);
}

function remove_applied_force(id) {
    let force_to_remove = 0;
    let global_index = -1;

    for (const [i, force] of all_applied_forces.entries()) {
        if (force.id === id) {
            force_to_remove = force;
            global_index = i;
        }
    }

    if (global_index !== -1) {
        all_applied_forces.splice(global_index, 1);
    }

    force_to_remove.assosciated_point.remove_force(force_to_remove);
}

function solve_diagram() {
    for (const applied_force of all_applied_forces) {
        applied_force.attempt_to_solve_forces();
    }
}

function test() {
    const a = new Point("A");
    const b = new Point("B");
    const c = new Point("C");
    const d = new Point("D");
    
    make_connection(a, b, 60);
    make_connection(a, c, 90);
    const connection = make_connection(b, c, 120);
    make_connection(b, d, 60);
    make_connection(c, d, 0);
    
    add_applied_force(13, 15, 19, d);
    remove_applied_force(13);

    add_applied_force(0, -7.5, 180, a);
    add_applied_force(1, -1.25, 0, b);
    add_applied_force(2, -12.5, 0, d);
    connection.promise_to_set_force(1.1, "strut");

    solve_diagram();
    console.log(a);
}


    