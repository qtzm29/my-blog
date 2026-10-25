/* =========================================================================
   main.js —— 这个网站的四处交互
   1. 深浅色主题切换（并记住你的选择，下次打开还是同一种颜色）
   2. 文章卡片跟着鼠标轻微倾斜
   3. 点击项目作品图片，出现一圈水波纹
   4. 鼠标在背景上滑动，背景荡开水涟漪

   提示：这个 <script> 写在每个页面 </body> 的前面，
   浏览器从上往下读，读到这里时页面上所有标签都已经存在了，
   所以可以直接用 querySelector 找到它们。
   ========================================================================= */


/* ==================== 第 1 部分：深浅色主题切换 ==================== */

// document.documentElement 就是最外层的 <html> 标签。
// 我们给它加一个 theme-dark 的 class，CSS 里 1.5 那一节的深色变量就会生效。
var root = document.documentElement;

// 按钮上显示的文字，写成「点一下会变成什么」，这样用户一眼就知道下一步去哪。
function showToggleText(theme) {
  var btn = document.querySelector('.theme-toggle');
  if (!btn) return;                                   // 万一页面上没放这个按钮，就直接跳过
  btn.textContent = theme === 'dark' ? '浅色' : '深色';
  btn.setAttribute('aria-label', theme === 'dark' ? '切换到浅色模式' : '切换到深色模式');
}

// 只负责改 <html> 上的 class：加上 theme-dark 就是深色，去掉就是浅色。
function applyTheme(theme) {
  if (theme === 'dark') {
    root.classList.add('theme-dark');
  } else {
    root.classList.remove('theme-dark');               // 去掉 class = 回到浅色
  }
}

// 真正执行切换：改 class + 把选择记到 localStorage 里。
function setTheme(theme) {
  applyTheme(theme);
  // localStorage 是浏览器自带的「小仓库」，能存一点文字。
  // 存下来之后，下次打开网站它还记得你选的是深色还是浅色。
  localStorage.setItem('theme', theme);
  showToggleText(theme);
}

// 判断「现在」应该是什么颜色：
// 先看仓库里有没有存过；没存过就跟随电脑系统的设置（跟随系统是很多网站的做法）。
var savedTheme = localStorage.getItem('theme');
var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
var currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

// 页面刚打开时，先按算出来的主题把 class 设置好，再把按钮文字改成匹配的样子。
// （<head> 里那段小脚本已经抢在页面显示之前做过一次，这一步是「再确认一遍」：
//   万一有浏览器插件之类的外部代码中途把它改掉，这里能纠正回来。）
applyTheme(currentTheme);
showToggleText(currentTheme);

// 给按钮绑定「点击」事件：点一下就在深浅之间来回切。
var toggleBtn = document.querySelector('.theme-toggle');
if (toggleBtn) {
  toggleBtn.addEventListener('click', function () {
    // 用 <html> 上的实际 class 来判断，比另外记一个变量更不容易出错。
    var isDarkNow = root.classList.contains('theme-dark');
    setTheme(isDarkNow ? 'light' : 'dark');
  });
}


/* ==================== 第 2 部分：文章卡片跟着鼠标倾斜 ==================== */

// 只有「有真鼠标」的设备才开这个效果；手机和平板上手指划过不需要它。
if (window.matchMedia('(hover: hover)').matches) {

  var cards = document.querySelectorAll('.post-item');

  cards.forEach(function (card) {

    // mousemove：鼠标在卡片上每移动一点点，都会触发一次。
    card.addEventListener('mousemove', function (event) {

      // getBoundingClientRect() 能拿到卡片当前的位置和尺寸（相对于浏览器窗口）。
      var box = card.getBoundingClientRect();

      // 算出鼠标在卡片里的相对位置，再换算成 -0.5 ~ 0.5 的范围：
      // 卡片正中间是 0，靠左边是负数，靠右边是正数。
      var x = (event.clientX - box.left) / box.width - 0.5;
      var y = (event.clientY - box.top) / box.height - 0.5;

      // 再乘一个角度倍数，就是最终要转几度：鼠标越靠边，卡片歪得越明显。
      var rotateY = x * 16;    // 左右方向 → 绕竖轴转
      var rotateX = -y * 12;   // 上下方向 → 绕横轴转（加负号方向才自然）

      // 直接改 transform 让卡片立起来。
      // 注意必须自己带上 translateY(-2px)：JS 写的内联样式优先级最高，
      // 会把 CSS 里 .post-item:hover 的上浮效果盖掉，所以要手动补回来。
      card.style.transform =
        'translateY(-2px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg)';
    });

    // mouseleave：鼠标离开卡片时把 transform 清空，卡片就弹回原样。
    // 之所以是「平滑」弹回而不是「啪」一下，是因为 CSS 里 .post-item 写了 transition。
    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
    });
  });
}


