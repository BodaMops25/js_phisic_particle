class MathTools {
  static validateNum(...nums) {

    const values = nums.map((num, i) => {
      if(Number.isNaN(+num)) {
        console.error(`Parameter ${i} with value ${num} not a number`)
        return 0
      }
      return +num
    })

    return values.length === 1 ? values[0] : values
  }

  static randomBetweenInt(min, max) {
    [min, max] = this.validateNum(min, max)
    return Math.round(min + Math.random() * (max - min))
  }

  static radToDeg(rad) {
    rad = this.validateNum(rad)
    return 180 / Math.PI * rad
  }
  static degToRad(deg) {
    deg = this.validateNum(deg)
    return Math.PI / 180 * deg
  }
}

class Vector2 {
  constructor(x = 0, y = 0) {
    this._x = MathTools.validateNum(x)
    this._y = MathTools.validateNum(y)
  }

  set x(num) {this._x = MathTools.validateNum(num)}
  get x() {return this._x}
  set y(num) {this._y = MathTools.validateNum(num)}
  get y() {return this._y}

  add(vector2) {
    if(vector2.constructor !== Vector2) {console.log('Parameter must be Vector2'); return}
    return new Vector2(this.x + vector2.x, this.y + vector2.y)
  }

  substract(vector2) {
    if(vector2.constructor !== Vector2) {console.log('Parameter must be Vector2'); return}
    return new Vector2(this.x - vector2.x, this.y - vector2.y)
  }

  multiply(vector2) {
    if(vector2.constructor !== Vector2) {console.log('Parameter must be Vector2'); return}
    return new Vector2(this.x * vector2.x, this.y * vector2.y)
  }

  divide(vector2) {
    if(vector2.constructor !== Vector2) {console.log('Parameter must be Vector2'); return}
    return new Vector2(this.x / vector2.x, this.y / vector2.y)
  }
}

class CartesianVector2 extends Vector2 {
  constructor(x = 0, y = 0) {
    super(...MathTools.validateNum(x, y))
  }

  toPolarCoords() {
    const module = (this.x**2 + this.y**2)**.5
    
    let angle = 0

      if(this.x !== 0 || this.y !== 0) {
        const cos = this.x / module
        angle = MathTools.radToDeg(Math.acos(cos))

        angle = this.y > 0 ? angle : 360 - angle
      }

    return new PolarVector2(module, angle)
  }  
}

class PolarVector2 extends Vector2 {
  constructor(x = 0, y = 0) {
    super(...MathTools.validateNum(x, y))
  }

  toCartesianCoords() {
    return new CartesianVector2(Math.cos(degToRad(this.y)) * this.x, Math.sin(degToRad(this.y)) * this.x)
  }
}