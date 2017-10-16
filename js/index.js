var $index = $('.ui-index');
var $rule = $('.ui-rule');
var $setting = $('.ui-setting');
var $result = $('.ui-result');
var $score = $('.score');
var $body = $(document.body);
/**
 * 事件绑定
 * 
 */
function bindEvent() {
  // 点击开始按钮
  $('.btns-group').on('click', '.btn', function() {
    resourceHelper.playSound('buttonSound');
  });
  // 点击开始按钮
  $body.on('click', '.js-start', function() {
    $index.hide();
    GAME.start();
  });
  // 点击说明按钮
  $body.on('click', '.js-rule', function() {
    $rule.show();
    $index.hide();
  });
  // 点击设置按钮
  $body.on('click', '.js-setting', function() {
    $setting.show();
    $index.hide();
  });
  // 点击确认按钮
  $body.on('click', '.confirm-btn', function() {
    $(this).parent('.ui-panel').hide();
    $result.hide();
    $index.show();
  });
  // 点击确认按钮
  $body.on('click', '.js-setting-confirm', function() {
    var url = 'url(./img/bg_' + $('#setting-bg').val() + '.jpg)';
    // 设置背景
    $body.css('background-image', url);
    // 设置飞机
    GAME.setGameOptions({
      planeType: $('#setting-plane').val(),
    });
    // 设置音乐
    var enable = $('#setting-music').val() === '1';
    resourceHelper.setMusic(enable);
  });
}

/**
 * 游戏主逻辑入口函数
 */
function init() {
  // 开始游戏
  GAME.init({
    onInit: function() {
      resourceHelper.preplayAllSound();
      bindEvent();
    },
    onEnd: function() {
      $index.hide();
      $result.show();
    },
    onUpdate: function() {
      $score.text('分数: ' + GAME.score);
    }
  });
}

init();