(function(window, document, undefined){
	var KeyInput = {};
	KeyInput.setup = function(args, ctx, goo){
		ctx.keys = {};
		ctx.stringToCode = {"backspace":8,"tab":9,"enter":13,"shift":16,"ctrl":17,"alt":18,"pause":19,"caps":20,"esc":27,"escape":27,"space":32,"page up":33,"page down":34,"end":35,"home":36,"left":37,"up":38,"right":39,"down":40,"insert":45,"delete":46,"0":48,"1":49,"2":50,"3":51,"4":52,"5":53,"6":54,"7":55,"8":56,"9":57,"a":65,"b":66,"c":67,"d":68,"e":69,"f":70,"g":71,"h":72,"i":73,"j":74,"k":75,"l":76,"m":77,"n":78,"o":79,"p":80,"q":81,"r":82,"s":83,"t":84,"u":85,"v":86,"w":87,"x":88,"y":89,"z":90,"windows":91,"right click":93,"num0":96,"num1":97,"num2":98,"num3":99,"num4":100,"num5":101,"num6":102,"num7":103,"num8":104,"num9":105,"num*":106,"num+":107,"num-":109,"num.":110,"num/":111,"f1":112,"f2":113,"f3":114,"f4":115,"f5":116,"f6":117,"f7":118,"f8":119,"f9":120,"f10":121,"f11":122,"f12":123,"num lock":144,"scroll lock":145,"my computer":182,"my calculator":183,";":186,"=":187,",":188,"-":189,".":190,"/":191,"`":192,"[":219,"\\":220,"]":221,"'":222};
		ctx.eventList = {};
		KeyInput.getKey = function(keyCode){
			var key = typeof keyCode === 'number' ? keyCode : ctx.stringToCode[""+keyCode];
			return ctx.keys[key];
		};
		KeyInput.setKey = function(keyCode, bool){
			var key = typeof keyCode === 'number' ? keyCode : ctx.stringToCode[""+keyCode];
			if(undefined === ctx.keys[key]){return KeyInput;}
			if(bool !== true && bool !== false){
				console.warn("KeyInput.setKey: You must pass in a boolean value as the second parameter.");
				return;
			}
			if(bool === ctx.keys[key]){return;}
			ctx.keys[key] = bool;
			if(ctx.eventList["Key"+keyCode]){
				var node = ctx.eventList["Key"+keyCode].first;
				while(node !== null){
					node.callback(bool);
					node = node.next;
				}
			}
			return KeyInput;
		};
		KeyInput.bind = function(keyCode, callback){
			var key = typeof keyCode === 'number' ? keyCode : ctx.stringToCode[""+keyCode];
			ctx.keys[key] = false;
			if(callback){
				if(typeof callback === 'function'){
					if(!ctx.eventList["Key"+key]){
						ctx.eventList["Key"+key] = {first:null, last:null};
					}
					var node = {previous:null, next:null, callback:callback};
					if(null === ctx.eventList["Key"+key].first){
						ctx.eventList["Key"+key].first = node;
						ctx.eventList["Key"+key].last = node;
					}
					else{
						node.next = ctx.eventList["Key"+key].first;
						ctx.eventList["Key"+key].first.previous = node;
						ctx.eventList["Key"+key].first = node;
					}
				}
			}
			return KeyInput;
		};
		KeyInput.unbind = function(keyCode, callback){
			if(undefined === callback){
				console.warn("KeyInput.unbind: You should pass in the callback to remove, did you mean 'KeyInput.unbindAll?");
				KeyInput.unbindAll(keyCode);
				return KeyInput;
			}
			var key = typeof keyCode === 'number' ? keyCode : ctx.stringToCode[""+keyCode];
			var node = ctx.eventList["Key"+key].first;
				while(node != null){
					if(node.callback === callback){
						break;
					}
					node = node.next;
				}
				if(node !== null){
					if(ctx.eventList["Key"+key].first === node){
						ctx.eventList["Key"+key].first = ctx.eventList["Key"+key].first.next;
					}
					if(ctx.eventList["Key"+key].last === node){
						ctx.eventList["Key"+key].last = ctx.eventList["Key"+key].last.previous;
					}
					if(node.previous !== null){
						node.previous.next = node.next;
					}
					if(node.next !== null ){
						node.next.previous = node.previous;
					}
				}
				if(null === ctx.eventList["Key"+key].first){
					delete ctx.eventList["Key"+key];
				}
			return KeyInput;
		};
		KeyInput.unbindAll = function(keyCode){
			var key = typeof keyCode === 'number' ? keyCode : ctx.stringToCode[""+keyCode];
			if(ctx.eventList["Key"+key]){
				while(null !== ctx.eventList["Key"+key].first){
					var node = ctx.eventList["Key"+key].first;
					ctx.eventList["Key"+key].first = node.next;
					node.previous = null;
					node.next = null;
				}
				ctx.eventList["Key"+key].last = null;
				delete ctx.eventList["Key"+key];
			}
			return KeyInput;
		};
		ctx.keyDown = function(e){
			e = e || window.event;
			var keyCode = (typeof e.which === "undefined") ? e.keyCode : e.which;
			if(true === ctx.keys[keyCode]){return;}
			ctx.keys[keyCode] = true;
			if(ctx.eventList["Key"+keyCode]){
				var node = ctx.eventList["Key"+keyCode].first;
				while(node !== null){
					node.callback(true);
					node = node.next;
				}
			}
		}
		ctx.keyUp = function(e){
			e = e || window.event;
			var keyCode = (typeof e.which === "undefined") ? e.keyCode : e.which;
			if(false === ctx.keys[keyCode]){return;}
			ctx.keys[keyCode] = false;
			if(ctx.eventList["Key"+keyCode]){
				var node = ctx.eventList["Key"+keyCode].first;
				while(node !== null){
					node.callback(false);
					node = node.next;
				}
			}
		}
		KeyInput.cleanup = function(){
			for(var i in ctx.keys){
				KeyInput.unbindAll(Number(i));
			}
			document.documentElement.removeEventListener("keyup", ctx.keyUp, false);
			document.documentElement.removeEventListener("keydown", ctx.keyDown, false);
			delete KeyInput.setKey;
			delete KeyInput.getKey;
			delete KeyInput.bind;
			delete KeyInput.unbind;
			delete KeyInput.unbindAll;
			delete KeyInput.cleanup;
		};
		document.documentElement.addEventListener("keyup", ctx.keyUp, false);
		document.documentElement.addEventListener("keydown", ctx.keyDown, false);
	}
	var global = global || window;
	global.KeyInput = KeyInput;
}(window, document));
