import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

// 这个常量保存项目根目录，入参为空，返回值用于拼接所有生成文件路径。
const projectRoot = process.cwd()

// 这个常量保存网站二版设计归档目录，返回值用于集中放置设计图和说明。
const redesignRoot = join(projectRoot, '网站重构2.0')

// 这个常量保存网站运行时二版视觉资产目录，返回值用于前端直接引用。
const publicAssetRoot = join(projectRoot, 'public', 'visual-v2')

// 这个对象保存二版主色，入参为空，返回值用于生成所有设计图的统一色彩。
const color = {
  ink: '#122327',
  night: '#06171d',
  jade: '#557f76',
  moss: '#7f8f63',
  gold: '#d5ae62',
  lightGold: '#f7df9e',
  seal: '#a83b32',
  plum: '#74344a',
  paper: '#fff8ea',
  cloud: '#eef4ef',
  mist: '#dce9e3'
}

// 这个函数确保目录存在，入参是目录路径，返回值为空。
function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true })
}

// 这个函数写入 UTF-8 文件，入参是文件路径和内容，返回值为空。
function writeText(filePath, content) {
  ensureDir(dirname(filePath))
  writeFileSync(filePath, content, 'utf8')
}

// 这个函数把一个资源同时写入前端 public 和设计归档目录，入参是分类、文件名和内容，返回值为空。
function writeSharedAsset(category, fileName, content) {
  writeText(join(publicAssetRoot, fileName), content)
  writeText(join(redesignRoot, '03-视觉资产', category, fileName), content)
}

// 这个常量保存二版山门主视觉，返回值是可直接作为背景使用的 SVG 图片。
const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-labelledby="title desc">
  <title id="title">问云派二版山门主视觉</title>
  <desc id="desc">云海、山门、玉阶、灯火和远山组成的问云派二版网站主视觉。</desc>
  <defs>
    <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#f6fbf7"/>
      <stop offset="42%" stop-color="#dce9e3"/>
      <stop offset="100%" stop-color="#fff3d9"/>
    </linearGradient>
    <linearGradient id="ridge" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${color.ink}"/>
      <stop offset="58%" stop-color="${color.jade}"/>
      <stop offset="100%" stop-color="#9fb08a"/>
    </linearGradient>
    <linearGradient id="gate" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#14292f"/>
      <stop offset="55%" stop-color="#36524d"/>
      <stop offset="100%" stop-color="#5f5140"/>
    </linearGradient>
    <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff3bc" stop-opacity="1"/>
      <stop offset="100%" stop-color="#d5ae62" stop-opacity="0"/>
    </radialGradient>
    <filter id="blurCloud" x="-20%" y="-30%" width="140%" height="160%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="22" stdDeviation="18" flood-color="#06171d" flood-opacity="0.28"/>
    </filter>
  </defs>
  <rect width="1600" height="900" fill="url(#sky)"/>
  <path d="M0 486 C188 360 318 338 461 432 C612 531 692 202 875 342 C1025 456 1169 296 1328 390 C1442 457 1527 438 1600 393 L1600 900 L0 900 Z" fill="#c8d9d2"/>
  <path d="M0 572 C205 410 377 410 520 506 C682 614 750 302 943 452 C1097 571 1232 382 1390 492 C1498 567 1560 546 1600 520 L1600 900 L0 900 Z" fill="url(#ridge)" opacity="0.92"/>
  <path d="M0 696 C240 636 430 690 640 632 C842 576 1016 650 1206 614 C1368 584 1506 598 1600 574 L1600 900 L0 900 Z" fill="${color.paper}" opacity="0.88"/>
  <g filter="url(#blurCloud)" opacity="0.72">
    <ellipse cx="246" cy="585" rx="258" ry="58" fill="#ffffff"/>
    <ellipse cx="694" cy="544" rx="354" ry="72" fill="#ffffff"/>
    <ellipse cx="1160" cy="594" rx="324" ry="64" fill="#ffffff"/>
    <ellipse cx="1370" cy="716" rx="314" ry="58" fill="#fffaf0"/>
    <ellipse cx="490" cy="742" rx="372" ry="62" fill="#fffaf0"/>
  </g>
  <g transform="translate(559 246)" filter="url(#softShadow)">
    <path d="M241 0 L548 156 L487 164 L487 220 L429 220 L429 568 L346 568 L346 319 C346 256 136 256 136 319 L136 568 L53 568 L53 220 L0 220 L293 68 Z" fill="url(#gate)"/>
    <path d="M-22 220 L570 220 L518 149 L30 149 Z" fill="#172b2c"/>
    <path d="M54 149 L492 149 L426 82 L118 82 Z" fill="#263b3b"/>
    <path d="M191 319 C191 288 291 288 291 319 L291 568 L191 568 Z" fill="#fff8ea" opacity="0.92"/>
    <path d="M212 333 C212 312 270 312 270 333 L270 568 L212 568 Z" fill="${color.jade}" opacity="0.75"/>
    <rect x="119" y="254" width="244" height="56" rx="8" fill="${color.gold}" opacity="0.92"/>
    <path d="M163 282 L95 348" stroke="${color.lightGold}" stroke-width="10" stroke-linecap="round" opacity="0.82"/>
    <path d="M319 282 L387 348" stroke="${color.lightGold}" stroke-width="10" stroke-linecap="round" opacity="0.82"/>
    <rect x="204" y="102" width="78" height="46" rx="6" fill="${color.seal}"/>
    <text x="243" y="133" text-anchor="middle" font-size="25" font-family="SimSun, serif" font-weight="700" fill="${color.paper}">问云</text>
  </g>
  <g opacity="0.9">
    <circle cx="522" cy="548" r="92" fill="url(#lampGlow)"/>
    <circle cx="749" cy="548" r="92" fill="url(#lampGlow)"/>
    <circle cx="856" cy="548" r="92" fill="url(#lampGlow)"/>
    <circle cx="1080" cy="548" r="92" fill="url(#lampGlow)"/>
    <g fill="${color.seal}">
      <ellipse cx="522" cy="548" rx="21" ry="32"/>
      <ellipse cx="749" cy="548" rx="21" ry="32"/>
      <ellipse cx="856" cy="548" rx="21" ry="32"/>
      <ellipse cx="1080" cy="548" rx="21" ry="32"/>
    </g>
  </g>
  <path d="M560 728 C668 684 922 684 1038 728" fill="none" stroke="${color.gold}" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
  <path d="M612 766 C708 736 880 736 988 766" fill="none" stroke="${color.jade}" stroke-width="5" stroke-linecap="round" opacity="0.45"/>
