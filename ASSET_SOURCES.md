# 资源与尺寸参考

- 户型图：用户提供并确认的方案 A 第四版；仅作本家装任务使用。
- 室内几何、家具、织物/木纹/草地纹理：本项目按尺寸程序建模。绿树背景由图像生成工具为本项目生成，为风格环境示意，不是真实窗外照片。
- 3D 引擎及附加组件：[Three.js r180](https://github.com/mrdoob/three.js/tree/r180)，MIT 许可。
- 当前人物：由 [MB-Lab 的亚洲男性 m_as01 基础模型](https://github.com/animate1978/MB-Lab/tree/063bff04e60f3e7c651fda628c30f5d83f3f3078)派生，原作者 Manuel Bastioni，数据库与派生模型按 AGPL-3.0 提供。本项目制作短发、便装和行走骨架适配，校准站姿总高1.65米。模型为 `assets/asian-adult.glb`，可编辑完整源文件为 `assets/asian-adult-source.blend`，生成脚本为 `tools/avatar/build-avatar.py`，素材许可及来源说明位于 `tools/avatar/`。这是设计用虚拟人物，不是家庭成员的肖像。
- 先前版本使用的 Michelle / Mixamo 人物已替换，不再作为当前网页和视频人物。
- 洗衣机尺度核对：[Bosch WAV28M90](https://www.bosch-home.com/de/de/product/WAV28M90) 官方规格为高848、宽598、深590毫米。这仅支持模型采用约600×600×850毫米的常见机身范围，不是采购推荐或安装空间保证。
- 烟机安装距离对照：[Bosch 安装说明](https://media3.bosch-home.com/Documents/9000019153_A.pdf) 给出所涉型号电灶上方最小650毫米；不同型号规则不同。本模型约720毫米仍须按最终烟机/灶具说明复核。

房间净尺寸来源于用户给定图纸，不来源于以上产品网页。柜高、窗高、室内净高及右侧闭合位置的假设详见 README。

本轮排水条件参考：[湖北省住建部门公开技术答疑第4.1.7条](https://zjt.hubei.gov.cn/zfxxgk/zc/qtzdgkwj/202504/P020250910520743173556.pdf)，讨论较小卫生间在蹲便器与地面完全齐平条件下不另设地漏的情况；不作为本户已满足现场条件的证明。

渲染实现参考：[Three.js LightShadow](https://threejs.org/docs/pages/LightShadow.html)，使用有遮挡的光源、法线偏移和初始化后的静态阴影缓存。未增加外部贴图或运行时 CDN。

## 人物修改源与许可范围

人物源数据库版本：063bff04e60f3e7c651fda628c30f5d83f3f3078（animate1978/MB-Lab）。本次读取其 humanoid_library.blend、m_as01_verts.json、human_male_joints.json、human_male_joints_offset.json、human_male_vgroups_base.json、hum_m_asian_albedo.png。下载对应路径到同名 data 子目录后，用 Blender 执行生成脚本即可重建。也可以直接打开已经打包贴图、服装和骨架的 asian-adult-source.blend 编辑。

AGPL-3.0适用于这些派生人物模型数据和生成脚本；Three.js仍采用其MIT许可，室内布局及其他原创材料不因并列打包而改变许可。MB-Lab许可明确允许渲染图像和非逆向工程视频由渲染作者独立许可。完整原许可与AGPL正文随 tools/avatar 提供。

小蹲便参考：[中国联塑官方尺寸说明](https://www.lessobh.com/news/FAQs/3804.html)，列出520×420、535×430等规格。紧凑马桶参考：[Roca官方A342529000](https://www.uk.roca.com/products/round-back-wall-vitreous-china-close-coupled-rimless-wc-dual-outlet-342529..0?sku=A342529000)，采用375宽×600进深×760总高占位。仅引用尺度进行方案建模，未作供货或适装保证。
