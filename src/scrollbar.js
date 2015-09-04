var Scrollbar = function (which, instance) {

  var isVertical = (which === 'v'),
      parentEl = instance.element,
      scrollEl = instance.scrollEl,
      settings = instance.settings,
      cache = instance.cache,
      scrollbarCache = cache[which] = {},

      sizeProp = isVertical ? 'H' : 'W',
      clientSize = 'client'+sizeProp,
      scrollSize = 'scroll'+sizeProp,
      scrollProp = isVertical ? 'scrollTop' : 'scrollLeft',
      evNames = isVertical ? ['top','bottom'] : ['left','right'],
      trackTransition = 'height 0.2s ease 0s, width 0.2s ease 0s, opacity 0.2s ease 0s',

      enabled = false,
      scrollbarEl = null,
      trackEl = null,
      animated = false;

  var events = {
    dragData: null,

    dragStart: function (ev) {
      var evData = ev.touches ? ev.touches[0] : ev;
      events.dragData = { x: evData.pageX, y: evData.pageY, scroll: scrollEl[scrollProp] };
    },

    dragMove: function (ev) {
      var evData = ev.touches ? ev.touches[0] : ev,
          delta, deltaRatio;
      
      if(!events.dragData) { return; }

      ev.preventDefault();
      delta = isVertical ? evData.pageY - events.dragData.y : evData.pageX - events.dragData.x;
      deltaRatio = delta / cache[clientSize];
      
      scrollEl[scrollProp] = events.dragData.scroll + deltaRatio * cache[scrollSize];
    },

    dragEnd: function () {
      events.dragData = null;
    }
  };
  
  return {


    toggle: function (bool) {
      enabled = bool;

      if(trackEl) {
        toggleClass(parentEl, which+'track-on', enabled);

        if(enabled) {
          trackEl.style[G.cssTransition] = trackTransition;
        }
      }

      // expose enabled
      scrollbarCache.enabled = enabled;
    },


    create: function () {
      scrollbarEl = document.createElement('div');
      trackEl = document.createElement('b');

      scrollbarEl.className = settings.classPrefix+'__'+which;
      trackEl.className = settings.classPrefix+'__'+which+'track';
      scrollbarEl.appendChild(trackEl);
      parentEl.appendChild(scrollbarEl);

      if(settings.draggableTracks) {
        this.bind(true);
      }
    },


    update: function () {
      var me = this,
          newSize, oldSize,
          newDim, newRelPos, deltaPos;

      // if scrollbar is disabled and no scroll
      if(!enabled && cache[clientSize] === cache[scrollSize]) {
        return;
      }

      newDim = this.calc();
      newSize = newDim.size;
      oldSize = scrollbarCache.size;
      newRelPos = (1 / newSize) * newDim.position * 100;
      deltaPos = Math.abs(newDim.position - (scrollbarCache.position || 0)) * cache[clientSize];

      if(newSize === 1 && enabled) {
        me.toggle(false);
      }

      if(newSize < 1 && !enabled) {
        me.toggle(true);
      }

      if(trackEl && enabled) {
        // animationTimeout(function () {
        me.style(newRelPos, deltaPos, newSize, oldSize);
        // });
      }

      // update cache values
      scrollbarCache = _extend(scrollbarCache, newDim);

      if(enabled) {
        me.fireEdgeEv();
      }
      
    },


    style: function (newRelPos, deltaPos, newSize, oldSize) {
      var me = this;

      if(newSize !== oldSize) {
        trackEl.style[ isVertical ? 'height':'width' ] = newSize * 100 + '%';
      }

      if(deltaPos) { // only if position has changed
        me.animateTrack( G.isTouch && deltaPos > 20 );
        trackEl.style[G.cssTransform] = 'translate(' + (isVertical ?  '0%,'+newRelPos+'%' : newRelPos+'%'+',0%') +')';
      }
    },


    animateTrack: function (animatePos) {
      if(animatePos || animated) {
        trackEl.style[G.cssTransition] = trackTransition + (animatePos ? ', '+ G.cssTransformDashed + ' 0.2s linear 0s' : '');
      }
      animated = animatePos;
    },


    bind: function (on) {
      var method = (on ? 'add' : 'remove') + 'EventListener',
          type = G.isTouch ? ['touchstart', 'touchmove', 'touchend'] : ['mousedown', 'mousemove', 'mouseup'];

      if (trackEl) { trackEl[method](type[0], events.dragStart); }
      document[method](type[1], events.dragMove);
      document[method](type[2], events.dragEnd);
      
    },


    calc: function () {
      var position = scrollEl[scrollProp],
          viewS = cache[clientSize], 
          scrollS = cache[scrollSize], 
          sizeRatio = viewS / scrollS,
          sizeDiff = scrollS - viewS,
          positionRatio, percent;

      if(sizeRatio >= 1 || !scrollS) { // no scrollbars needed
        return { position: 0, size: 1, percent: 0 };
      }

      percent = 100 * position / sizeDiff;

      // prevent overscroll effetcs (negative percent) 
      // and keep 1px tolerance near the edges
      if(position <= 1) { percent = 0; }
      if(position >= sizeDiff - 1) { percent = 100; }
      
      // Capped size based on min/max track percentage 
      sizeRatio = Math.max(sizeRatio, settings.minTrackSize / 100);
      sizeRatio = Math.min(sizeRatio, settings.maxTrackSize / 100);

      positionRatio = (1 - sizeRatio) * (percent / 100);

      return { position: positionRatio, size: sizeRatio, percent: percent };
    },


    fireEdgeEv: function () {
      var percent = scrollbarCache.percent;

      if(scrollbarCache.was !== percent && percent % 100 === 0) {
        instance.fireCustomEvent('scrollreachedge');
        instance.fireCustomEvent('scrollreach'+ evNames[percent/100] );
      }

      scrollbarCache.was = percent;
    },


    remove: function () {
      // remove parent custom classes
      this.toggle(false);
      // unbind drag events
      this.bind(false);
      // remove elements
      if(scrollbarEl && scrollbarEl.parentNode) {
        scrollbarEl.parentNode.removeChild(scrollbarEl);
      }
    }


  };

};