</svg>`

// 这个常量保存二版云雾流线，返回值用于页面首屏、页脚和暗色区块。
const cloudRibbonSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 280" role="img" aria-labelledby="title desc">
  <title id="title">问云派二版云雾流线</title>
  <desc id="desc">多层半透明云雾线条，作为页面氛围纹理。</desc>
  <g fill="none" stroke-linecap="round">
    <path d="M22 78 C152 -2 246 134 378 64 C488 6 584 42 660 104 C756 184 900 52 1014 118 C1078 156 1124 154 1178 126" stroke="${color.jade}" stroke-width="10" opacity="0.24"/>
    <path d="M52 160 C188 88 286 216 438 142 C558 84 650 132 746 184 C872 252 974 150 1162 204" stroke="${color.gold}" stroke-width="7" opacity="0.24"/>
    <path d="M16 238 C154 188 260 266 414 222 C570 178 692 262 846 218 C962 184 1052 198 1184 236" stroke="${color.paper}" stroke-width="8" opacity="0.36"/>
  </g>
</svg>`

// 这个常量保存二版宣纸纤维纹理，返回值用于卡片、页面背景和设计图底纹。
const paperFiberSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-labelledby="title desc">
  <title id="title">问云派二版宣纸纤维纹理</title>
  <desc id="desc">细密纸纹和浅金网格组成的柔和背景纹理。</desc>
  <rect width="600" height="600" fill="${color.paper}"/>
  <g opacity="0.22" stroke-linecap="round">
    <path d="M-60 62 C92 24 182 94 326 54 C452 18 534 36 660 14" stroke="${color.gold}" stroke-width="2"/>
    <path d="M-40 160 C100 116 210 196 356 148 C472 110 560 134 646 102" stroke="${color.jade}" stroke-width="1.8"/>
    <path d="M-60 318 C76 270 210 354 360 302 C468 264 548 286 650 250" stroke="${color.gold}" stroke-width="1.6"/>
    <path d="M-44 486 C106 438 232 520 372 476 C488 438 548 458 650 420" stroke="${color.jade}" stroke-width="1.7"/>
  </g>
  <g opacity="0.12" stroke="${color.ink}" stroke-width="1">
    <path d="M0 80 H600 M0 180 H600 M0 280 H600 M0 380 H600 M0 480 H600"/>
    <path d="M80 0 V600 M180 0 V600 M280 0 V600 M380 0 V600 M480 0 V600"/>
  </g>
</svg>`

// 这个常量保存二版朱砂印，返回值用于页脚、卡片角标和设计图标识。
const sealSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title desc">
  <title id="title">问云派二版朱砂印</title>
  <desc id="desc">朱砂方印，内含问云二字和山门纹理。</desc>
  <defs>
    <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7"/>
      <feDisplacementMap in="SourceGraphic" scale="4"/>
    </filter>
  </defs>
  <rect x="58" y="58" width="396" height="396" rx="22" fill="${color.seal}" filter="url(#rough)" opacity="0.94"/>
  <rect x="88" y="88" width="336" height="336" rx="12" fill="none" stroke="${color.paper}" stroke-width="16" opacity="0.86"/>
  <path d="M128 182 C188 118 324 118 384 182" fill="none" stroke="${color.paper}" stroke-width="16" stroke-linecap="round" opacity="0.86"/>
  <path d="M148 332 C218 276 294 276 364 332" fill="none" stroke="${color.paper}" stroke-width="14" stroke-linecap="round" opacity="0.78"/>
  <text x="256" y="272" text-anchor="middle" font-size="118" font-family="SimSun, STSong, serif" font-weight="900" fill="${color.paper}">问云</text>
</svg>`

