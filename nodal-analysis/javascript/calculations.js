"use strict"

// IMPORTANT GLOBAL
let balancing_angle = 0;

class Connection {
    constructor(from, to, angle) {
        this._from = from;
        this._to = to;
        this._angle = angle;
    }

    is_known() {
        return typeof this._force !== "undefined";
    }

    calculate_force(force_to_balance, direction) {
        this._set_calculation_variables();
        // negative, cause you wanna have an up force to cancel a down force, etc.
        this._force = -force_to_balance / this._needed_trig_fun(direction)(this._acute_calc_angle_in_radians);
        this._resolve_self();
        this._calculate_type_and_sign(direction);
    }

    flip_force_signs() {
        this._calculation_horizontal_force *= -1;
        this._calculation_vertical_force *= -1;
        this._force *= -1;
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
        // already have everything needed to resolve the force, so not gonna use the function here.
        this._calculation_horizontal_force = this._force * this._horizontal_trig_fn(this._acute_calc_angle_in_radians);
        this._calculation_vertical_force = this._force * this._vertical_trig_fn(this._acute_calc_angle_in_radians);

        // if this is the node with the applied force, i need to adjsut the horizontal force to face the right direction.
        // assumes strut at first, then adjusts for whether strut or tie.
    }

    _deg_to_rad(angle) {
        return angle * (Math.PI / 180);
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
        this._acute_calc_angle_in_radians = this._deg_to_rad(calc_angle % 90);
    }

    _calculate_type_and_sign(known_direction) {
        if (known_direction === "vertical") {
            if (this.calculation_angle > 270 || this.calculation_angle < 90) {
                if (this._calculation_vertical_force < 0) {
                    this._force_type = "strut";
                } else {
                    this._force_type = "tie";
                }
            } 

            // assumes angle is less than 180, then adjusts for when it isn't.
            let sign = this._force_type === "strut" ? -1 : 1;
            if (this.calculation_angle > 180) {
                sign *= -1;
            }
            this._calculation_horizontal_force = this._switch_variable_sign(this._calculation_horizontal_force, sign);

        } else if (known_direction === "horizontal") {
            if (this.calculation_angle < 180) {
                if (this._calculation_horizontal_force < 0) {
                    this._force_type = "strut";
                } else {
                    this._force_type = "tie";
                }
            }      

            // assumes angle is between 270 and 90deg (overflows at 360 to 0), and adjusts for when it isnt.
            let sign = this._force_type === "strut" ? -1 : 1;
            if (this.calculation_angle < 270 && this.calculation_angle > 90) {
                sign *= -1;
            }
            this._calculation_vertical_force = this._switch_variable_sign(this._calculation_vertical_force, sign);
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
}

class Point {
    constructor(name) {
        this.name = name;
        this.connections = [];
        this._vertical_unbalanced_force = 0;
        this._horizontal_unbalanced_force = 0;
        this._unknown_verticals = 0;
        this._unknown_horizontals = 0;
        this._applied_vertical_force = 0;
    }

    start_solving_connections(force, angle) {
        // This always rotates the force to be vertical. So applied_horizontal_force doesn't exist.
        this._applied_vertical_force = force;
        balancing_angle = angle;
        this._get_unknowns_and_forces();

        if (this._unknown_verticals === 1 || this._unknown_horizontals === 1) {
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

        this._get_unknowns_and_forces();

        if (this._unknown_verticals === 1) {
            this._solve_unknown_connection([90, 270], this._vertical_unbalanced_force, "vertical");
        }

        // if this force is already solved due to above, then it'll just run through every connection and do nothing.
        // so its fine, just a little inefficient sometimes.
        if (this._unknown_horizontals === 1) {
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

    _is_finished() {
        return this.connections.every(connection => connection.is_known());
    }

    _get_unknowns_and_forces() {
        this._unknown_verticals = 0;
        this._unknown_horizontals = 0;
        this._vertical_unbalanced_force = 0;
        this._horizontal_unbalanced_force = 0;
        this.connections.map(connection => {
            if (connection.is_known()) {
                // because the force acts both directions, depending on what side of the connection you are on
                // i have to check do this if statement. the sign convention is always from - to, not to - from,
                // so -= instead of += if its to - from.
                if (connection.from === this) {
                    this._vertical_unbalanced_force += connection.calculation_vertical_force;
                    this._horizontal_unbalanced_force += connection.calculation_horizontal_force;           
                }
                this._vertical_unbalanced_force -= connection.calculation_vertical_force;
                this._horizontal_unbalanced_force -= connection.calculation_horizontal_force;
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

function possible_to_solve(applied_force_angle, connections) {
    for (const connection of connections) {
        if ((connection.angle - applied_force_angle) % 90 === 0) {
            return true;
        }
    }
    return false;
}

function resolve_force(force, angle) {
    //angle measured from clockwise vertical.
    const acute_angle_in_radians = (angle % 90) * (Math.PI / 180);
    const horizontal_trig_fn = Math.floor(angle / 90) % 2 === 0 
                               ? Math.sin
                               : Math.cos;   
    const vertical_trig_fn = Math.floor(angle / 90) % 2 === 0 
                             ? Math.cos
                             : Math.sin;  

    return [force * horizontal_trig_fn(acute_angle_in_radians),
            force * vertical_trig_fn(acute_angle_in_radians)];
}

function make_positive_angle(a) {
    const new_angle = a % 360;
    return new_angle < 0 ? 360 + new_angle : new_angle;
}

function make_connection(a, b, angle) {
    // HUGE NOTE 
    // This is the same connection, i.e. the exact same object reference. So thats why i dont have to account for both.
    const connection = new Connection(a, b, angle);
    a.connections.push(connection);
    b.connections.push(connection);
}

function test() {
    const a = new Point("A");
    const b = new Point("B");
    const c = new Point("C");
    
    make_connection(a, b, 330);
    make_connection(b, c, 200);
    make_connection(c, a, 90);
    
    a.start_solving_connections(-15, 180); 
    console.log(a);
}




    