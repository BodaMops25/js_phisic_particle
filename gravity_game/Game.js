
class GravityGame {
  constructor() {
    this._bodies = []
    this._bodiesFrame = []
    this._gravityConst = 6.674 * 10e-11
  }

  set gravityConst(num) {
    this._gravityConst = MathTools.validateNum(num)
  }
  get gravityConst() {return this._gravityConst}

  /**
   * @param {stringOrNumber} mark if parameter "mark" has data type "string" looking for body by id, 
   * else if parameter mark has data type "number" looking for body by index
   */
  getBody(mark) {
    let b = null,
      searchingType = ''

    if(typeof mark === 'string') {
      b = this._bodies.find(b => b.id === mark)
      searchingType = 'id'
    }
    else if(Number.isNaN(+mark) === false) {
      b = this._bodies[+mark]
      searchingType = 'index'
    }
    else {console.error('Parameter must be string or number'); return}

    if(b === undefined) {console.error('Can\'t find body with current mark'); return}
    return b
  }

  addBody(bodyObj) {
    if(bodyObj.constructor !== Body) {console.error('Parameter must be class Body'); return false}
    this._bodies.push(bodyObj)
    return bodyObj
  }

  removeBodyByIndex(index) {
    index = +index
    if(Number.isNaN(index)) {console.error('Parameter must be number'); return}
    else if(this._bodies[index] === undefined) {console.error('Can\'t finde body with current index'); return}
    return this._bodies.splice(index, 1)
  }

  removeBodyById(id) {
    if(typeof id !== 'string') {console.error('Parameter must be string'); return}
    const index = this._bodies.findIndex(b => b.id === id)
    if(index === -1) {console.error('Can\'t finde body with current id'); return}
    return this._bodies.splice(index, 1)
  }

  gravityLaw(b1, b2) {
    if(b1.constructor !== Body || b2.constructor !== Body) {console.error('Parameters must be class Body'); return false}
    return (b1.mass * b2.mass) / GravityGame.bodiesDistance(b1, b2) * this.gravityConst
  }

  gravityPolarVector(b1, b2) {
    if(b1.constructor !== Body || b2.constructor !== Body) {console.error('Parameters must be class Body'); return false}
    const force = this.gravityLaw(b1, b2),
          angle = GravityGame.bodiesAngle(b1, b2)

    return new PolarVector(force, angle)
  }

  /**
   * returns an array of bodies that will collide with the body in the next step
   */
  collision(b) {
    if(b.constructor !== Body) {console.error('Parameter must be class Body'); return false}

    const b_accelerationCartesionVec = b.acceleration.toCartesianCoords(),
          b_vec = new CartesianVector(b.x, b.y),
          b_nextVec = b_vec.add(b_accelerationCartesionVec).divideAbs(b.mass)

    return this._bodies.filter(b2 => {
      if(b === b2) return false

      const b2_accelerationCartesionVec = b2.acceleration.toCartesianCoords(),
            b2_vec = new CartesianVector(b2.x, b2.y),
            b2_nextVec = b2_vec.add(b2_accelerationCartesionVec).divideAbs(b2.mass)

      const d = b2_nextVec.substract(b_nextVec).toPolarCoords().x

      return d <= b.radius + b2.radius
    })
  }
  
  /* collision(b) {
    if(b.constructor !== Body) {console.error('Parameter must be class Body'); return false}

    const arr = this._bodies.filter(b2 => {
      if(b === b2) return false
      return Math.abs(b2.x - b.x) <= b.radius + b2.radius
    })

    return arr.filter(b2 => {
      return Math.abs(b2.y - b.y) <= b.radius + b2.radius
    })
  } */

  nextFrame() {
    this._bodies.forEach(b => {

      this._bodies.forEach(b2 => {
        if(b2 !== b) {
          const gravity = this.gravityPolarVector(b, b2)
          b.addAcceleration(gravity)
        }
      })
    })
  }

  /**
   * use only in collision
   */
  static collisionResistence(b1, b2) {
    if(b1.constructor !== Body || b2.constructor !== Body) {console.error('Parameters must be class Body'); return false}
    
    const b1_accelerationCartesionVec = b1.acceleration.toCartesianCoords(),
          b1_vec = new CartesianVector(b1.x, b1.y),
          b1_nextVec = b1_vec.add(b1_accelerationCartesionVec).divideAbs(b1.mass),
          b2_accelerationCartesionVec = b2.acceleration.toCartesianCoords(),
          b2_vec = new CartesianVector(b2.x, b2.y),
          b2_nextVec = b2_vec.add(b2_accelerationCartesionVec).divideAbs(b2.mass),
          collisionData = b2_nextVec.substract(b_nextVec).toPolarCoords()

    return collisionData.x = (b1.radius + b2.radius) - collisionData.x
  }

  static bodiesDistance(b1, b2) {
    if(b1.constructor !== Body || b2.constructor !== Body) {console.error('Parameters must be class Body'); return false}
    return new CartesianVector(b2.x - b1.x, b2.y - b1.y).toPolarCoords().x
  }

  static bodiesAngle(b1, b2) {
    if(b1.constructor !== Body || b2.constructor !== Body) {console.error('Parameters must be class Body'); return false}
    return new CartesianVector(b2.x - b1.x, b2.y - b1.y).toPolarCoords().y
  }
}

class Body {
  constructor({x = 0, y = 0, mass = 1, radius = 1, force = 0, angle = 0, id = ''} = {}) {
    [x, y, mass, radius, force, angle] = MathTools.validateNum(x, y, mass, radius, force, angle)

    this._x = x
    this._y = y
    this._mass = mass
    this._radius = radius
    this._acceleration = new PolarVector(force, angle)

    if(id !== '' && typeof id === 'string') this._id = id
  }

  set x(num) {this._x = MathTools.validateNum(num)}
  get x() {return this._x}

  set y(num) {this._y = MathTools.validateNum(num)}
  get y() {return this._y}

  set mass(num) {this._mass = MathTools.validateNum(num)}
  get mass() {return this._mass}

  set radius(num) {this._radius = MathTools.validateNum(num)}
  get radius() {return this._radius}

  set acceleration(polarVector) {
    if(polarVector.constructor !== PolarVector) {console.error('Parameter must be class PolarVector'); return}
    this._acceleration = polarVector
  }
  get acceleration() {return this._acceleration}
  
  set id(string) {
    if(typeof string !== 'string') {console.error('Parameter must be string'); return}
    this._id = string
  }
  get id() {return this._id}

  addAcceleration(polarVector) {
    if(polarVector.constructor !== PolarVector) {console.error('Parameter must be class PolarVector'); return}

    const v1 = this.acceleration.toCartesianCoords(),
          v2 = polarVector.toCartesianCoords()

    this.acceleration = v1.add(v2).toPolarCoords()
  }
}