// 这个常量保存二版灯火流程图，返回值用于首页流程区和设计图归档。
const lanternMapSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700" role="img" aria-labelledby="title desc">
  <title id="title">问云派二版入册灯火图</title>
  <desc id="desc">六盏灯串联阅读金典、进入小院、问心考核、递交名帖、执事审核、列入名册流程。</desc>
  <rect width="1200" height="700" rx="8" fill="${color.night}"/>
  <path d="M0 460 C190 342 322 510 506 390 C690 270 826 428 1010 340 C1108 292 1164 300 1200 278 L1200 700 L0 700 Z" fill="${color.jade}" opacity="0.32"/>
  <path d="M114 350 C270 310 406 390 572 350 C758 305 898 374 1088 326" fill="none" stroke="${color.gold}" stroke-width="4" stroke-linecap="round" opacity="0.62"/>
  <g font-family="Microsoft YaHei, sans-serif" text-anchor="middle">
    <g transform="translate(150 326)">
      <circle r="54" fill="${color.gold}" opacity="0.25"/>
      <ellipse cy="-8" rx="25" ry="34" fill="${color.lightGold}"/>
      <ellipse cy="-8" rx="12" ry="22" fill="${color.seal}"/>
      <text y="82" font-size="24" fill="${color.paper}" font-weight="700">阅读金典</text>
    </g>
    <g transform="translate(330 360)">
      <circle r="54" fill="${color.gold}" opacity="0.25"/>
      <ellipse cy="-8" rx="25" ry="34" fill="${color.lightGold}"/>
      <ellipse cy="-8" rx="12" ry="22" fill="${color.seal}"/>
      <text y="82" font-size="24" fill="${color.paper}" font-weight="700">进入小院</text>
    </g>
    <g transform="translate(510 318)">
      <circle r="54" fill="${color.gold}" opacity="0.25"/>
      <ellipse cy="-8" rx="25" ry="34" fill="${color.lightGold}"/>
      <ellipse cy="-8" rx="12" ry="22" fill="${color.seal}"/>
      <text y="82" font-size="24" fill="${color.paper}" font-weight="700">问心考核</text>
    </g>
    <g transform="translate(690 358)">
      <circle r="54" fill="${color.gold}" opacity="0.25"/>
      <ellipse cy="-8" rx="25" ry="34" fill="${color.lightGold}"/>
      <ellipse cy="-8" rx="12" ry="22" fill="${color.seal}"/>
      <text y="82" font-size="24" fill="${color.paper}" font-weight="700">递交名帖</text>
    </g>
    <g transform="translate(870 320)">
      <circle r="54" fill="${color.gold}" opacity="0.25"/>
      <ellipse cy="-8" rx="25" ry="34" fill="${color.lightGold}"/>
      <ellipse cy="-8" rx="12" ry="22" fill="${color.seal}"/>
      <text y="82" font-size="24" fill="${color.paper}" font-weight="700">执事审核</text>
    </g>
    <g transform="translate(1050 348)">
      <circle r="54" fill="${color.gold}" opacity="0.25"/>
      <ellipse cy="-8" rx="25" ry="34" fill="${color.lightGold}"/>
      <ellipse cy="-8" rx="12" ry="22" fill="${color.seal}"/>
      <text y="82" font-size="24" fill="${color.paper}" font-weight="700">列入名册</text>
    </g>
  </g>
  <text x="78" y="94" font-size="32" font-family="SimSun, serif" font-weight="900" fill="${color.paper}">问云入册灯火图</text>
  <text x="78" y="138" font-size="18" font-family="Microsoft YaHei, sans-serif" fill="${color.mist}">每一步都有回应，每一次申请都有边界。</text>
</svg>`

// 这个常量保存二版工作台背景，返回值用于小院和后台的统一工作台质感。
const workbenchGridSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" role="img" aria-labelledby="title desc">
  <title id="title">问云派二版工作台背景</title>
  <desc id="desc">深色侧栏、宣纸内容区、统计卡片和表单列表组成的工作台设计图。</desc>
  <rect width="1000" height="700" rx="8" fill="${color.cloud}"/>
  <rect x="0" y="0" width="236" height="700" rx="8" fill="${color.night}"/>
  <rect x="26" y="30" width="52" height="52" rx="8" fill="${color.paper}"/>
  <text x="96" y="56" font-size="24" fill="${color.paper}" font-family="SimSun, serif" font-weight="900">问云工作台</text>
  <g fill="${color.paper}" opacity="0.14">
    <rect x="26" y="118" width="178" height="42" rx="8"/>
    <rect x="26" y="172" width="178" height="42" rx="8"/>
    <rect x="26" y="226" width="178" height="42" rx="8"/>
    <rect x="26" y="280" width="178" height="42" rx="8"/>
  </g>
  <rect x="270" y="36" width="684" height="628" rx="8" fill="${color.paper}" stroke="${color.gold}" stroke-opacity="0.32"/>
  <text x="308" y="96" font-size="34" fill="${color.ink}" font-family="SimSun, serif" font-weight="900">护灯与守门</text>
  <g>
    <rect x="308" y="132" width="138" height="108" rx="8" fill="#ffffff" stroke="${color.gold}" stroke-opacity="0.24"/>
    <rect x="468" y="132" width="138" height="108" rx="8" fill="#ffffff" stroke="${color.gold}" stroke-opacity="0.24"/>
    <rect x="628" y="132" width="138" height="108" rx="8" fill="#ffffff" stroke="${color.gold}" stroke-opacity="0.24"/>
    <rect x="788" y="132" width="128" height="108" rx="8" fill="#ffffff" stroke="${color.gold}" stroke-opacity="0.24"/>
  </g>
  <g fill="${color.jade}" opacity="0.18">
    <rect x="308" y="284" width="608" height="52" rx="8"/>
    <rect x="308" y="352" width="608" height="52" rx="8"/>
    <rect x="308" y="420" width="608" height="52" rx="8"/>
    <rect x="308" y="488" width="608" height="52" rx="8"/>
  </g>
  <path d="M300 620 C436 578 596 638 734 596 C812 572 878 580 928 552" fill="none" stroke="${color.gold}" stroke-width="4" stroke-linecap="round" opacity="0.52"/>
</svg>`