/* ==================== 第 3 部分：点击项目图片出现水波纹 ==================== */

// 只有项目页（works.html）才有 .project-thumb img 这种结构，
// 其它页面这里选不到东西，querySelectorAll 会返回一个空列表，
// 下面的 forEach 自然一次都不执行，不会有任何报错。
var projectImages = document.querySelectorAll('.project-thumb img');

projectImages.forEach(function (img) {

  img.addEventListener('click', function (event) {

    // img.parentElement 就是外面那层 .project-thumb 盒子。
    // 波纹要放进这个盒子里，才会被它的 overflow: hidden 裁在图片范围内。
    var thumb = img.parentElement;

    // 拿盒子的位置和尺寸（相对于浏览器窗口）
    var box = thumb.getBoundingClientRect();

    // 算出「鼠标点下去」的位置，在盒子里的坐标（左上角是 0,0）
    var x = event.clientX - box.left;
    var y = event.clientY - box.top;

    // 波纹是一个圆，半径要多大才能从点击点盖满整张图？
    // 答案是「到四个角里最远的那个角」的距离。Math.hypot(横差, 纵差)
    // 就是勾股定理求斜边，算出来的距离。四个角都算一遍，取最大值最保险。
    var radius = Math.max(
      Math.hypot(x, y),
      Math.hypot(box.width - x, y),
      Math.hypot(x, box.height - y),
      Math.hypot(box.width - x, box.height - y)
    );

    // 新建一个空的 <span>，给它挂上 CSS 里的 .ripple —— 动画就靠这个 class 触发。
    var ripple = document.createElement('span');
    ripple.className = 'ripple';

    // 把波纹摆到点击的那个点上：
    // left/top 是圆的左上角，所以再用负的 margin 把它往左上挪半个身位，
    // 这样圆心才正好落在点击位置。
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.width = radius * 2 + 'px';    // 直径 = 半径 × 2
    ripple.style.height = radius * 2 + 'px';
    ripple.style.marginLeft = -radius + 'px';
    ripple.style.marginTop = -radius + 'px';

    // 动画播完（animationend）就把这个 span 删掉。
    // 不删的话，连点几下就会在页面里堆一堆看不见的空元素，越积越多。
    ripple.addEventListener('animationend', function () {
      ripple.remove();
    });

    thumb.appendChild(ripple);       // 把波纹塞进盒子里，它就开始播放动画了
  });
});


/* ==================== 第 4 部分：鼠标滑过背景荡开水涟漪 ==================== */

// 和卡片倾斜一样，只给「有真鼠标」的设备开这个效果；
// 手机、平板用手指滑动时不需要它。
if (window.matchMedia('(hover: hover)').matches) {

  // mousemove 是个「话很多」的事件：鼠标轻轻一动，它一秒钟能喊几十次。
  // 如果每次都造一个涟漪，页面上会瞬间堆出成百上千个圆圈，直接卡住。
  // 所以要「节流」：记下上一次造涟漪的时间，离现在太近就跳过这一次。
  // 160 毫秒是个好用的经验值 —— 手滑起来已经连续得像水波，
  // 又不会造出太多元素。
  var lastRippleAt = 0;
  var RIPPLE_GAP = 160;

  document.addEventListener('mousemove', function (event) {

    var now = Date.now();
    if (now - lastRippleAt < RIPPLE_GAP) return;   // 距离上次太近，这次先不造
    lastRippleAt = now;

    // 造一个空 <span>，挂上 CSS 里的 .bg-ripple，动画就会自动开始播。
    // 注意是 .bg-ripple，不是项目页图片用的 .ripple，两者互不干扰。
    var ripple = document.createElement('span');
    ripple.className = 'bg-ripple';

    // clientX / clientY 是鼠标相对于「浏览器可视区域」的坐标，
    // 而 .bg-ripple 是 position: fixed（同样以可视区域为基准），
    // 两者基准一致，所以直接把坐标填进 left / top 就放对了位置。
    // （尺寸和位移都由 CSS 负责，这里只告诉它「放在哪」。）
    ripple.style.left = event.clientX + 'px';
    ripple.style.top = event.clientY + 'px';

    // 动画播完（animationend）就把元素删掉，避免越积越多。
    ripple.addEventListener('animationend', function () {
      ripple.remove();
    });

    document.body.appendChild(ripple);
  });
}
