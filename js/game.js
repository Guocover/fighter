// 画布
var canvas = document.getElementById('game');
var context = canvas.getContext("2d");
// 设置画布
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// 更新画布相关信息
var canvasWidth = canvas.clientWidth;
var canvasHeight = canvas.clientHeight;

// 判断是否有 requestAnimationFrame 方法，如果有则模拟实现
window.requestAnimFrame =
window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationFrame ||
window.oRequestAnimationFrame ||
window.msRequestAnimationFrame ||
function(callback) {
    window.setTimeout(callback, 1000 / 30);
};

/**
 * 游戏主要实现逻辑
 */
var GAME = {
  /**
   * 游戏初始化
   */
  init: function(opts) {
    var opts = Object.assign({}, opts, CONFIG);
    var self = this;
    // 飞机对象极限横坐标
    this.planePosX = canvasWidth / 2 - opts.planeSize.width / 2;
    this.planePosY = canvasHeight - opts.planeSize.height - 50;
    opts.planeType = opts.planeType || 'bluePlaneIcon';
    // 加载图片资源，加载完成才能交互
    resourceHelper.load(opts.resources, function(resources) {
      // 更新图片和音乐
      self.images = resources['images'];
      self.sounds = resources['sounds'];
      self.planeIcon = self.images[opts.planeType];
      self.opts = opts;
      self.opts.onInit && self.opts.onInit();
    });
    // 设置opts
    this.opts = opts;
  },
  /**
   * 设置游戏相关配置
   */
  setGameOptions: function(opts) {
    // 根据配置数据设置飞机型号
    if (opts.planeType) {
      this.planeIcon = this.images[opts.planeType];
    }
  },
  /**
   * 更新游戏状态，分别有以下几种状态：
   * start  游戏前
   * playing 游戏中
   * failed 游戏失败
   * success 游戏成功
   * stop 游戏暂停
   */
  setStatus: function(status) {
    this.status = status;
  },
  /**
   * start 游戏开始需要设置
   * - 创建飞机
   * - 设置初始参数
   */
  start: function (params) {
    // 获取游戏初始化 level
    var self = this;
    var opts = this.opts;
    var images = this.images;
    // 清空射击目标对象数组
    this.enemies = []; 
    this.score = 0;

    // 创建主角英雄
    this.plane = new Plane({
      x: this.planePosX,
      y: this.planePosY,
      icon: this.planeIcon,
      width: opts.planeSize.width,
      height: opts.planeSize.height,
      bulletSize: opts.bulletSize, // 默认子弹长度
      bulletSpeed: opts.bulletSpeed, // 默认子弹的移动速度
      bulletIcon: images.fireIcon,
      boomIcon: images.enemyBigBoomIcon
    });
    // 播放背景音乐
    resourceHelper.playSound('gameSound', {loop: true});

    // 飞机开始射击
    this.plane.startShoot();
    resourceHelper.playSound('shootSound');

    this.bindTouchAction();

    // 随机生成大小敌机
    this.createSmallEnemyInterval = setInterval(function () {
      self.createEnemy('normal');
    }, 500);
    this.createBigEnemyInterval = setInterval(function () {
      self.createEnemy('big');
    }, 1500);
    
    this.setStatus('playing');
    // 开始动画循环
    this.update();
  },
  /**
   * 生成怪兽
   */
  createEnemy: function(type) {
    var enemies = this.enemies;
    var opts = this.opts;
    var images = this.images;
    var enemySize = opts.enemySmallSize;
    var enemySpeed = opts.enemySpeed;
    var enemyIcon = images.enemySmallIcon;
    var enemyBoomIcon = images.enemySmallBoomIcon;
    var live = 1;
    // 大型敌机参数
    if (type === 'big') {
      enemySize = opts.enemyBigSize;
      enemyIcon = images.enemyBigIcon;
      enemyBoomIcon = images.enemyBigBoomIcon;
      enemySpeed = opts.enemySpeed * 0.6;
      live = 10;
    } 
    // 每个元素的
    var initOpt = {
      x: Math.floor(Math.random() * (canvasWidth - enemySize.width)), 
      y: -enemySize.height,
      type: type,
      live: live,
      width: enemySize.width,
      height: enemySize.height,
      speed: enemySpeed,
      icon: enemyIcon,
      boomIcon: enemyBoomIcon
    }
    if (enemies.length < 5) {
      enemies.push(new Enemy(initOpt));
    }
  },
  update: function (params) {
    var self = this;
    var opts = this.opts;

    // 先清理画布
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 更新飞机、敌人
    this.updateElement();
    // 绘制画布
    this.draw();

    // 如果飞机死了游戏就结束
    if (this.plane.status === 'boomed') {
      // 游戏结束
      this.setStatus('end');
      this.end();
      return;
    }

    this.opts.onUpdate && this.opts.onUpdate();

    // 不断循环 update
    requestAnimFrame(function() {
      self.update()
    });
  },
  end: function() {
    // 先清理画布
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    // 清除声音
    resourceHelper.pauseSound('gameSound');
    resourceHelper.pauseSound('shootSound');
    // 清除定时器
    clearInterval(this.createBigEnemyInterval);
    clearInterval(this.createSmallEnemyInterval);
    this.opts.onEnd && this.opts.onEnd();
  },
  /**
   * 提供给外面的绑定事件用的
   */
  bindTouchAction: function () {
    var opts = this.opts;
    var planeMinX = 0;
    var planeMinY = 0;
    var planeMaxX = canvasWidth - opts.planeSize.width;
    var planeMaxY = canvasHeight - opts.planeSize.height;
    var self = this;
    
    canvas.addEventListener('touchstart', function (e) {
      var plane = self.plane;
      var oldTouchX = e.touches[0].clientX;
      var oldTouchY = e.touches[0].clientY;
      var oldPlaneX = plane.x;
      var oldPlaneY = plane.y;

      e.preventDefault();
      canvas.addEventListener('touchmove', function (e) {
        var newTouchX = e.touches[0].clientX;
        var newTouchY = e.touches[0].clientY;
        var newPlaneX = oldPlaneX + newTouchX - oldTouchX;
        var newPlaneY = oldPlaneY + newTouchY - oldTouchY;
        // 判断极限
        if(newPlaneX < planeMinX){
          newPlaneX = planeMinX;
        }
        if(newPlaneX > planeMaxX){
          newPlaneX = planeMaxX;
        }
        if(newPlaneY < planeMinY){
          newPlaneY = planeMinY;
        }
        if(newPlaneY > planeMaxY){
          newPlaneY = planeMaxY;
        }
        
        e.preventDefault();
        // 更新飞机的位置
        plane.setPosition(newPlaneX, newPlaneY);
      }, false);
    }, false);
  },
  updateElement: function() {
    var opts = this.opts;
    var enemySize = opts.enemySize;
    var enemies = this.enemies;
    var plane = this.plane;
    var i = enemies.length;

    if (plane.status === 'booming') {
      plane.booming();
    }

    // 循环更新怪兽
    while (i--) {
      var enemy = enemies[i];
      enemy.down();
      if (enemy.y >= canvasHeight) {
        this.enemies.splice(i, 1);
      } else {
        if (plane.status === 'normal' && plane.hasCrash(enemy)) {
          plane.booming();
          resourceHelper.playSound('dieSound');
        }
        // 根据怪兽状态判断是否被击中
        switch(enemy.status) {
          case 'normal':
            // 判断是否击中未爆炸的敌人
            if (plane.hasHit(enemy)) {
              // 设置爆炸时长展示第一帧）
              resourceHelper.playSound('boomSound');
              enemy.live --;
              // console.log(enemy);
              if (enemy.live === 0) {
                enemy.booming();
              }
            }
            break;
          case 'booming':
            enemy.booming();
            break;
          case 'boomed':
            var point = enemy.type === 'big' ? 1000 : 100;
            this.enemies.splice(i, 1);
            this.score += point;
        }
      }
      
    }
  },
  draw: function() {
    this.plane.draw();
    // 更新敌人
    this.enemies.forEach(function(enemy) {
      enemy.draw();
    });
  }
};


