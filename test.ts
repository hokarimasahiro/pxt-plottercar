input.onButtonPressed(Button.A, function () {
    basic.pause(1000)
    plotterCar.Straight(100);
})
input.onButtonPressed(Button.B, function () {
    basic.pause(1000)
    plotterCar.curve(0, 720);
})
input.onButtonPressed(Button.AB, function () {
    basic.pause(1000)
    plotterCar.Rotate(720);
})
serial.redirectToUSB();
serial.writeLine("Ready !!");
basic.showIcon(IconNames.Heart)