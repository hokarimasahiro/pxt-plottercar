//% color=#0c0c0c icon="\u270f" block="plotter car"
namespace plotterCar {
	let motor_step:number[] = [0x1001, 0x1000, 0x1010, 0x0010, 0x0110, 0x0100, 0x0101, 0x0001];

	let nowStepL=0;
	let nowStepR = 0;
	let lastRight = 0;
	let lastLeft = 0;

	let backLashCount = 4 * 8;

	let pi = 3.14159
	let tredMm = 80.1
	let mmParStep = 13.8 * 8
	let circleParStep = tredMm * pi * mmParStep

	let penUpDigree = 20
	let penDownDigree = 40

	function step_wait () {
	    control.waitMicros(350)
	}
	function motor_l (ap: number, am: number, bp: number, bm: number) {
	    pins.digitalWritePin(DigitalPin.P0, ap)
	    pins.digitalWritePin(DigitalPin.P1, am)
	    pins.digitalWritePin(DigitalPin.P2, bp)
	    pins.digitalWritePin(DigitalPin.P13, bm)
	}
	function motor_r (ap: number, am: number, bp: number, bm: number) {
	    pins.digitalWritePin(DigitalPin.P8, ap)
	    pins.digitalWritePin(DigitalPin.P12, am)
	    pins.digitalWritePin(DigitalPin.P14, bp)
	    pins.digitalWritePin(DigitalPin.P16, bm)
	}
    /**
     * drow Straight line
     */
    //* @param distance line length(mm), eg:50
    //% block="drow straight line length=%distance"
	export function Straight (distance: number) {
	    execMotor(distance * mmParStep, distance * mmParStep)
	}
	export function curve (diameter: number, digree: number) {
		let insideStep;
		let outsideStep;

	    if (Math.abs(diameter) <= 1) {
	        outsideStep = (circleParStep + circleParStep) * (digree / 360)
	        insideStep = 0
	    } else {
	        outsideStep = (tredMm + Math.abs(diameter)) * pi * mmParStep * (digree / 360)
	        insideStep = (Math.abs(diameter) - tredMm) * pi * mmParStep * (digree / 360)
	    }
	    if (diameter >= 0) {
		    execMotor(outsideStep, insideStep)
	    } else {
		    execMotor(insideStep, outsideStep)
	    }
	}
	export function Rotate (digree: number) {
	    execMotor(digree / 360 * circleParStep, digree / -360 * circleParStep)
	}
	function execMotor (leftStep: number, rightStep: number) {
		let base_step = 0
		let step_l;
		let step_r;

	// モーター起動
		step_l = motor_step[nowStepL];
	    motor_l((step_l >> 3) & 0x01, (step_l >> 2) & 0x01, (step_l >> 1) & 0x01, (step_l >> 0) & 0x01);
		step_r = motor_step[nowStepR];
	    motor_r((step_r >> 3) & 0x01, (step_r >> 2) & 0x01, (step_r >> 1) & 0x01, (step_r >> 0) & 0x01);
	    step_wait()

	// バックラッシュ処理
	    if (lastLeft * leftStep <= 0) {
	        for (let index = 0; index < backLashCount; index++) {
	            if (leftStep > 0) {
					nowStepL = (nowStepL + 1) % 8;
	            } else {
					nowStepL = (nowStepL + 7) % 8;
	            }
	            step_l = motor_step[nowStepL]
	            motor_l((step_l >> 3) & 0x01, (step_l >> 2) & 0x01, (step_l >> 1) & 0x01, (step_l >> 0) & 0x01);
	            step_wait()
	        }
	    }
	    if (lastRight * rightStep <= 0) {
	        for (let index = 0; index < backLashCount; index++) {
	            if (rightStep > 0) {
					nowStepR = (nowStepR + 1) % 8;
	            } else {
					nowStepR = (nowStepR + 7) % 8;
	            }
	            step_r = motor_step[nowStepR]
	            motor_r((step_r >> 3) & 0x01, (step_r >> 2) & 0x01, (step_r >> 1) & 0x01, (step_r >> 0) & 0x01);
	            step_wait()
	        }
	    }

	    base_step = Math.max(Math.abs(leftStep), Math.abs(rightStep))  // 外周のステップ数

	    for (let index = 1; index <= base_step; index++) {
	        step_l = motor_step[mod(nowStepL + (leftStep * (index / base_step)), 8)];
	        step_r = motor_step[mod(nowStepR + (rightStep * (index / base_step)), 8)];
	        motor_l((step_l >> 3) & 0x01, (step_l >> 2) & 0x01, (step_l >> 1) & 0x01, (step_l >> 0) & 0x01);
	        motor_r((step_r >> 3) & 0x01, (step_r >> 2) & 0x01, (step_r >> 1) & 0x01, (step_r >> 0) & 0x01);
	        step_wait()
	    }
	    nowStepL = mod(nowStepL + leftStep, 8);
	    nowStepR = mod(nowStepR + rightStep, 8);

	// モーター停止
	    motor_l(0, 0, 0, 0)
	    motor_r(0, 0, 0, 0)

	// 今回動作状態保存
	    if (leftStep != 0) {
	        lastLeft = leftStep
	    }
	    if (rightStep != 0) {
	        lastRight = rightStep
	    }

	}
	function mod (n1: number, n2: number) : number {
		if (n1 > 0) return n1 % n2;
		else return (n1 % n2 + n2) % n2;
	}
}
