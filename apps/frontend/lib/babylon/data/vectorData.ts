// @ts-ignore
import { Vector3 } from "@babylonjs/core";


// SPAWN AREAS
let area1 = 
[
	new Vector3(-36, -15, 0),
	new Vector3(-34, -15, 0),
	new Vector3(-32, -14, 0)
];

let area2 = 
[
	new Vector3(-35, 3, 0),
	new Vector3(-33, 3, 0),
	new Vector3(-31, 3, 0)
];

let area3 = 
[
	new Vector3(-33.5, 14, 0),
	new Vector3(-30, 18, 0)
];

let area4 =
[
	new Vector3(-26.5, 22, 0),
	new Vector3(-24.5, 21.5, 0),
	new Vector3(-22.5, 21, 0)
]

let area5 = 
[
	new Vector3(-24, 9, 0),
	new Vector3(-22, 8, 0),
	new Vector3(-20, 8, 0),
	new Vector3(-18, 8, 0),
	new Vector3(-16, 8, 0)
]

let area6 =
[
	new Vector3(-27.5, -3, 0),
	new Vector3(-25.8, -2.8, 0)
]

let area7 = 
[
	new Vector3(-24, 1, 0),
	new Vector3(-22, 1, 0),
	new Vector3(-20, 1, 0),
	new Vector3(-18, 1, 0),
]

let area8 =
[
	new Vector3(-16, 0.5, 0),
	new Vector3(-14, 0, 0),
	new Vector3(-12, -0.5, 0)
]

let area9 =
[
	new Vector3(-21, -16, 0),
	new Vector3(-18.5, -24, 0)
]

let area10 = 
[
	new Vector3(-16, -16, 0),
	new Vector3(-14, -14.7, 0),
	new Vector3(-12, -14.5, 0),
	new Vector3(-10, -14.5, 0)
]

let area11 =
[
	new Vector3(-8, -14.5, 0),
	new Vector3(-6, -14.5, 0),
	new Vector3(-4, -15.5, 0),
	new Vector3(-2, -16.5, 0),
	new Vector3(-0, -17.5, 0)
]

let area12 = 
[
	new Vector3(3, -22.5, 0),
	new Vector3(5, -22.7, 0),
	new Vector3(7, -22, 0),
]

let area13 =
[
	new Vector3(9, -21, 0),
	new Vector3(11, -22, 0),
	new Vector3(13, -23, 0)
]

let area14 =
[
	new Vector3(-1, 7, 0),
	new Vector3(1, 7.5, 0),
	new Vector3(3, 8.2, 0),
	new Vector3(5, 8.9, 0),
	new Vector3(7, 9.6, 0)
]

let area15 =
[
	new Vector3(10.5, 4, 0),
	new Vector3(12.5, 3, 0),
	new Vector3(14.5, 2.2, 0),
	new Vector3(16.5, 2.5, 0)
]

let area16 = 
[
	new Vector3(13, 24.2, 0),
	new Vector3(15, 24.2, 0),
	new Vector3(17, 24, 0),
]

let area17 =
[
	new Vector3(19, 24, 0),
	new Vector3(21, 24, 0),
	new Vector3(23, 24, 0)
]

let area18 = 
[
	new Vector3(20.5, 28, 0),
	new Vector3(22.5, 28.7, 0),
	new Vector3(24.5, 28.7, 0),
	new Vector3(26.5, 28.5, 0),
]

let area19 =
[
	new Vector3(28.5, 28.5, 0),
	new Vector3(30.5, 28.5, 0),
	new Vector3(32.5, 28.3, 0)
]

let area20 =
[
	new Vector3(29.5, 12.7, 0),
	new Vector3(31.5, 13, 0),
	new Vector3(33.5, 13.3, 0),
	new Vector3(35.5, 13.6, 0),
	new Vector3(37.5, 13.9, 0)
]

let area21 =
[
	new Vector3(29, -1, 0),
	new Vector3(31, -0.7, 0),
	new Vector3(33, -0.4, 0),
	new Vector3(35, -0.1, 0),
	new Vector3(37, -1.3, 0)
]

let area22 = 
[
	new Vector3(32.3, -14.3, 0),
	new Vector3(32.3, -14.3, 0),
	new Vector3(34.3, -14.6, 0)
]

let area23 =
[
	new Vector3(28.5, -24.1, 0),
	new Vector3(30.5, -24.6, 0)
]

export function generateSpawnAreas(): Vector3[][] {
	return [
	area1,
	area2,
	area3,
	area4,
	area5,
	area6,
	area7,
	area8,
	area9,
	area10,
	area11,
	area12,
	area13,
	area14,
	area15,
	area16,
	area17,
	area18,
	area19,
	area20,
	area21,
	area22,
	area23
]
}

