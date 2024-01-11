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
    [min, max] = MathTools.validateNum(min, max)
    return Math.round(min + Math.random() * (max - min))
  }

  static radToDeg(rad) {
    rad = MathTools.validateNum(rad)
    return 180 / Math.PI * rad
  }
  static degToRad(deg) {
    deg = MathTools.validateNum(deg)
    return Math.PI / 180 * deg
  }
}

class Vector {
  constructor(x = 0, y = 0) {
    this._x = MathTools.validateNum(x)
    this._y = MathTools.validateNum(y)
  }

  set x(num) {this._x = MathTools.validateNum(num)}
  get x() {return this._x}
  set y(num) {this._y = MathTools.validateNum(num)}
  get y() {return this._y}

  add(vector) {
    if(Vector.validateVectorLike(vector) === false) return
    return new this.constructor(this.x + vector.x, this.y + vector.y)
  }

  addAbs(num) {
    num = MathTools.validateNum(num)
    return new this.constructor(this.x + num, this.y + num)
  }

  substract(vector) {
    if(Vector.validateVectorLike(vector) === false) return
    return new this.constructor(this.x - vector.x, this.y - vector.y)
  }

  substractAbs(num) {
    num = MathTools.validateNum(num)
    return new this.constructor(this.x - num, this.y - num)
  }

  multiply(vector) {
    if(Vector.validateVectorLike(vector) === false) return
    return new this.constructor(this.x * vector.x, this.y * vector.y)
  }

  multiplyAbs(num) {
    num = MathTools.validateNum(num)
    return new this.constructor(this.x * num, this.y * num)
  }

  divide(vector) {
    if(Vector.validateVectorLike(vector) === false) return
    return new this.constructor(this.x / vector.x, this.y / vector.y)
  }

  divideAbs(num) {
    num = MathTools.validateNum(num)
    return new this.constructor(this.x / num, this.y / num)
  }

  from(obj) {
    if(obj.x === undefined) {console.warn('Can\'t find param.x'); return}
    else if(obj.y === undefined) {console.warn('Can\'t find param.y'); return}

    [obj.x, obj.y] = MathTools.validateNum(obj.x, obj.y)

    this.x = obj.x
    this.y = obj.y

    return this
  }

  static validateVectorLike(obj) {
    if(
      obj.x === undefined || Number.isNaN(+obj.x) || 
      obj.y === undefined || Number.isNaN(+obj.y)
    ) {console.error('Object not like class Vector'); return false}
    return true
  }
}

class CartesianVector extends Vector {
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

    return new PolarVector(module, angle)
  }  
}

/**
 * @param {int} x means radius in polar coordinates
 * @param {number} y means angle in polar coordinates 
 */
class PolarVector extends Vector {
  constructor(x = 0, y = 0) {
    super(...MathTools.validateNum(x, y))
  }

  toCartesianCoords() {
    return new CartesianVector(Math.cos(MathTools.degToRad(this.y)) * this.x, Math.sin(MathTools.degToRad(this.y)) * this.x)
  }
}