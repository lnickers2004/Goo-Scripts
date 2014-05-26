(function(window, document){
  var AmmoUtil = {};
  var pvec,ptrans,pquat;
  var quat, goo;
  
  //console.log(goo);
  console.log(window.goo);
  
  AmmoUtil.createAmmoSystem = function(args, ctx, _goo){
  	console.log(goo);
  	console.log(window.goo);
  	goo = goo || _goo;
	function AmmoSystem(){
		this.priority = Infinity;
		args = args || {};
		goo.System.call(this, 'AmmoSystem', ['RigidBodyComponent', 'ColliderComponent', 'TransformComponent']);
		this.fixedTime = 1/(args.stepFrequency || 60);
		this.maxSubSteps = args.maxSubSteps || 10;
		this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
		this.overlappingPairCache = new Ammo.btDbvtBroadphase();
		this.solver = new Ammo.btSequentialImpulseConstraintSolver();
		this.ammoWorld = new Ammo.btDiscreteDynamicsWorld(this.dispatcher, this.overlappingPairCache, this.solver, this.collisionConfiguration);
		
		pvec = pvec || new Ammo.btVector3(0,0,0);
		pvec = this.ammoWorld.getGravity();
		args.gravity = args.gravity || [0, -9.8, 0];
		pvec.setValue(args.gravity[0], args.gravity[1], args.gravity[2]);
		this.ammoWorld.setGravity(pvec);
	}
	AmmoSystem.prototype = Object.create(goo.System.prototype);
	AmmoSystem.constructor = AmmoSystem;
	
	AmmoSystem.prototype.inserted = function(ent){
		if(ent.rigidBodyComponent && ent.colliderComponent){
			this.ammoWorld.addRigidBody(ent.rigidBodyComponent.body);
		}
	};
	
	AmmoSystem.prototype.process = function(entities, tpf) {
		this.ammoWorld.stepSimulation(tpf, this.maxSubSteps, this.fixedTime);
		var i = entities.length;
		while(i--){
			if(entities[i].rigidBodyComponent.body.getMotionState()){
				entities[i].rigidBodyComponent.updateVisuals(entities[i]);
			}
		}
	};
	AmmoSystem.prototype.deleted = function(ent) {
		if (ent.ammoComponent) {
			this.ammoWorld.removeRigidBody(ent.rigidBodyComponent.body);
		}
	};
	
	AmmoSystem.prototype.setGravity = function(x, y, z){
		var gravity = this.ammoWorld.getGravity();
		(typeof(x) === 'number') ? gravity.setValue(x, y, z) : gravity.setValue(x[0], x[1], x[2]);
		this.ammoWorld.setGravity(gravity);
		delete gravity;
	}
	
	var ammoSystem = new AmmoSystem();
	return ammoSystem;
  }
  AmmoUtil.destroyAmmoSystem = function(args, ctx, _goo){
  	goo = goo || _goo;
  	var ammoSystem = ctx.world.getSystem("AmmoSystem");
  	if(ammoSystem){
  		var i = ammoSystem._activeEntities.length;
  		while(i--){
  			if(ammoSystem._activeEntities[i].rigidBodyComponent){
  				ammoSystem._activeEntities[i].clearComponent("RigidBodyComponent");
  				ammoSystem._activeEntities[i].clearComponent("ColliderComponent");
  			}	
  		}
  		
  		delete ammoSystem.ammoWorld;
  		delete ammoSystem.solver;
  		delete ammoSystem.overlappingPairCache;
  		delete ammoSystem.dispatcher;
  		delete ammoSystem.collisionConfiguration;
  	
  		var index = ctx.world._systems.indexOf(ammoSystem);
  		if(index !== -1){
  			ctx.world._systems.splice(index, 1);
  		}
  	}
  }
  
  AmmoUtil.createRigidBodyComponent = function(args, ctx, _goo){
  	goo = goo || _goo;
	function RigidBodyComponent(){
		args = args || {};
  		this.type = 'RigidBodyComponent';
  		this.mass = args.mass || 0.0;
  		var collider = ctx.entity.getComponent("ColliderComponent");
  		if(undefined === collider){
  			collider = args.collider || null;
  			if(null === collider){
  				// auto generate collider here based on shape...
  				console.error("No ColliderComponent found!");
  				return;
  			}
  			ctx.entity.setComponent(collider);
  		}
  		var startTransform = new Ammo.btTransform();
		var gooPos = ctx.entity.transformComponent.transform.translation;
		var gooRot = ctx.entity.transformComponent.transform.rotation;
		var localInertia = new Ammo.btVector3(0, 0, 0);
		if(this.mass !== 0){
			collider.shape.calculateLocalInertia(this.mass, localInertia);
		}
		startTransform.setOrigin(new Ammo.btVector3(gooPos.x, gooPos.y, gooPos.z));
		quat = quat || new goo.Quaternion();
		quat.fromRotationMatrix(gooRot);
		startTransform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
		var myMotionState = new Ammo.btDefaultMotionState(startTransform);
		var rbInfo = new Ammo.btRigidBodyConstructionInfo(this.mass, myMotionState, collider.shape, localInertia);
		this.body = new Ammo.btRigidBody(rbInfo);
  	}
  	RigidBodyComponent.prototype = Object.create(goo.Component.prototype);
  	RigidBodyComponent.constructor = RigidBodyComponent;

  	RigidBodyComponent.prototype.updateVisuals = function(ent){
 		var tc = ent.transformComponent;
  		var pos = tc.transform.translation;
  		var rot = tc.transform.rotation;
  	
  		ptrans = ptrans || new Ammo.btTransform();
 		pquat = pquat || new Ammo.btQuaternion();
 		pvec = pvec || new Ammo.btVector3();
 		quat = quat || new goo.Quaternion();
 		
  		this.body.getMotionState().getWorldTransform(ptrans);
  		ptrans.getBasis().getRotation(pquat);
		quat.setd(pquat.x(), pquat.y(), pquat.z(), pquat.w());
		quat.toRotationMatrix(rot);
		pvec = ptrans.getOrigin();
		pos.setd(pvec.x(), pvec.y(), pvec.z());
		tc.setUpdated();
  	};
  	
  	var rigidBody = new RigidBodyComponent;
  	return rigidBody;
  	
  }
  AmmoUtil.createBoxColliderComponent = function(args, ctx, _goo){
  	goo = goo || _goo;
  	function BoxColliderComponent(){
  		args = args || {};
  		args.halfExtents = args.halfExtents || [1,1,1];
  		this.type = 'ColliderComponent';
  		pvec = pvec || new Ammo.btVector3();
  		pvec.setValue(args.halfExtents[0], args.halfExtents[1], args.halfExtents[2]);
  		this.shape = new Ammo.btBoxShape(pvec);
  	}
  	BoxColliderComponent.prototype = Object.create(goo.Component.prototype);
  	BoxColliderComponent.constructor = BoxColliderComponent;
  	
  	var shape = new BoxColliderComponent();
  	return shape;
  }
  AmmoUtil.createSphereColliderComponent = function(args, ctx, _goo){
  	goo = goo || _goo;
  	function SphereColliderComponent(){
  		args = args || {};
  		args.radius = args.radius || 1;
  		this.type = 'ColliderComponent';
  		this.shape = new Ammo.btSphereShape(args.radius);
  	}
  	SphereColliderComponent.prototype = Object.create(goo.Component.prototype);
  	SphereColliderComponent.constructor = SphereColliderComponent;
  	var shape = new SphereColliderComponent();
  	return shape;
  }
  AmmoUtil.createCylinderZColliderComponent = function(args, ctx, _goo){
  	goo = goo || _goo;
  	function CylinderZColliderComponent(){
  		args = args || {};
  		args.radius = args.radius || 1.0;
  		args.halfHeight = args.halfHeight || 1.0;
  		this.type = 'ColliderComponent';
  		pvec = pvec || new Ammo.btVector3();
  		pvec.setValue(args.radius, args.radius, args.halfHeight);
  		this.shape = new Ammo.btCylinderShapeZ(pvec);
  	}
  	CylinderZColliderComponent.prototype = Object.create(goo.Component.prototype);
  	CylinderZColliderComponent.constructor = CylinderZColliderComponent;
  	
  	var shape = new CylinderZColliderComponent();
  	return shape;
  }
  AmmoUtil.createCylinderXColliderComponent = function(args, ctx, _goo){
  	goo = goo || _goo;
  	function CylinderXColliderComponent(){
  		args = args || {};
  		args.radius = args.radius || 1.0;
  		args.halfHeight = args.halfHeight || 1.0;
  		this.type = 'ColliderComponent';
  		pvec = pvec || new Ammo.btVector3();
  		pvec.setValue(args.halfHeight, args.radius, args.radius);
  		this.shape = new Ammo.btCylinderShapeX(pvec);
  	}
  	CylinderXColliderComponent.prototype = Object.create(goo.Component.prototype);
  	CylinderXColliderComponent.constructor = CylinderXColliderComponent;
  	
  	var shape = new CylinderXColliderComponent();
  	return shape;
  }
  AmmoUtil.createCylinderYColliderComponent = function(args, ctx, _goo){
  	goo = goo || _goo;
  	function CylinderYColliderComponent(){
  		args = args || {};
  		args.radius = args.radius || 1.0;
  		args.halfHeight = args.halfHeight || 1.0;
  		this.type = 'ColliderComponent';
  		pvec = pvec || new Ammo.btVector3();
  		pvec.setValue(args.radius, args.halfHeight, args.radius);
  		this.shape = new Ammo.btCylinderShape(pvec);
  	}
  	CylinderYColliderComponent.prototype = Object.create(goo.Component.prototype);
  	CylinderYColliderComponent.constructor = CylinderYColliderComponent;
  	
  	var shape = new CylinderYColliderComponent();
  	return shape;
  }
  AmmoUtil.createAmmoMeshComponent = function(args, ctx, goo){
  	
  }
  
  AmmoUtil.setLinearVelocity = function(body, vec3){
  	pvec = pvec || new Ammo.btVector3();
  	
  	pvec.setValue(vec3.x, vec3.y, vec3.z);
	body.setLinearVelocity(pvec);
  };
  AmmoUtil.setRotation = function(body, quat){
 	ptrans = ptrans || new Ammo.btTransform();
 	pquat = pquat || new Ammo.btQuaternion();
 	
	ptrans = body.getCenterOfMassTransform();
	pquat = ptrans.getRotation();
	pquat.setValue(quat.x, quat.y, quat.z, quat.w);
	ptrans.setRotation(pquat);
	body.setCenterOfMassTransform(ptrans);
  };
  
  var global = global || window;
  global.AmmoUtil = AmmoUtil;
}(window, document, undefined));