// GROUND VECTORS
export const points =
[
	new Vector3(93.06, 0, -27.74),
	new Vector3(93.02, 0, -25.4),
	new Vector3(89.12, 0, -24.2),
	new Vector3(89.22, 0, -21.54),
	new Vector3(99.42, 0, -20.64),
	new Vector3(97.88, 0, -15.8),
	new Vector3(91.28, 0, -14.6),
	new Vector3(91.04, 0, -12.06),
	new Vector3(96.48, 0, -8.9),
	new Vector3(99.54, 0, -6.26),
	new Vector3(99.14, 0, -2.56),
	new Vector3(97.28, 0, -1.2),
	new Vector3(89.98, 0, -2.1),
	new Vector3(88.68, 0, -0.2),
	new Vector3(92.14, 0, 5.44),
	new Vector3(95.04, 0, 8.24),
	new Vector3(99.84, 0, 9.54),
	new Vector3(100.44, 0, 13.04),
	new Vector3(90.3, 0, 11.74),
	new Vector3(90.1, 0, 14.24),
	new Vector3(93.1, 0, 17.54),
	new Vector3(97.2, 0, 18.24),
	new Vector3(98.7, 0, 19.94),
	new Vector3(97.9, 0, 24.24),
	new Vector3(94.7, 0, 27.44),
	new Vector3(84.0, 0, 27.84),
	new Vector3(81.16, 0, 26.24),
	new Vector3(85.26, 0, 25.54),
	new Vector3(87.76, 0, 24.04),
	new Vector3(84.16, 0, 22.84),
	new Vector3(73.86, 0, 23.24),
	new Vector3(74.16, 0, 19.74),
	new Vector3(80.36, 0, 17.24),
	new Vector3(80.46, 0, 5.8),
	new Vector3(79.06, 0, 1.8),
	new Vector3(75.52, 0, 1.24),
	new Vector3(71.82, 0, 3.54),
	new Vector3(70.32, 0, 9.14),
	new Vector3(59.82, 0, 5.64),
	new Vector3(60.22, 0, 2.64),
	new Vector3(62.72, 0, 2.44),
	new Vector3(63.92, 0, -0.36),
	new Vector3(75.72, 0, -2.86),
	new Vector3(77.82, 0, -7.22),
	new Vector3(75.42, 0, -14.72),
	new Vector3(78.22, 0, -20.92),
	new Vector3(76.42, 0, -25.22),
	new Vector3(71.02, 0, -21.72),
	new Vector3(68.02, 0, -23.52),
	new Vector3(63.92, 0, -22.92),
	new Vector3(63.12, 0, -19.42),
	new Vector3(58.92, 0, -16.82),
	new Vector3(55.62, 0, -15.32),
	new Vector3(49.32, 0, -14.92),
	new Vector3(45.52, 0, -16.92),
	new Vector3(44.52, 0, -25.02),
	new Vector3(42.72, 0, -24.82),
	new Vector3(42.02, 0, -17.62),
	new Vector3(39.42, 0, -16.52),
	new Vector3(38.12, 0, -13.02),
	new Vector3(41.92, 0, -9.36),
	new Vector3(50.68, 0, -5.32),
	new Vector3(51.88, 0, -2.52),
	new Vector3(48.18, 0, -1.02),
	new Vector3(43.68, 0, 0.22),
	new Vector3(37.88, 0, 0.42),
	new Vector3(37.28, 0, -3.38),
	new Vector3(33.98, 0, -3.72),
	new Vector3(33.04, 0, -2.18),
	new Vector3(38.24, 0, 3.52),
	new Vector3(46.44, 0, 4.72),
	new Vector3(46.64, 0, 7.22),
	new Vector3(39.84, 0, 6.92),
	new Vector3(36.84, 0, 8.52),
	new Vector3(36.64, 0, 11.92),
	new Vector3(40.54, 0, 15.26),
	new Vector3(40.84, 0, 19.66),
	new Vector3(34.88, 0, 21.52),
	new Vector3(32.24, 0, 16.76),
	new Vector3(30.24, 0, 15.86),
	new Vector3(29.24, 0, 12.86),
	new Vector3(27.14, 0, 12.66),
	new Vector3(26.64, 0, 10.86),
	new Vector3(30.68, 0, 7.12),
	new Vector3(32.14, 0, 2.06),
	new Vector3(26.04, 0, 2.06),
	new Vector3(23.74, 0, -1.04),
	new Vector3(26.5, 0, -9.8),
	new Vector3(29.74, 0, -10.54),
	new Vector3(31.6, 0, -13.6),
	new Vector3(29.4, 0, -16.6),
	new Vector3(24.9, 0, -16.7),
	new Vector3(23.4, 0, -20.0),
	new Vector3(25.0, 0, -22.4),
	new Vector3(26.6, 0, -23.3),
	new Vector3(25.9, 0, -26.3),
	new Vector3(32.44, 0, -26.34)
]