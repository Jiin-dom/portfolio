/* World units: 1 ≈ 8 cm. The desk top is y = 0. */
export const DESK = { halfW: 15, front: 4.8, back: -4.8 };
/* the L return: joins the desk's left end and runs out toward the room */
export const RETURN = { x0: -23, x1: -DESK.halfW, z0: DESK.back, z1: 14.6 };
export const SIDE_WALL_X = RETURN.x0 - 0.1;
/*
 * The skills aquarium, on the return with its front glass facing +x (into the
 * room). w runs along z, d along x.
 */
export const TANK = { x: -21.2, z: 6.4, w: 5.4, d: 2.4, h: 3.3 };
