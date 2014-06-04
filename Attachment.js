(function(window, document){
// args.bone(String), args.attachee(Entity), args.offsetPos(Vector3), args.offsetRot(Vector3), args.offsetScl(Vector3)

  function Attachment(){}
  
  Attachment.prototype.attach = function(args, ctx, goo){
    if(null === ctx.entity.meshDataComponent){console.error("ctx.entity requires a MeshDataComponent(Perhaps use a child entity?).");return;}
        if(null == ctx.entity.meshDataComponent.currentPose){console.error("ctx.entity requires a skeleton");return;}
        var meshData = ctx.entity.meshDataComponent,
        joints = meshData.currentPose._skeleton._joints,
        jointID = -1;
        var joint = null;
        
        for(var i = 0, ilen = joints.length; i < ilen; i++){
            if(joints[i]._name === bone){jointID = i;break;}
        }
        if(-1 == jointID){console.error("Could not find bone '"+bone+"' on ctx.entity.");return;}

        var a = ctx.world.createEntity(args.attachee.name+"_Attachment");
        a.oldScale = new goo.Vector3().copy(attachee.transformComponent.transform.scale);
        args.attachee.transformComponent.setScale(1,1,1);

        if(args.offsetScl){
            a.transformComponent.setScale(scl);
        }
        a.addToWorld();
        ctx.entity.transformComponent.attachChild(a.transformComponent);
        ctx.entity.transformComponent.setUpdated();

        a.transformComponent.attachChild(attachee.transformComponent);
        a.transformComponent.setUpdated();

        if(args.offsetPos){
            attachee.transformComponent.setTranslation(
                args.offsetPos.x*(1/ctx.entity.transformComponent.transform.scale.x),
                args.offsetPos.y*(1/ctx.entity.transformComponent.transform.scale.y),
                args.offsetPos.z*(1/ctx.entity.transformComponent.transform.scale.z));
        }
 
        if(args.offsetRot){
            attachee.transformComponent.transform.rotation.fromAngles(rot.x, rot.y, rot.z);
        }
        attachee.transformComponent.setUpdated();

        a.parentMeshData = meshData;
        a.parentJointID = jointID;
        a.scale = 1.0;
        a.calcVec = new Vector3();
        
        ctx.attachment = a;
  }
  Attachment.prototype.remove = function(){
  }
  Attachment.prototype.update = function(args, ctx, goo){
    var m = ctx.attachment.parentMeshData.currentPose._globalTransforms[ctx.attachment.parentJointID].matrix;
    var t = ctx.attachment.transformComponent.transform;
    m.getTranslation(t.translation);           
    t.rotation.set(
        m.e00, m.e10, m.e20,
        m.e01, m.e11, m.e21,
        m.e02, m.e12, m.e22
    );

    ctx.attachment.transformComponent.updateTransform();
    ctx.attachment.transformComponent.updateWorldTransform();
  }

  var global = global || window;
  global.AttachUtil = AttachUtil;
}(window, document, undefined));
