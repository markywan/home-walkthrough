# 验证记录 · 2026-09-13

- 实际浏览器执行完整自动漫游：6个区域全部访问，约123秒；最终回到客厅并结束，1229次位置采样未进入墙体/家具碰撞范围。
- 人体行走碰撞直径约440毫米；11段导览路径均能规划，房间目标点均可站立。第三人称镜头避开墙与高柜，低于镜头的茶几/沙发不当作摄像机墙体。
- 人物实际蒙皮包围盒测量：身高1.649999997米，脚底约0米；第三人称相机 y=1.65，模型可见；第一人称 y=1.65。
- 1440×1000、390×844、320×740和844×390横屏视口检查；页面无横向溢出，主要触控按钮至少44像素。
- 拖动转头、开始/暂停漫游、房间导航、平面图、尺寸与收纳面板均验证；未出现页面脚本错误或资源加载错误。
- 本地所有模块相对引用存在，核心模块语法检查通过；部署资产约5.57MB，均随站点自带。
- 浏览器实际硬件渲染为 Apple M4 / ANGLE Metal；手机采用响应式浏览器视口验证，尚未在父母的具体手机上实测帧率。

以上是程序、视觉及交互验证，不代表户型已量房或施工尺寸已通过。卫生间前方余量与右侧尺寸链的待核问题见 README 和网页“尺寸·收纳”。

## GitHub migration and faster tour

- The tour now moves at 0.74 m/s; each stop lasts half as long.
- Full browser run: 61.736 seconds, all 6 areas visited, 0 invalid collision samples, no page errors.
- Published assets are self-contained and use relative paths for GitHub Pages subdirectories.
