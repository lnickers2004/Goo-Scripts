(function(window, document, undefined){
  var VehicleHelper = function(ammoSystem, body, wheelRadius, suspensionLength, goo){
    this.quat = new goo.Quaternion();
    this.pvec = new Ammo.btVector3();
    this.pquat = new Ammo.btQuaternion();
  	this.body = body;
  	this.wheelRadius = wheelRadius;
  	this.suspension = suspensionLength;
  	this.debugTires = [];
  
  	body.forceActivationState(4);
  	this.tuning = new Ammo.btVehicleTuning();
  	var vehicleRaycaster = new Ammo.btDefaultVehicleRaycaster(ammoSystem.ammoWorld);
  	this.vehicle = new Ammo.btRaycastVehicle(this.tuning, body, vehicleRaycaster);
  	ammoSystem.ammoWorld.addVehicle(this.vehicle);
  	this.vehicle.setCoordinateSystem(0,1,2); // choose coordinate system
  	this.wheelDir = new Ammo.btVector3(0,-1,0);
  	this.wheelAxle = new Ammo.btVector3(-1,0,0);
  
  	//chassis.ammoComponent.body.setAngularFactor(new Ammo.btVector3(0,1,0)); restrict angular movement
  }
  VehicleHelper.prototype.resetAtPos = function(pos){
  	var b = this.body;
  	var t = b.getCenterOfMassTransform();
  	t.setIdentity();
    this.pvec.setValue(pos.data[0], pos.data[1], pos.data[2]);
  	t.setOrigin(this.pvec);
  	b.setCenterOfMassTransform(t);
  	this.pvec.setValue(0, 0, 0)
  	b.setAngularVelocity(this.pvec);
  	b.setLinearVelocity(this.pvec);
  };
  VehicleHelper.prototype.setSteeringValue = function(steering) {
  	for(var i = 0, ilen = this.vehicle.getNumWheels(); i < ilen; i++){
  		if(this.vehicle.getWheelInfo(i).get_m_bIsFrontWheel()){
  			this.vehicle.setSteeringValue(steering,i);
  		}
  	}
  };
  VehicleHelper.prototype.applyEngineForce = function(force, front) {
  	for(var i = 0, ilen = this.vehicle.getNumWheels(); i < ilen; i++){
  		if(front === undefined || this.vehicle.getWheelInfo(i).get_m_bIsFrontWheel() === front) {
  			this.vehicle.applyEngineForce(force,i);
  		}
  	}
  };
  VehicleHelper.prototype.setBrake = function(force) {
  	for(var i = 0, ilen = this.vehicle.getNumWheels(); i < ilen; i++){
  		this.vehicle.setBrake(force,i);
  	}
  };
  VehicleHelper.prototype.setWheelAxle = function(x, y, z) {
  	this.wheelAxle.setValue(x, y, z);
  };
  VehicleHelper.prototype.addFrontWheel = function(pos) {
  	this.addWheel(pos[0], pos[1], pos[2], true);
  };
  VehicleHelper.prototype.addRearWheel = function(pos) {
  	this.addWheel(pos[0], pos[1], pos[2], false);
  };
  VehicleHelper.prototype.addWheel = function(x,y,z, isFrontWheel){
    this.pvec.setValue(x, y, z);
  	var wheel = this.vehicle.addWheel(this.pvec,this.wheelDir,this.wheelAxle,this.suspension,this.wheelRadius,this.tuning,isFrontWheel);
  	wheel.set_m_suspensionStiffness(20);
  	wheel.set_m_wheelsDampingRelaxation(2.3);
  	wheel.set_m_wheelsDampingCompression(4.4);
  	wheel.set_m_frictionSlip(1000);
  	wheel.set_m_rollInfluence(0); // this value controls how easily a vehicle can tipp over. Lower values tipp less :)
  };
  VehicleHelper.prototype.updateWheelTransform = function(){
    console.log(this.vehicle);
    var vs = this.vehicle.getSteeringValue()*(Math.PI/180);
    this.vehicle.setSteeringValue(vs, 0);
    this.vehicle.setSteeringValue(vs, 1);
    
    var ef = this.vehicle.getCurrentSpeedKmHour();
    console.log(ef);
    
  	for(var i = 0, ilen = this.vehicle.getNumWheels(); i < ilen; i++){
  		// synchronize the wheels with the (interpolated) chassis worldtransform
  		this.vehicle.updateWheelTransform(i, true);
  		var dt = this.debugTires[i];
  		if(dt) {
  		  var r = this.vehicle.getWheelInfo(i).get_m_rotation();
        if(i < 2){
          if(vs < 0){
            dt.transformComponent.transform.rotation.fromAngles(-r, vs, 0);
          }
          else{
            dt.transformComponent.transform.rotation.fromAngles(r, vs, 0);
          }
        }
        else{
          if(vs < 0){
            if(ef < 0){
              dt.transformComponent.transform.rotation.fromAngles(-r, 0, 0);
            }
            else{
              dt.transformComponent.transform.rotation.fromAngles(r, 0, 0);
            }
          }
          else{
            if(ef < 0){
              dt.transformComponent.transform.rotation.fromAngles(r, 0, 0);
            }
            else{
              dt.transformComponent.transform.rotation.fromAngles(-r, 0, 0);
            }
          }
        }
  		  this.pvec = this.vehicle.getWheelInfo(i).get_m_worldTransform().getOrigin();
  		  dt.transformComponent.transform.translation.setd(this.pvec.x(), this.pvec.y(), this.pvec.z());
  			dt.transformComponent.setUpdated();
  		}
  	}
  };
  
  VehicleHelper.prototype.addDefaultWheels = function(bound){
  	this.wheelRadius = bound.xExtent / 3;
  	this.addFrontWheel([bound.xExtent, -0.06, bound.zExtent]);
  	this.addFrontWheel([-bound.xExtent, -0.06, bound.zExtent]);
  	this.addRearWheel([bound.xExtent, -0.06, -bound.zExtent]);
  	this.addRearWheel([-bound.xExtent, -0.06, -bound.zExtent]);
  };
  var global = global || window;
  global.VehicleHelper = VehicleHelper;
}(window, document));