// 这个常量保存插画版首页主视觉，返回值用于首页首屏和设计归档。
const homeIllustrationSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 900" role="img" aria-labelledby="title desc">
  <title id="title">问云派插画首页主视觉</title>
  <desc id="desc">问云派山门、远山、云桥、灯火和两位同门组成的插画主视觉。</desc>
  <defs>
    <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#f7fbf5"/>
      <stop offset="50%" stop-color="#dce9e3"/>
      <stop offset="100%" stop-color="#fff0d3"/>
    </linearGradient>
    <linearGradient id="gatePaint" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#122327"/>
      <stop offset="62%" stop-color="#43635c"/>
      <stop offset="100%" stop-color="#6f634e"/>
    </linearGradient>
    <radialGradient id="warmGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff4bd" stop-opacity="1"/>
      <stop offset="100%" stop-color="#d5ae62" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1400" height="900" fill="url(#sky)"/>
  <path d="M0 524 C168 370 340 446 472 506 C606 566 678 260 844 392 C982 502 1112 360 1248 444 C1328 494 1372 486 1400 466 L1400 900 L0 900 Z" fill="#8fb0a8" opacity="0.54"/>
  <path d="M0 620 C178 492 354 528 510 620 C680 720 762 426 938 560 C1078 666 1210 542 1400 612 L1400 900 L0 900 Z" fill="#557f76" opacity="0.62"/>
  <path d="M0 704 C210 650 392 690 602 642 C812 596 970 670 1184 632 C1296 612 1358 620 1400 604 L1400 900 L0 900 Z" fill="#fff8ea"/>
  <g opacity="0.9">
    <ellipse cx="338" cy="680" rx="260" ry="58" fill="#ffffff" opacity="0.66"/>
    <ellipse cx="794" cy="634" rx="320" ry="62" fill="#ffffff" opacity="0.58"/>
    <ellipse cx="1154" cy="704" rx="256" ry="54" fill="#ffffff" opacity="0.62"/>
  </g>
  <g transform="translate(485 210)">
    <path d="M220 18 L508 166 L452 172 L452 226 L394 226 L394 520 L308 520 L308 344 C308 282 152 282 152 344 L152 520 L66 520 L66 226 L14 226 L272 86 Z" fill="url(#gatePaint)"/>
    <path d="M-12 226 L530 226 L478 158 L40 158 Z" fill="#122327"/>
    <path d="M76 158 L442 158 L384 96 L134 96 Z" fill="#263b3b"/>
    <rect x="190" y="254" width="166" height="52" rx="8" fill="#d5ae62"/>
    <text x="273" y="288" text-anchor="middle" font-size="27" font-family="SimSun, serif" font-weight="900" fill="#122327">问云</text>
    <path d="M190 342 C190 306 356 306 356 342 L356 520 L190 520 Z" fill="#fff8ea" opacity="0.9"/>
    <path d="M224 358 C224 340 322 340 322 358 L322 520 L224 520 Z" fill="#557f76" opacity="0.8"/>
  </g>
  <g>
    <circle cx="428" cy="548" r="80" fill="url(#warmGlow)"/>
    <circle cx="982" cy="548" r="80" fill="url(#warmGlow)"/>
    <path d="M410 522 C410 492 446 492 446 522 C446 548 428 570 428 570 C428 570 410 548 410 522 Z" fill="#f7df9e"/>
    <ellipse cx="428" cy="524" rx="12" ry="20" fill="#a83b32"/>
    <path d="M964 522 C964 492 1000 492 1000 522 C1000 548 982 570 982 570 C982 570 964 548 964 522 Z" fill="#f7df9e"/>
    <ellipse cx="982" cy="524" rx="12" ry="20" fill="#a83b32"/>
  </g>
  <g transform="translate(262 578)">
    <circle cx="44" cy="35" r="24" fill="#f1c9aa"/>
    <path d="M22 62 C34 44 56 44 68 62 L92 144 L0 144 Z" fill="#74344a"/>
    <path d="M26 28 C38 8 56 10 66 28 C56 22 42 22 26 28 Z" fill="#122327"/>
    <path d="M74 92 C122 80 150 66 184 40" fill="none" stroke="#d5ae62" stroke-width="8" stroke-linecap="round"/>
  </g>
  <g transform="translate(1042 578)">
    <circle cx="44" cy="35" r="24" fill="#f1c9aa"/>
    <path d="M22 62 C34 44 56 44 68 62 L92 144 L0 144 Z" fill="#557f76"/>
    <path d="M24 28 C34 8 58 8 68 28 C54 22 40 22 24 28 Z" fill="#122327"/>
    <path d="M8 92 C-40 80 -68 66 -102 40" fill="none" stroke="#d5ae62" stroke-width="8" stroke-linecap="round"/>
  </g>
  <path d="M318 742 C470 688 930 688 1082 742" fill="none" stroke="#d5ae62" stroke-width="8" stroke-linecap="round" opacity="0.62"/>
</svg>`

// 这个常量保存插画版问心考核图，返回值用于考核入口和设计归档。
const quizIllustrationSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620" role="img" aria-labelledby="title desc">
  <title id="title">问心考核插画</title>
  <desc id="desc">卷轴、题签、印章和灯火组成的问心考核插画。</desc>
  <rect width="900" height="620" rx="8" fill="#eef4ef"/>
  <path d="M0 430 C170 360 292 470 460 396 C608 330 724 420 900 362 L900 620 L0 620 Z" fill="#557f76" opacity="0.2"/>
  <rect x="188" y="104" width="524" height="346" rx="8" fill="#fff8ea" stroke="#d5ae62" stroke-width="5"/>
  <rect x="160" y="126" width="70" height="302" rx="35" fill="#d5ae62"/>
  <rect x="670" y="126" width="70" height="302" rx="35" fill="#d5ae62"/>
  <text x="450" y="196" text-anchor="middle" font-size="48" font-family="SimSun, serif" font-weight="900" fill="#122327">问心考核</text>
  <g fill="#557f76" opacity="0.74">
    <rect x="290" y="246" width="320" height="16" rx="8"/>
    <rect x="290" y="292" width="250" height="16" rx="8"/>
    <rect x="290" y="338" width="290" height="16" rx="8"/>
  </g>
  <circle cx="642" cy="354" r="54" fill="#a83b32" opacity="0.9"/>
  <text x="642" y="370" text-anchor="middle" font-size="38" font-family="SimSun, serif" font-weight="900" fill="#fff8ea">合</text>
</svg>`

// 这个常量保存插画版云灯图，返回值用于云灯页面和设计归档。
const lanternIllustrationSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620" role="img" aria-labelledby="title desc">
  <title id="title">云灯留言插画</title>
  <desc id="desc">夜色云海中多盏云灯升起，象征同门留言与祝福。</desc>
  <rect width="900" height="620" rx="8" fill="#06171d"/>
  <path d="M0 450 C166 354 316 474 472 392 C626 312 740 428 900 348 L900 620 L0 620 Z" fill="#557f76" opacity="0.36"/>
  <path d="M80 480 C226 430 350 508 504 466 C640 428 736 464 850 424" fill="none" stroke="#d5ae62" stroke-width="4" stroke-linecap="round" opacity="0.46"/>
  <g>
    <circle cx="212" cy="260" r="86" fill="#d5ae62" opacity="0.2"/>
    <path d="M174 232 C174 168 250 168 250 232 C250 284 212 326 212 326 C212 326 174 284 174 232 Z" fill="#f7df9e"/>
    <ellipse cx="212" cy="234" rx="22" ry="34" fill="#a83b32"/>
    <circle cx="450" cy="204" r="104" fill="#d5ae62" opacity="0.18"/>
    <path d="M406 170 C406 98 494 98 494 170 C494 230 450 278 450 278 C450 278 406 230 406 170 Z" fill="#f7df9e"/>
    <ellipse cx="450" cy="172" rx="25" ry="40" fill="#a83b32"/>
    <circle cx="676" cy="286" r="78" fill="#d5ae62" opacity="0.22"/>
    <path d="M642 260 C642 204 710 204 710 260 C710 304 676 340 676 340 C676 340 642 304 642 260 Z" fill="#f7df9e"/>
    <ellipse cx="676" cy="262" rx="19" ry="30" fill="#a83b32"/>
  </g>
  <text x="80" y="96" font-size="42" font-family="SimSun, serif" font-weight="900" fill="#fff8ea">一盏云灯，照见同道</text>
</svg>`

// 这个常量保存插画版名册图，返回值用于名册页面和设计归档。
const rosterIllustrationSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620" role="img" aria-labelledby="title desc">
  <title id="title">问云名册插画</title>
  <desc id="desc">名册卡片、道名编号和同门头像组成的问云名册插画。</desc>
  <rect width="900" height="620" rx="8" fill="#fff8ea"/>
  <path d="M0 444 C172 356 310 486 478 392 C630 308 746 430 900 360 L900 620 L0 620 Z" fill="#dce9e3"/>
  <rect x="126" y="104" width="648" height="384" rx="8" fill="#ffffff" stroke="#d5ae62" stroke-width="5"/>
  <text x="190" y="176" font-size="44" font-family="SimSun, serif" font-weight="900" fill="#122327">问云名册</text>
  <g transform="translate(190 230)">
    <rect width="160" height="190" rx="8" fill="#eef4ef" stroke="#d5ae62" stroke-opacity="0.32"/>
    <circle cx="80" cy="58" r="32" fill="#557f76"/>
    <text x="80" y="124" text-anchor="middle" font-size="28" font-family="SimSun, serif" font-weight="900" fill="#122327">云初</text>
    <text x="80" y="158" text-anchor="middle" font-size="16" font-family="Microsoft YaHei, sans-serif" fill="#557f76">问云-云-001</text>
  </g>
  <g transform="translate(370 230)">
    <rect width="160" height="190" rx="8" fill="#fff3df" stroke="#d5ae62" stroke-opacity="0.32"/>
    <circle cx="80" cy="58" r="32" fill="#a83b32"/>
    <text x="80" y="124" text-anchor="middle" font-size="28" font-family="SimSun, serif" font-weight="900" fill="#122327">云灯</text>
    <text x="80" y="158" text-anchor="middle" font-size="16" font-family="Microsoft YaHei, sans-serif" fill="#557f76">问云-云-002</text>
  </g>
  <g transform="translate(550 230)">
    <rect width="160" height="190" rx="8" fill="#eef4ef" stroke="#d5ae62" stroke-opacity="0.32"/>
    <circle cx="80" cy="58" r="32" fill="#74344a"/>
    <text x="80" y="124" text-anchor="middle" font-size="28" font-family="SimSun, serif" font-weight="900" fill="#122327">云山</text>
    <text x="80" y="158" text-anchor="middle" font-size="16" font-family="Microsoft YaHei, sans-serif" fill="#557f76">问云-云-003</text>
  </g>
</svg>`

// 这个常量保存插画版小院图，返回值用于小院入口和设计归档。
const courtyardIllustrationSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620" role="img" aria-labelledby="title desc">
  <title id="title">问云小院插画</title>
  <desc id="desc">院门、灯笼、桌案和消息卡片组成的问云小院插画。</desc>
  <rect width="900" height="620" rx="8" fill="#eef4ef"/>
  <path d="M0 426 C180 344 298 458 470 390 C638 324 744 436 900 360 L900 620 L0 620 Z" fill="#dce9e3"/>
  <rect x="214" y="166" width="472" height="294" rx="8" fill="#fff8ea" stroke="#d5ae62" stroke-width="5"/>
  <path d="M260 166 L450 70 L640 166 Z" fill="#122327"/>
  <rect x="286" y="220" width="118" height="240" rx="8" fill="#557f76"/>
  <rect x="496" y="220" width="118" height="240" rx="8" fill="#557f76"/>
  <rect x="384" y="316" width="132" height="144" rx="66" fill="#ffffff" opacity="0.92"/>
  <circle cx="318" cy="286" r="60" fill="#d5ae62" opacity="0.26"/>
  <ellipse cx="318" cy="286" rx="18" ry="28" fill="#a83b32"/>
  <circle cx="582" cy="286" r="60" fill="#d5ae62" opacity="0.26"/>
  <ellipse cx="582" cy="286" rx="18" ry="28" fill="#a83b32"/>
  <text x="450" y="535" text-anchor="middle" font-size="42" font-family="SimSun, serif" font-weight="900" fill="#122327">问云小院</text>
</svg>`

// 这个常量保存插画版后台图，返回值用于后台入口和设计归档。
const adminIllustrationSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620" role="img" aria-labelledby="title desc">
  <title id="title">问云后台插画</title>
  <desc id="desc">深色仪表盘、审核列表、公告卡片和统计灯火组成的后台插画。</desc>
  <rect width="900" height="620" rx="8" fill="#06171d"/>
  <rect x="92" y="82" width="716" height="458" rx="8" fill="#fff8ea"/>
  <rect x="92" y="82" width="180" height="458" rx="8" fill="#122327"/>
  <text x="132" y="142" font-size="28" font-family="SimSun, serif" font-weight="900" fill="#fff8ea">问云后台</text>
  <g fill="#ffffff" opacity="0.14">
    <rect x="126" y="190" width="110" height="34" rx="8"/>
    <rect x="126" y="240" width="110" height="34" rx="8"/>
    <rect x="126" y="290" width="110" height="34" rx="8"/>
  </g>
  <text x="316" y="152" font-size="38" font-family="SimSun, serif" font-weight="900" fill="#122327">护灯与守门</text>
  <g>
    <rect x="318" y="194" width="128" height="92" rx="8" fill="#eef4ef"/>
    <rect x="468" y="194" width="128" height="92" rx="8" fill="#fff3df"/>
    <rect x="618" y="194" width="128" height="92" rx="8" fill="#eef4ef"/>
  </g>
  <g fill="#557f76" opacity="0.22">
    <rect x="318" y="334" width="428" height="42" rx="8"/>
    <rect x="318" y="394" width="428" height="42" rx="8"/>
    <rect x="318" y="454" width="428" height="42" rx="8"/>
  </g>
</svg>`

// 这个常量保存二版视觉总览图，返回值用于设计归档查看整体规范。
const visualOverviewSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 960" role="img" aria-labelledby="title desc">
  <title id="title">问云派网站重构二点零视觉总览</title>
  <desc id="desc">展示问云派二版网站的色彩、按钮、卡片、导航、首屏和工作台设计方向。</desc>
  <rect width="1440" height="960" fill="${color.cloud}"/>
  <image href="../03-视觉资产/背景/wenyun-hero-v2.svg" x="760" y="70" width="560" height="315"/>
  <text x="88" y="114" font-size="54" font-family="SimSun, serif" font-weight="900" fill="${color.ink}">问云派网站重构 2.0</text>
  <text x="90" y="164" font-size="22" font-family="Microsoft YaHei, sans-serif" fill="${color.jade}">定位：名门山门、清雅江湖、温暖港湾、边界有礼。</text>
  <g transform="translate(88 230)">
    <text y="0" font-size="28" font-family="SimSun, serif" font-weight="900" fill="${color.ink}">色彩系统</text>
    <g transform="translate(0 34)">
      <rect width="110" height="78" rx="8" fill="${color.ink}"/><text x="0" y="104" font-size="16" fill="${color.ink}">墨青</text>
      <rect x="132" width="110" height="78" rx="8" fill="${color.jade}"/><text x="132" y="104" font-size="16" fill="${color.ink}">玉青</text>
      <rect x="264" width="110" height="78" rx="8" fill="${color.gold}"/><text x="264" y="104" font-size="16" fill="${color.ink}">鎏金</text>
      <rect x="396" width="110" height="78" rx="8" fill="${color.seal}"/><text x="396" y="104" font-size="16" fill="${color.ink}">朱砂</text>
      <rect x="528" width="110" height="78" rx="8" fill="${color.paper}" stroke="${color.gold}" stroke-opacity="0.34"/><text x="528" y="104" font-size="16" fill="${color.ink}">宣纸</text>
    </g>
  </g>
  <g transform="translate(88 430)">
    <text y="0" font-size="28" font-family="SimSun, serif" font-weight="900" fill="${color.ink}">组件样式</text>
    <rect x="0" y="36" width="190" height="54" rx="27" fill="${color.ink}"/>
    <text x="95" y="70" text-anchor="middle" font-size="18" fill="${color.paper}" font-family="Microsoft YaHei, sans-serif" font-weight="700">主行动按钮</text>
    <rect x="214" y="36" width="190" height="54" rx="27" fill="${color.seal}"/>
    <text x="309" y="70" text-anchor="middle" font-size="18" fill="${color.paper}" font-family="Microsoft YaHei, sans-serif" font-weight="700">朱砂按钮</text>
    <rect x="0" y="132" width="330" height="178" rx="8" fill="${color.paper}" stroke="${color.gold}" stroke-opacity="0.38"/>
    <text x="28" y="184" font-size="28" font-family="SimSun, serif" font-weight="900" fill="${color.ink}">宣纸卡片</text>
    <text x="28" y="226" font-size="17" fill="${color.jade}" font-family="Microsoft YaHei, sans-serif">用于前台内容和表单说明。</text>
  </g>
  <g transform="translate(760 456)">
    <image href="../03-视觉资产/组件/workbench-grid-v2.svg" width="560" height="392"/>
  </g>
</svg>`

// 这个常量保存首页桌面设计图，返回值用于设计归档。
const homeDesktopSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 960" role="img" aria-labelledby="title desc">
  <title id="title">问云派首页桌面端设计图</title>
  <desc id="desc">问云派二版首页桌面端 UI 设计图。</desc>
  <rect width="1440" height="960" fill="${color.cloud}"/>
  <rect x="48" y="40" width="1344" height="82" rx="8" fill="${color.night}" opacity="0.94"/>
  <text x="104" y="92" font-size="32" font-family="SimSun, serif" font-weight="900" fill="${color.paper}">问云派</text>
  <g font-family="Microsoft YaHei, sans-serif" font-size="16" fill="${color.paper}" opacity="0.88">
    <text x="760" y="88">立派金典</text><text x="850" y="88">问心考核</text><text x="950" y="88">问云名册</text><text x="1050" y="88">云灯留言</text><text x="1150" y="88">问云雅集</text>
  </g>
  <rect x="48" y="154" width="1344" height="486" rx="8" fill="${color.night}"/>
  <image href="../03-视觉资产/背景/wenyun-hero-v2.svg" x="656" y="188" width="650" height="366" opacity="0.92"/>
  <text x="114" y="262" font-size="24" fill="${color.lightGold}" font-family="Microsoft YaHei, sans-serif" font-weight="700">问云山门 · 名册有序 · 门风有界</text>
  <text x="110" y="370" font-size="106" font-family="SimSun, serif" font-weight="900" fill="${color.paper}">问云派</text>
  <text x="116" y="426" font-size="24" fill="${color.mist}" font-family="Microsoft YaHei, sans-serif">乱世问云，心有所栖。此处以清明、温暖、真诚与边界守一方可归之地。</text>
  <rect x="116" y="492" width="150" height="54" rx="27" fill="${color.seal}"/><text x="191" y="526" text-anchor="middle" font-size="18" fill="${color.paper}" font-family="Microsoft YaHei, sans-serif" font-weight="700">登记名册</text>
  <rect x="286" y="492" width="150" height="54" rx="27" fill="${color.paper}"/><text x="361" y="526" text-anchor="middle" font-size="18" fill="${color.ink}" font-family="Microsoft YaHei, sans-serif" font-weight="700">问心考核</text>
  <g transform="translate(80 696)">
    <rect width="370" height="178" rx="8" fill="${color.paper}" stroke="${color.gold}" stroke-opacity="0.34"/>
    <rect x="430" width="370" height="178" rx="8" fill="${color.paper}" stroke="${color.gold}" stroke-opacity="0.34"/>
    <rect x="860" width="370" height="178" rx="8" fill="${color.paper}" stroke="${color.gold}" stroke-opacity="0.34"/>
    <text x="34" y="66" font-size="32" font-family="SimSun, serif" font-weight="900" fill="${color.ink}">立派有典</text>
    <text x="464" y="66" font-size="32" font-family="SimSun, serif" font-weight="900" fill="${color.ink}">入册有序</text>
    <text x="894" y="66" font-size="32" font-family="SimSun, serif" font-weight="900" fill="${color.ink}">同门有礼</text>
  </g>
</svg>`

// 这个常量保存移动端设计图，返回值用于设计归档。
const mobileSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 1200" role="img" aria-labelledby="title desc">
  <title id="title">问云派移动端首页设计图</title>
  <desc id="desc">问云派二版移动端首页 UI 设计图。</desc>
  <rect width="720" height="1200" fill="${color.cloud}"/>
  <rect x="70" y="38" width="580" height="1120" rx="44" fill="#10191b"/>
  <rect x="92" y="70" width="536" height="1056" rx="34" fill="${color.cloud}"/>
  <rect x="116" y="98" width="488" height="74" rx="8" fill="${color.night}"/>
  <text x="150" y="144" font-size="28" font-family="SimSun, serif" font-weight="900" fill="${color.paper}">问云派</text>
  <rect x="116" y="194" width="488" height="396" rx="8" fill="${color.night}"/>
  <image href="../03-视觉资产/背景/wenyun-hero-v2.svg" x="136" y="344" width="448" height="252" opacity="0.68"/>
  <text x="148" y="264" font-size="18" fill="${color.lightGold}" font-family="Microsoft YaHei, sans-serif" font-weight="700">问云山门</text>
  <text x="146" y="336" font-size="72" font-family="SimSun, serif" font-weight="900" fill="${color.paper}">问云派</text>
  <text x="148" y="382" font-size="19" fill="${color.mist}" font-family="Microsoft YaHei, sans-serif">乱世问云，心有所栖。</text>
  <rect x="148" y="626" width="210" height="58" rx="29" fill="${color.seal}"/><text x="253" y="662" text-anchor="middle" font-size="20" fill="${color.paper}" font-family="Microsoft YaHei, sans-serif" font-weight="700">登记名册</text>
  <rect x="374" y="626" width="210" height="58" rx="29" fill="${color.paper}"/><text x="479" y="662" text-anchor="middle" font-size="20" fill="${color.ink}" font-family="Microsoft YaHei, sans-serif" font-weight="700">问心考核</text>
  <rect x="116" y="724" width="488" height="128" rx="8" fill="${color.paper}" stroke="${color.gold}" stroke-opacity="0.34"/>
  <rect x="116" y="878" width="488" height="128" rx="8" fill="${color.paper}" stroke="${color.gold}" stroke-opacity="0.34"/>
  <rect x="116" y="1032" width="488" height="72" rx="8" fill="${color.ink}" opacity="0.94"/>
  <text x="148" y="780" font-size="30" font-family="SimSun, serif" font-weight="900" fill="${color.ink}">立派有典</text>
  <text x="148" y="934" font-size="30" font-family="SimSun, serif" font-weight="900" fill="${color.ink}">入册有序</text>
</svg>`

// 这个常量保存小院工作台设计图，返回值用于设计归档。
const yardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 960" role="img" aria-labelledby="title desc">
  <title id="title">问云小院工作台设计图</title>
  <desc id="desc">问云小院二版工作台 UI 设计图。</desc>
  <rect width="1440" height="960" fill="${color.cloud}"/>
  <image href="../03-视觉资产/组件/workbench-grid-v2.svg" x="120" y="80" width="1200" height="840"/>
  <text x="452" y="200" font-size="42" font-family="SimSun, serif" font-weight="900" fill="${color.ink}">云初，欢迎回院</text>
  <text x="454" y="246" font-size="20" font-family="Microsoft YaHei, sans-serif" fill="${color.jade}">这里收着你的名帖、云灯、雅集报名和状态提醒。</text>
</svg>`

// 这个常量保存后台工作台设计图，返回值用于设计归档。
const adminSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 960" role="img" aria-labelledby="title desc">
  <title id="title">问云后台工作台设计图</title>
  <desc id="desc">问云后台二版管理工作台 UI 设计图。</desc>
  <rect width="1440" height="960" fill="${color.cloud}"/>
  <image href="../03-视觉资产/组件/workbench-grid-v2.svg" x="120" y="80" width="1200" height="840"/>
  <text x="452" y="200" font-size="42" font-family="SimSun, serif" font-weight="900" fill="${color.ink}">护灯与守门</text>
  <text x="454" y="246" font-size="20" font-family="Microsoft YaHei, sans-serif" fill="${color.jade}">名册、云灯、公告、雅集与执事权限集中管理。</text>
</svg>`

// 这个常量保存归档说明文档，返回值用于让小白知道每类图片放在哪里。
const archiveReadme = `# 网站重构 2.0 图片归档

这里集中存放问云派官网二版重构生成的 UI 图片和视觉资产。

## 目录说明

1. \`01-设计总览\`：放整体视觉规范图，方便快速确认色彩、组件和页面方向。
2. \`02-页面设计图\`：放首页、移动端、小院和后台的静态设计图。
3. \`03-视觉资产\`：放网站实际使用的背景、纹理、印章、组件示意图和插画图。
4. \`04-运行截图\`：构建并启动网站后，自动导出的真实页面截图会放在这里。

## 本次设计关键词

名门山门、玉青宣纸、朱砂印记、鎏金细线、扁平插画、深色工作台、移动端优先适配。
`

// 这里创建所有需要的归档目录，避免后续截图时目录不存在。
ensureDir(join(redesignRoot, '01-设计总览'))
ensureDir(join(redesignRoot, '02-页面设计图'))
ensureDir(join(redesignRoot, '03-视觉资产', '背景'))
ensureDir(join(redesignRoot, '03-视觉资产', '纹理'))
ensureDir(join(redesignRoot, '03-视觉资产', '标识'))
ensureDir(join(redesignRoot, '03-视觉资产', '组件'))
ensureDir(join(redesignRoot, '03-视觉资产', '插画'))
ensureDir(join(redesignRoot, '04-运行截图', '桌面'))
ensureDir(join(redesignRoot, '04-运行截图', '移动'))
ensureDir(publicAssetRoot)

// 这里写入前端会直接使用的二版视觉资产。
writeSharedAsset('背景', 'wenyun-hero-v2.svg', heroSvg)
writeSharedAsset('纹理', 'cloud-ribbon-v2.svg', cloudRibbonSvg)
writeSharedAsset('纹理', 'paper-fiber-v2.svg', paperFiberSvg)
writeSharedAsset('标识', 'seal-v2.svg', sealSvg)
writeSharedAsset('组件', 'lantern-map-v2.svg', lanternMapSvg)
writeSharedAsset('组件', 'workbench-grid-v2.svg', workbenchGridSvg)
writeSharedAsset('插画', 'home-illustration-v2.svg', homeIllustrationSvg)
writeSharedAsset('插画', 'quiz-illustration-v2.svg', quizIllustrationSvg)
writeSharedAsset('插画', 'lantern-illustration-v2.svg', lanternIllustrationSvg)
writeSharedAsset('插画', 'roster-illustration-v2.svg', rosterIllustrationSvg)
writeSharedAsset('插画', 'courtyard-illustration-v2.svg', courtyardIllustrationSvg)
writeSharedAsset('插画', 'admin-illustration-v2.svg', adminIllustrationSvg)

// 这里写入设计归档专用的大图，便于直接打开查看二版方向。
writeText(join(redesignRoot, '01-设计总览', '问云派2.0视觉总览.svg'), visualOverviewSvg)
writeText(join(redesignRoot, '02-页面设计图', '首页桌面端设计.svg'), homeDesktopSvg)
writeText(join(redesignRoot, '02-页面设计图', '首页移动端设计.svg'), mobileSvg)
writeText(join(redesignRoot, '02-页面设计图', '问云小院工作台设计.svg'), yardSvg)
writeText(join(redesignRoot, '02-页面设计图', '问云后台工作台设计.svg'), adminSvg)
writeText(join(redesignRoot, 'README.md'), archiveReadme)

// 这里给命令行输出中文结果，方便确认生成成功。
console.log('网站重构2.0视觉资产和设计图已生成。')
