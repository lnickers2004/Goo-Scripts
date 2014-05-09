var KeyInput = (function(){
	var keys = {};
	var stringToCode = {"backspace":8,"tab":9,"enter":13,"shift":16,"ctrl":17,"alt":18,"pause":19,"caps":20,"esc":27,"space":32,"page up":33,"page down":34,"end":35,"home":36,"left":37,"up":38,"right":39,"down":40,"insert":45,"delete":46,"0":48,"1":49,"2":50,"3":51,"4":52,"5":53,"6":54,"7":55,"8":56,"9":57,"a":65,"b":66,"c":67,"d":68,"e":69,"f":70,"g":71,"h":72,"i":73,"j":74,"k":75,"l":76,"m":77,"n":78,"o":79,"p":80,"q":81,"r":82,"s":83,"t":84,"u":85,"v":86,"w":87,"x":88,"y":89,"z":90,"windows":91,"right click":93,"num0":96,"num1":97,"num2":98,"num3":99,"num4":100,"num5":101,"num6":102,"num7":103,"num8":104,"num9":105,"num*":106,"num+":107,"num-":109,"num.":110,"num/":111,"f1":112,"f2":113,"f3":114,"f4":115,"f5":116,"f6":117,"f7":118,"f8":119,"f9":120,"f10":121,"f11":122,"f12":123,"num lock":144,"scroll lock":145,"my computer":182,"my calculator":183,";":186,"=":187,",":188,"-":189,".":190,"/":191,"`":192,"[":219,"\\":220,"]":221,"'":222};
	var _this = this;
	var _args = null;
	var _ctx = null;
	var _goo = null;

	function keyDown(e){
		e = e || window.event;
		var keyCode = (typeof e.which === "undefined") ? e.keyCode : e.which;
		if(undefined === keys[keyCode]){return;}
		if(true === keys[keyCode]){return;}
		keys[keyCode] = true;
		_goo.SystemBus.emit("Key"+keyCode, true);
	}
	function keyUp(e){
		e = e || window.event;
		var keyCode = (typeof e.which === "undefined") ? e.keyCode : e.which;
		if(undefined === keys[keyCode]){return;}
		if(false === keys[keyCode]){return;}
		keys[keyCode] = false;
		_goo.SystemBus.emit("Key"+keyCode, false);
	}

	return{
		getKey:function(keyCode){
			var key = typeof keyCode === 'number' ? keyCode : stringToCode[""+keyCode];
			return keys[key];
		},
		bind:function(keyCode, callback){
			var key = typeof keyCode === 'number' ? keyCode : stringToCode[""+keyCode];
			keys[key] = false;
			if(callback){
				if(typeof callback === 'function'){
					_goo.SystemBus.addListener("Key"+key, callback);
				}
			}
			return _this;
		},
		unbind:function(keyCode, callback){
			if(undefined === callback){
				console.warn("KeyInput.unbind: You should pass in the callback to remove, did you mean 'KeyInput.unbindAll?");
				_this.unbindAll(keyCode);
				return _this;
			}
			var key = typeof keyCode === 'number' ? keyCode : stringToCode[""+keyCode];
			_goo.SystemBus.removeListener("Key"+key, callback);
			var chan = goo.SystemBus._getNode("Key"+key);
			if(chan.listeners.length === 0){
				delete keys[key];
			}
			return _this;
		},
		unbindAll:function(keyCode){
			var key = typeof keyCode === 'number' ? keyCode : ctx.stringToCode[""+keyCode];
			_goo.SystemBus.removeAllOnChannel("Key"+key, callback);
			delete keys[key];
			return _this;
		},
		setup:function(args, ctx, goo){
			_args = args;
			_ctx = ctx;
			_goo = goo;
			ctx.domElement.addEventListener("keyup", keyUp, false);
			ctx.domElement.addEventListener("keydown", keyDown, false);
		},
		cleanup:function(){
			for(var i in keys){
				_goo.SystemBus.removeAllOnChannel("Key"+i);
			}
			_ctx.domElement.removeEventListener("keyup", keyUp, false);
			_ctx.domElement.removeEventListener("keydown", keyDown, false);
			_args = null;
			_ctx = null;
			_goo = null;
		}
	}
})();
