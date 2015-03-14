(function ($)
{
	$.fn.extend(
	{
		Tactel: function (_data, _properties)
		{
			var that = this;
			this.data = _data;

			//Default values
			var defaultValues = {
				pluginName: "Tactel",
				swipeThreshold: 100,	//not less
				swipeVelThreshold: 10,
				pinchScaleThreshold: 10,
				pinchRotationThreshold: 4,
				tapTime: 130,
				tapThreshold: 10,
				dragTime: 100,
				secondFingerTime: 50,
				
				//GESTURES
				tap: true,
				swipe: true,
				drag: true,
				pinchScale: true,
				pinchRotate: true
			};

			this.item = function (_id, _item)
			{
				this.id = _id;
				this.element = _item;
				this.startX = null;
				this.startY = null;
				this.startXW = null;
				this.startYH = null;
				this.startWidth = null;
				this.startHeight = null;
				this.deltaX0 = null;
				this.deltaY0 = null;
				this.rotation0 = null;

				that.items.push(this);
			};

			var touch = function (_time, _x, _y)
			{
				this.startX = _x != undefined ? _x : 0;
				this.startY = _y != undefined ? _y : 0;
				this.startTime = _time != undefined ? _time : 0;
				/*
				this.funcName = function(){
					alert("function inside class example")
				}
				*/
			};

			this.Awake = function ()
			{
				that.properties = $.extend(
				{}, defaultValues, _properties);
				that.items = [];
				that.touches = [];

				that.ResetValues();
				that.Start();
			};

			this.Start = function ()
			{
				that.Binding(document.getElementsByClassName("tactel"));

				if (that.data.class != "")
				{
					if (typeof that.data.class == "string") that.Binding(document.getElementsByClassName(that.data.class));
					else for (i = 0; i < that.data.class.length; ++i)
					that.Binding(document.getElementsByClassName(that.data.class[i]));
				}

				if (that.data.id != "")
				{
					if (typeof that.data.id == "string") that.Binding(document.getElementById(that.data.id));
					else for (i = 0; i < that.data.id.length; ++i)
					that.Binding(document.getElementById(that.data.id[i]));
				}
			};

			this.Binding = function (_elements)
			{
				if (_elements)
				{
					if (_elements.length == undefined)
					{
						_elements.length = 1;
						_elements[0] = _elements;
					}

					for (index = 0; index < _elements.length; ++index)
					{
						var item = new that.item(that.items.length, _elements[index]);
						console.log(that.items);
						item.element.addEventListener('touchstart', function (i, e)
						{
							that.touchStart(e, i, this);
						}.bind(item.element, item.id), false);

						item.element.addEventListener('touchend', function (i, e)
						{
							that.touchEnd(e, i, this);
						}.bind(item.element, item.id), false);

						item.element.addEventListener('touchmove', function (i, e)
						{
							that.touchMove(e, i, this);
						}.bind(item.element, item.id), false);
					}
				}
			};

			this.Restart = function ()
			{
				that.Awake();
			};

			this.Finish = function ()
			{

			};

			this.ResetValues = function ()
			{
				that.scale = false;
				that.rotate = false;
				that.drag = false;
				that.startMultiDist = null;
				that.endMultiDist = null;
				that.startAngle = null;
				that.touches = [];
				that.secondFingerOutTime = null;
			};

			this.touchStart = function (e, _arrayIndex, _item)
			{
				that.ResetValues();
				var mytouch = new touch(new Date().getTime(), e.changedTouches[0].pageX, e.changedTouches[0].pageY);
				that.touches.push(mytouch);

				that.items[_arrayIndex].startX = $(_item).offset().left;
				that.items[_arrayIndex].startY = $(_item).offset().top;
				that.items[_arrayIndex].startXW = $(_item).offset().left + $(_item).width();
				that.items[_arrayIndex].startYH = $(_item).offset().top + $(_item).height();
				that.items[_arrayIndex].startWidth = $(_item).width();
				that.items[_arrayIndex].startHeight = $(_item).height();

				var correction = 0;
				var angle = that.GetRotation(_item);

				that.items[_arrayIndex].rotation0 = angle;

				var media_diagonal = Math.sqrt(Math.pow($(that.items[_arrayIndex].element).width(), 2) + Math.pow($(that.items[_arrayIndex].element).height(), 2)) / 2;
				console.log("angle0 " + angle);
				if(angle != 0)
				{
					while(angle < 0)
						angle += 360;

					while(angle > 90)
						angle -= 90;

					if(angle < 45)
						angle = 45 - angle;
					else
						angle = angle - 45;

					console.log("angle " + angle);
					console.log("diagonal " + media_diagonal);
					console.log(" cos " + Math.cos(angle/ (180/Math.PI)));
						
					correction = Math.abs(Math.cos(angle/ (180/Math.PI))*media_diagonal);
					
					correction -= $(that.items[_arrayIndex].element).width()/2;
					correction *= -1;
					console.log("correction " + correction);
				}

				//Deltas
				if (e.touches.length == 1)
				{
					that.items[_arrayIndex].deltaX0 = e.touches[0].pageX - $(_item).offset().left + correction;
					that.items[_arrayIndex].deltaY0 = e.touches[0].pageY - $(_item).offset().top + correction;

					//console.log("X " + that.items[_arrayIndex].deltaX0);
					//console.log("Y " + that.items[_arrayIndex].deltaY0);
				}
				else // if(e.touches.length == 2)
				{
					var point = that.GetMiddlePoint(e.touches[e.touches.length - 1], e.touches[e.touches.length - 2]);

					that.items[_arrayIndex].deltaX0 = point[0] - $(_item).offset().left + correction;
					that.items[_arrayIndex].deltaY0 = point[1] - $(_item).offset().top + correction;
				}
				e.preventDefault();
				e.stopPropagation();
				//console.log("1");
				//console.log("2 " +  that.touches[0].startX);
			};

			this.touchEnd = function (e, _arrayIndex, _item)
			{
				//console.log("3");
				//console.log("4 " +  that.touches[0].startX);
				that.items[_arrayIndex].deltaX0 = null;
				that.items[_arrayIndex].deltaY0 = null;

				var endTime = new Date().getTime();

				//If second finger out...
				if (e.touches.length == 1)
				{
					that.secondFingerOutTime = endTime;
				}

				var endDistX = e.changedTouches[0].pageX - that.touches[0].startX;
				var endDistY = e.changedTouches[0].pageY - that.touches[0].startY;

				var endDist = Math.sqrt(Math.pow(endDistX, 2) + Math.pow(endDistY, 2));

				//SWIPE
				var velocity = endDist / (endTime - that.touches[0].startTime);

				if (that.secondFingerOutTime == null) that.secondFingerOutTime = 0;

				//if(that.properties.swipe && endDist > that.properties.swipeThreshold && endTime - that.touches[0].startTime < that.properties.dragTime)
				if (e.touches.length == 0 && new Date().getTime() - that.secondFingerOutTime > that.properties.secondFingerTime && that.properties.swipe && endDist > that.properties.swipeThreshold && velocity < that.properties.swipeVelThreshold && !that.drag)
				{
					//console.log("vec module " + endDist);
					that.Swipe(endDistX, endDistY, _item);
					e.preventDefault();
				}
				//TAP
				else if (e.touches.length == 0 && new Date().getTime() - that.secondFingerOutTime > that.properties.secondFingerTime && that.properties.tap && !that.drag && that.TouchesDistance(that.touches[0], e.changedTouches[0]) < that.properties.tapThreshold)
				{
					that.Tap(_item);
					e.preventDefault();
				}


				if (e.touches.length == 0) that.ResetValues();
				if (e.touches.length > 0) that.touchStart(e, _arrayIndex, _item);
			};

			this.touchMove = function (e, _arrayIndex, _item)
			{

				//SCALE
				if (that.properties.pinchScale && e.touches.length == 2 && e.touches[0].target == _item)
				{
					if (that.startMultiDist == null) that.startMultiDist = that.TouchesDistance(e.touches[0], e.touches[1]);
					that.endMultiDist = that.TouchesDistance(e.touches[0], e.touches[1]);
					//console.log("endmultidist " + that.endMultiDist);
					var difference = that.endMultiDist - that.startMultiDist;
					if (Math.abs(difference) > that.properties.pinchScaleThreshold)
					{
						//console.log("Pinch Scale " + difference);
						$(_item).width((that.items[_arrayIndex].startWidth + difference / 2));
						$(_item).height((that.items[_arrayIndex].startHeight + difference / 2));
					}


				}

				//ROTATE
				if (that.properties.pinchRotate && e.touches.length == 2 && e.touches[0].target == _item) //only rotation on the first element
				{
					if (that.startAngle == null) that.startAngle = that.GetAngle(e.touches[0], e.touches[1]);

					var current_angle = that.GetAngle(e.touches[0], e.touches[1]);

					if (Math.abs(current_angle - that.startAngle) > that.properties.pinchRotationThreshold) //look if the fingers are moving
					that.rotate = true;

					if (that.rotate)
					{
						//console.log("0__ " + that.startAngle);
						//console.log("1__ " + current_angle);
						//console.log("difference__ " + (current_angle - that.startAngle));
						var endAngle = that.items[_arrayIndex].rotation0 + current_angle - that.startAngle;
						var rotation = "rotate(" + endAngle + "deg)";
						$(_item).css("-webkit-transform", rotation);
						//console.log("final angle:            " + endAngle);
					}
					e.preventDefault();
				}

				//DRAG
				if (e.targetTouches.length > 0 && that.properties.drag && new Date().getTime() - that.touches[0].startTime > that.properties.dragTime)
				{
					//console.log("pageX " + e.touches[0].pageX);
					//console.log("pageY " + e.touches[0].pageY);
					//console.log("x " + $(_item).offset().left + " - " + ($(_item).offset().left + $(_item).width()));
					//console.log("y " + $(_item).offset().top + " - " + ($(_item).offset().top + $(_item).height()));
					that.drag = true;
					//console.log("time passed since second finger touch end: " + that.secondFingerOutTime);
					if (e.targetTouches.length == 1)
					{
						//console.log("x__ " + that.items[_arrayIndex].deltaX0);
						//console.log("y__ " + that.items[_arrayIndex].deltaY0);
						_item.style.left = e.targetTouches[0].pageX - that.items[_arrayIndex].deltaX0 + 'px';
						_item.style.top = e.targetTouches[0].pageY - that.items[_arrayIndex].deltaY0 + 'px';
					}
					else
					{
						var point = that.GetMiddlePoint(e.targetTouches[0], e.targetTouches[1]);
						_item.style.left = point[0] - that.items[_arrayIndex].deltaX0 + 'px';
						_item.style.top = point[1] - that.items[_arrayIndex].deltaY0 + 'px';

					}
				}
			};

			this.GetMiddlePoint = function (touch0, touch1)
			{
				var x0 = touch0.startX != undefined ? touch0.startX : touch0.pageX;
				var y0 = touch0.startY != undefined ? touch0.startY : touch0.pageY;
				var x1 = touch1.startX != undefined ? touch1.startX : touch1.pageX;
				var y1 = touch1.startY != undefined ? touch1.startY : touch1.pageY;

				var point = [];

				point[0] = (x0 + x1) / 2;
				point[1] = (y0 + y1) / 2;

				return point;
			};

			this.GetAngle = function (touch0, touch1)
			{
				var x0 = touch0.startX != undefined ? touch0.startX : touch0.pageX;
				var y0 = touch0.startY != undefined ? touch0.startY : touch0.pageY;
				var x1 = touch1.startX != undefined ? touch1.startX : touch1.pageX;
				var y1 = touch1.startY != undefined ? touch1.startY : touch1.pageY;

				var y;
				var x;

				y = y1 - y0;
				x = x1 - x0;

				var angle = Math.atan(y / x) * (180 / Math.PI);

				if (x < 0) angle += 180;
				else if (y < 360) angle += 360;

				/*
					 console.log("x0 " + x0);
					 console.log("y0 " + y0);
					 console.log("x1 " + x1);
					 console.log("y1 " + y1);
					 console.log("x " + x);
					 console.log("y " + y);
					 console.log("-----");
				*/

				while (angle > 360)
				angle -= 360;

				//console.log("angle: " + angle);
				//console.log("-----");
				return angle;
			};

			this.GetRotation = function (_item)
			{
				var st = window.getComputedStyle(_item, null);

				var tr = st.getPropertyValue("-webkit-transform") || st.getPropertyValue("-moz-transform") || st.getPropertyValue("-ms-transform") || st.getPropertyValue("-o-transform") || st.getPropertyValue("transform") || "FAIL";

				if (tr != "none")
				{
					//console.log(tr);
					var values = tr.split('(')[1],
						values = values.split(')')[0],
						values = values.split(',');

					var angle = Math.round(Math.atan2(values[1], values[0]) * (180 / Math.PI));

					return angle;
				}
				else return 0;
			};

			this.TouchesDistance = function (touch0, touch1)
			{
				var x0 = touch0.startX != undefined ? touch0.startX : touch0.pageX;
				var y0 = touch0.startY != undefined ? touch0.startY : touch0.pageY;
				var x1 = touch1.startX != undefined ? touch1.startX : touch1.pageX;
				var y1 = touch1.startY != undefined ? touch1.startY : touch1.pageY;
				return Math.sqrt(Math.pow((x0 - x1), 2) + Math.pow((y0 - y1), 2));
			};

			this.Tap = function (_item)
			{
				//console.log("tap");// alert pageX coordinate of touch point
				$(_item).html(parseInt($(_item).html()) + 1);
				$(_item).css("background-color", '#' + Math.floor(Math.random() * 16777215).toString(16));
				console.log("#TAP#");
				$(that).trigger("tactel-action", {
					"item": _item,
					"action": "tap"
				});
			};

			this.Swipe = function (_endDistX, _endDistY, _item)
			{
				if (Math.abs(_endDistY) > Math.abs(_endDistX))
				{
					if (_endDistY > 0)
					{
						console.log("Swipe DOWN");
						$(that).trigger("tactel-action", {
							"item": _item,
							"action": "swipe_down"
						});
					}
					else
					{
						console.log("Swipe UP");
						$(that).trigger("tactel-action", {
							"item": _item,
							"action": "swipe_up"
						});
					}
				}
				else
				{
					if (_endDistX > 0)
					{
						console.log("Swipe RIGHT");
						$(that).trigger("tactel-action", {
							"item": _item,
							"action": "swipe_right"
						});
					}
					else
					{
						console.log("Swipe LEFT");
						$(that).trigger("tactel-action", {
							"item": _item,
							"action": "swipe_left"
						});
					}
				}
			};

			this.Awake();
			return this;
		}
	});
})(jQuery);