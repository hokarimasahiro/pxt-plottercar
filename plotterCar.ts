//% color=#3080c0 icon="\u270d" block="plotter car"
namespace plotterCar {
	let motor_step:number[] = [0b1001, // A, -B
                               0b1000, // A
                               0b1010, // A, B
                               0b0010, // B
                               0b0110, // B,-A
                               0b0100, // -A
                               0b0101, // -A,-B
                               0b0001];// -B

	let nowStepL=0;
	let nowStepR = 0;
	let lastRight = 0;
	let lastLeft = 0;

	let backLashCount = 1;
    let normalSpeed = 1000;     // Hz
    let maxSpeed = 2000;        // Hz
    let lowSpeed = 100;         // Hz
    let accelerationStep = 5;   // Hz
    let waitUnit = 50 ;         // uS
    let normalWaitCount = (1 / normalSpeed) * 1000000 / waitUnit ;
    let continuousLeft=0;       // -255 to +255
    let continuousRight= 0;     // -255 to +255

	let pi = 3.14159265359;
	let tredMm = 81.0;
	let stepParMm = 8.37;
	let circleParStep = tredMm * pi * stepParMm

	function step_wait (count:number) {
        for(let i=0;i<count;i++) control.waitMicros(waitUnit);
	}
	function motor_l (ap: number, am: number, bp: number, bm: number) {
	    pins.digitalWritePin(DigitalPin.P1, ap)
	    pins.digitalWritePin(DigitalPin.P2, am)
	    pins.digitalWritePin(DigitalPin.P8, bp)
	    pins.digitalWritePin(DigitalPin.P12, bm)
	}
	function motor_r (ap: number, am: number, bp: number, bm: number) {
	    pins.digitalWritePin(DigitalPin.P16, ap)
	    pins.digitalWritePin(DigitalPin.P15, am)
	    pins.digitalWritePin(DigitalPin.P14, bp)
	    pins.digitalWritePin(DigitalPin.P13, bm)
	}
    /**
     * continuous operation
     */
    //* @param left left speed, eg:128
    //* @param right right speed, eg:128
    //% block="continuous operation left=%left|right=%right"
    export function continuousOperation(left:number,right:number){
        continuousLeft = (left > 255) ? 255 : (left < -255) ? -255 : left;
        continuousRight = (right > 255) ? 255 : (right < -255) ? -255 : right;
    }
    control.inBackground(function () {
		let base_step:number;
		let step_l:number,step_r:number;
        let speed:number,waitCount:number;

        while (true) {
            if ((continuousLeft == 0) && (continuousLeft == 0)){
                basic.pause(10)
            } else {
                if (continuousLeft == 0){
                    motor_l(0,0,0,0);       // ??????????????????
                } else {
                    // ??????????????????
                    step_l = motor_step[nowStepL];
                    motor_l((step_l >> 3) & 0x01, (step_l >> 2) & 0x01, (step_l >> 1) & 0x01, (step_l >> 0) & 0x01);
                }
                if (continuousRight == 0){
                    motor_r(0,0,0,0);       // ??????????????????
                } else {
                    // ??????????????????
                    step_r = motor_step[nowStepR];
                    motor_r((step_r >> 3) & 0x01, (step_r >> 2) & 0x01, (step_r >> 1) & 0x01, (step_r >> 0) & 0x01);
                }

                // ???????????????
                base_step = Math.max(Math.abs(continuousLeft), Math.abs(continuousRight))  // ????????????????????????

                for (let index = 1; index <= base_step; index++) {
                    step_l = motor_step[mod(nowStepL + (continuousLeft * (index / base_step)), 8)];
                    step_r = motor_step[mod(nowStepR + (continuousRight * (index / base_step)), 8)];
                    motor_l((step_l >> 3) & 0x01, (step_l >> 2) & 0x01, (step_l >> 1) & 0x01, (step_l >> 0) & 0x01);
                    motor_r((step_r >> 3) & 0x01, (step_r >> 2) & 0x01, (step_r >> 1) & 0x01, (step_r >> 0) & 0x01);

                    waitCount = ((base_step / 255) / maxSpeed) * 1000000 / waitUnit;
                    step_wait(waitCount)
                }
                nowStepL = mod(nowStepL + continuousLeft, 8);
                nowStepR = mod(nowStepR + continuousRight, 8);
                basic.pause(0);
            }
        }
    })
    /**
     * set ploterCar parameter
     */
    //* @param step step par mm, eg:8.37
    //* @param tred [mm], eg:81.4
    //% block="set ploterCar parameter step=%step|tred=%tred"
    export function setParameter(step:number=8.37,tred:number=81.4){
        if (step != 0) stepParMm = step;
        if (tred != 0) tredMm = tred;
    }
    /**
     * drow Straight line
     */
    //* @param distance line length(mm), eg:50
    //% block="drow straight line length=%distance"
	export function Straight (distance: number) {
        continuousLeft = 0;
        continuousRight = 0;
	    execMotor(distance * stepParMm, distance * stepParMm)
	}
    /**
     * drow arc
     */
    //* @param diameter diameter(mm), eg:100
    //* @param digree digree(??), eg:180
    //% block="drow arc diameter=%distance|digree=%digree"
	export function curve (diameter: number, digree: number) {
		let insideStep;
		let outsideStep;

        continuousLeft = 0;
        continuousRight = 0;

	    if (Math.abs(diameter) <= 1) {
	        outsideStep = (circleParStep + circleParStep) * (digree / 360)
	        insideStep = 0
	    } else {
	        outsideStep = (tredMm + Math.abs(diameter)) * pi * stepParMm * (digree / 360)
	        insideStep = (Math.abs(diameter) - tredMm) * pi * stepParMm * (digree / 360)
	    }
	    if (diameter >= 0) {
		    execMotor(outsideStep, insideStep)
	    } else {
		    execMotor(insideStep, outsideStep)
	    }
	}
    /**
     * rotate a car
     */
    //* @param digree digree(??), eg:180
    //% block="rotate a car digree=%digree"
	export function Rotate (digree: number) {
        continuousLeft = 0;
        continuousRight = 0;

	    execMotor(digree / 360 * circleParStep, digree / -360 * circleParStep)
	}
	function execMotor (leftStep: number, rightStep: number) {
		let base_step:number;
		let step_l:number,step_r:number;
        let speed:number,waitCount:number;

	// ??????????????????
		step_l = motor_step[nowStepL];
	    motor_l((step_l >> 3) & 0x01, (step_l >> 2) & 0x01, (step_l >> 1) & 0x01, (step_l >> 0) & 0x01);
		step_r = motor_step[nowStepR];
	    motor_r((step_r >> 3) & 0x01, (step_r >> 2) & 0x01, (step_r >> 1) & 0x01, (step_r >> 0) & 0x01);
	    step_wait(waitCount)

	// ???????????????????????????
        backlashProc(leftStep,rightStep);

    // ???????????????
	    base_step = Math.max(Math.abs(leftStep), Math.abs(rightStep))  // ????????????????????????

	    for (let index = 1; index <= base_step; index++) {
	        step_l = motor_step[mod(nowStepL + (leftStep * (index / base_step)), 8)];
	        step_r = motor_step[mod(nowStepR + (rightStep * (index / base_step)), 8)];
	        motor_l((step_l >> 3) & 0x01, (step_l >> 2) & 0x01, (step_l >> 1) & 0x01, (step_l >> 0) & 0x01);
	        motor_r((step_r >> 3) & 0x01, (step_r >> 2) & 0x01, (step_r >> 1) & 0x01, (step_r >> 0) & 0x01);

            speed = Math.min(index * accelerationStep,(base_step - index + 1) * accelerationStep);
            waitCount = Math.max((1 / speed) * 1000000 / waitUnit, normalWaitCount);

	        step_wait(waitCount)
	    }
	    nowStepL = mod(nowStepL + leftStep, 8);
	    nowStepR = mod(nowStepR + rightStep, 8);

	// ??????????????????
	    motor_l(0, 0, 0, 0)
	    motor_r(0, 0, 0, 0)
	}
    function backlashProc(leftStep:number,rightStep:number){
        let step_l:number,step_r:number;
    
	    // ???????????????????????????
	    if (lastLeft * leftStep <= 0) {     // ?????????????????????????????????????????????????????????????????????????????????
	        for (let index = 0; index < backLashCount; index++) {
	            if (leftStep > 0) {
					nowStepL = (nowStepL + 1) % 8;
	            } else {
					nowStepL = (nowStepL + 7) % 8;
	            }
	            step_l = motor_step[nowStepL]
	            motor_l((step_l >> 3) & 0x01, (step_l >> 2) & 0x01, (step_l >> 1) & 0x01, (step_l >> 0) & 0x01);
	            step_wait(normalWaitCount)
	        }
	    }
	    if (lastRight * rightStep <= 0) {     // ?????????????????????????????????????????????????????????????????????????????????
	        for (let index = 0; index < backLashCount; index++) {
	            if (rightStep > 0) {
					nowStepR = (nowStepR + 1) % 8;
	            } else {
					nowStepR = (nowStepR + 7) % 8;
	            }
	            step_r = motor_step[nowStepR]
	            motor_r((step_r >> 3) & 0x01, (step_r >> 2) & 0x01, (step_r >> 1) & 0x01, (step_r >> 0) & 0x01);
	            step_wait(normalWaitCount)
	        }
	    }

    	// ????????????????????????
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
