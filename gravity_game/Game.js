
class GravityGame {
  constructor() {
    this._body = []
    this._bodyFrame = []
    this._gravityConst = 6.674 * 10e-11
  }

  set gravityConst(num) {
    this._gravityConst = MathTools.validateNum(num)
  }
  get gravityConst() {return this._gravityConst}

  getGravity(b1, b2) {}
}

class Body {
  constructor({x = 0, y = 0, mass = 1, radius = 1, acceleration = {force: 0, angle: 0}} = {}) {
    this.x = x
    this.y = y
    this.mass = mass
    this.radius = radius
    this.acceleration = acceleration
  }

  
}