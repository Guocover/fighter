/**
 * 资源管理器
 */
var resourceHelper = {
  enableMusic: true,
  /**
   * 加载图片
   */
  imageLoader: function(src, callback) {
    var image = new Image();
    // 图片加载完成
    image.addEventListener('load', callback);
    image.addEventListener('error', function() {
      alert('iamgerror');
    });
    image.src = src;
    return image;
  },
  /**
   * 加载声音
   */
  soundLoader: function(src, callback) {
    var sound = new Audio();
    // // 图片加载完成
    sound.addEventListener('canplaythrough', function() {
      // callback();
    });
    sound.src = src;
    callback();
    return sound;
  },
  preplayAllSound: function() {
    var self = this;
    var sounds = this.resources.sounds;
    
    for(var key in sounds) {
      this.playSound(key, {disabled: true});
      setTimeout(function() {
        self.pauseSound(key);
        sounds[key].volume = 1;
      }, 50);
    }
  },
  setMusic: function(enable) {
    this.enableMusic = enable;
  },
  /**
   * 资源加载
   * @param  {Array} resources 资源列表
   */
  load: function(resources, callback) {
    var images = resources.images;
    var sounds = resources.sounds;
    var total = images.length + sounds.length;
    var finish = 0; // 已完成的个数
    // 保存加载后的图片对象和声音对象
    this.resources = {
      images: {},
      sounds: {}
    };
    var self = this;

    // 遍历加载图片
    for(var i = 0 ; i < images.length; i++) {
      var name = images[i].name;
      var src = images[i].src;
      self.resources.images[name] = self.imageLoader(src, function() {
        // 加载完成
        finish++;
        if( finish == total){
          //全部加载完成
          callback(self.resources);
        }
      });
    }

    // 遍历加载声音
    for(var i = 0 ; i < sounds.length; i++) {
      var name = sounds[i].name;
      var src = sounds[i].src;
      self.resources.sounds[name] = self.soundLoader(src, function() {
        // 加载完成
        finish++;
        if( finish == total){
          //全部加载完成
          callback(self.resources);
        }
      });
    }
  },
  //播放音乐/音效
  playSound: function(sound, config) { 
    var soundObj = this.resources.sounds[sound];
    if (!soundObj || !this.enableMusic){
      return;
    }
    config = config || {};
    // 是否设置循环
    if(config.loop){
      soundObj.loop = 'loop';
    } 
    // 是否设置音量
    if(config.disabled){
      soundObj.volume = 0;
    } else {
      soundObj.volume = 1;
    }

    soundObj.currentTime = 0;  
    soundObj.play();
    return soundObj;
  },
  //暂停音乐
  pauseSound: function(sound) { 
    var soundObj = this.resources.sounds[sound];
    if (!soundObj || !this.enableMusic){
      return;
    }
    soundObj.pause();
    return soundObj;
  }
  
}

