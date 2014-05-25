(function(window, document){
  var AmmoUtil = {};
  var pvec,ptrans,pquat;
  var quat,goo;
  
  AmmoUtil.createAmmoSystem = function(args, ctx, _goo){
  	goo = goo || _goo;
	function AmmoSystem(){
		args = args || {};
		goo.System.call(this, 'AmmoSystem', ['AmmoRigidBody', 'TransformComponent']);
		this.fixedTime = 1/(args.stepFrequency || 60);
		this.maxSubSteps = args.maxSubSteps || 10;
		this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(); // every single |new| currently leaks...
		this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
		this.overlappingPairCache = new Ammo.btDbvtBroadphase();
		this.solver = new Ammo.btSequentialImpulseConstraintSolver();
		this.ammoWorld = new Ammo.btDiscreteDynamicsWorld(this.dispatcher, this.overlappingPairCache, this.solver, this.collisionConfiguration);
		//var pgrav = this.ammoWorld.getGravity();
		args.gravity = args.gravity || [0, -9.8, 0];
		//console.log(args.gravity);
		//pgrav.setValue(args.gravity[0], args.gravity[1], args.gravity[2]);
		this.ammoWorld.setGravity(new Ammo.btVector3(args.gravity[0], args.gravity[1], args.gravity[2]));
		
		//console.log(this.fixedTime);
		//console.log(this.maxSubSteps);
	}
	AmmoSystem.prototype = Object.create(goo.System.prototype);
	AmmoSystem.constructor = AmmoSystem;
	
	AmmoSystem.prototype.inserted = function(ent){
		if(ent.ammoRigidBody){
			console.log(ent);
			this.ammoWorld.addRigidBody(ent.ammoRigidBody.body);
		}
	};
	
	AmmoSystem.prototype.process = function(entities, tpf) {
		this.ammoWorld.stepSimulation(tpf, this.maxSubSteps, this.fixedTime);

		for (var i = 0, ilen = entities.length; i < ilen; i++) {
			var ent = entities[i];
			if(ent.ammoRigidBody.mass > 0) {
				ent.ammoRigidBody.updateVisuals(ent);
			}
		}
	};
	AmmoSystem.prototype.deleted = function(ent) {
		if (ent.ammoComponent) {
			this.ammoWorld.removeRigidBody(ent.ammoRigidBody.body);
		}
	};
	
	var ammoSystem = new AmmoSystem();
	return ammoSystem;
  }
  AmmoUtil.destroyAmmoSystem = function(args, ctx, goo){
  	var ammoSystem = ctx.world.getSystem("AmmoSystem");
  	if(ammoSystem){
  		var i = ammoSystem._activeEntities.length;
  		while(i--){
  			if(ammoSystem._activeEntities[i].ammoRigidBody){
  				console.log("destroyAmmoSystem"+ammoSystem._activeEntities[i]+name);
  				ammoSystem._activeEntities[i].clearComponent("AmmoRigidBody");
	  			//ammoSystem.ammoWorld.removeRigidBody(ammoSystem._activeEntities[i].ammoRigidBody.body);
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
  
  AmmoUtil.createAmmoRigidBody = function(args, ctx, _goo){
  	goo = goo || _goo;
	function AmmoRigidBody(){
		args = args || {};
		console.log(args.mass);
  		this.type = 'AmmoRigidBody';
  		this.mass = args.mass || 0.0;
  		this.ammoCollider = args.ammoCollider || AmmoUtil.createAmmoBoxComponent(args, ctx, goo);
  		
  		var startTransform = new Ammo.btTransform();
		startTransform.setIdentity();
		var isDynamic = (this.mass !== 0);
		var gooPos = ctx.entity.transformComponent.transform.translation;
		var gooRot = ctx.entity.transformComponent.transform.rotation;
		var localInertia = new Ammo.btVector3(0, 0, 0);
		if(isDynamic){
			this.ammoCollider.shape.calculateLocalInertia(this.mass, localInertia);
		}
		startTransform.setOrigin(new Ammo.btVector3(gooPos.x, gooPos.y, gooPos.z));
		quat = quat || new goo.Quaternion();
		quat.fromRotationMatrix(gooRot);
		startTransform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
		var myMotionState = new Ammo.btDefaultMotionState(startTransform);
		var rbInfo = new Ammo.btRigidBodyConstructionInfo(this.mass, myMotionState, this.ammoCollider.shape, localInertia);
		this.body = new Ammo.btRigidBody(rbInfo);
  	}
  	AmmoRigidBody.prototype = Object.create(goo.Component.prototype);
  	AmmoRigidBody.constructor = AmmoRigidBody;
  
  	AmmoRigidBody.prototype.updateVisuals = function(ent){
  		var tc = ent.transformComponent;
  		var pos = tc.transform.translation;
  		var rot = tc.transform.rotation;
  		
  		ptrans = ptrans || new Ammo.btTransform();
	 	pquat = pquat || new Ammo.btQuaternion();
	 	pvec = pvec || new Ammo.btVector3();
	 	quat = quat || new goo.Quaternion();

  		this.body.getMotionState().getWorldTransform(ptrans);
  		//ptrans = this.body.getCenterOfMassTransform();
		pquat = ptrans.getRotation();
		//console.log(pquat.x()+","+pquat.y()+","+pquat.z()+","+pquat.w());
		quat.setd(pquat.x(), pquat.y(), pquat.z(), pquat.w());
		rot.copyQuaternion(quat);
		pvec = ptrans.getOrigin();
		//console.log(pvec.x()+","+pvec.y()+","+pvec.z());
		pos.setd(pvec.x(), pvec.y(), pvec.z());
		tc.setUpdated();
  	}
  	
  	var ammoRigidBody = new AmmoRigidBody;
  	return ammoRigidBody;
  	
  }
  AmmoUtil.createAmmoBoxComponent = function(args, ctx, goo){
  	function AmmoBoxComponent(){
  		args = args || {};
  		console.log(args.halfExtents);
  		args.halfExtents = args.halfExtents || [1,1,1];
  		this.type = 'AmmoCollider';
  		this.shape = new Ammo.btBoxShape(new Ammo.btVector3(args.halfExtents[0], args.halfExtents[1], args.halfExtents[2]));
  	}
  	AmmoBoxComponent.prototype = Object.create(goo.Component.prototype);
  	AmmoBoxComponent.constructor = AmmoBoxComponent;
  	
  	this.ammoCollider = new AmmoBoxComponent();
  	return this.ammoCollider;
  }
  AmmoUtil.createAmmoCapsuleComponent = function(args, ctx, goo){
  	
  }
  AmmoUtil.createAmmoSphereComponent = function(args, ctx, goo){
  	
  }
  AmmoUtil.createAmmoMeshComponent = function(args, ctx, goo){
  	
  }
  AmmoUtil.createAmmoPlaneComponent = function(args, ctx, goo){
  	
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
