// 这个类型表示问心考核题目类型，返回值用于页面决定单选或多选交互。
export type WenxinQuestionType = 'single' | 'multiple'

// 这个接口描述问心考核选项，入参来自题库，返回值用于页面渲染按钮。
export interface WenxinQuizOption {
  // 选项编号，例如 A、B、C、D。
  key: string
  // 选项正文，展示给考核者阅读。
  text: string
}

// 这个接口描述问心考核题目，入参来自题库，返回值用于页面计分和展示出处。
export interface WenxinQuizQuestion {
  // 题目序号，用于页面排序和显示。
  id: number
  // 题型，单选或多选。
  type: WenxinQuestionType
  // 题目正文。
  title: string
  // 题目选项。
  options: WenxinQuizOption[]
  // 正确答案，单选题只有一个，多选题可以有多个。
  answer: string[]
  // 本题分值。
  score: number
  // 金典出处，用于交卷后帮助新人回看原文。
  source: string
}

// 这个数组保存问心考核全部题目，返回值用于前台考核页自动渲染与计分。
export const wenxinQuizQuestions: WenxinQuizQuestion[] = [
  {
    id: 1,
    type: 'single',
    title: '“问云派”之名主要取何义？',
    options: [
      { key: 'A', text: '以云为号，追求名声远扬' },
      { key: 'B', text: '身处尘世，不失清明；来者可歇，去者自由' },
      { key: 'C', text: '建立严格等级，令众人服从' },
      { key: 'D', text: '只求热闹，不问规矩' }
    ],
    answer: ['B'],
    score: 3,
    source: '一·立派定名'
  },
  {
    id: 2,
    type: 'single',
    title: '问云派立派愿景为何？',
    options: [
      { key: 'A', text: '成为争名夺利之所' },
      { key: 'B', text: '成为只谈输赢的战场' },
      { key: 'C', text: '成为纷乱社会中可停靠的港湾、温馨的家' },
      { key: 'D', text: '成为严格封闭的组织' }
    ],
    answer: ['C'],
    score: 3,
    source: '二·立派愿景'
  },
  {
    id: 3,
    type: 'single',
    title: '问云派总旨四句为何？',
    options: [
      { key: 'A', text: '争名争利，各凭本事' },
      { key: 'B', text: '问云问心，守真守善；同道相扶，来去自由' },
      { key: 'C', text: '严守等级，不可离开' },
      { key: 'D', text: '只重人数，不问门风' }
    ],
    answer: ['B'],
    score: 3,
    source: '三·门派总旨'
  },
  {
    id: 4,
    type: 'single',
    title: '“守真守善”在金典中主要指什么？',
    options: [
      { key: 'A', text: '在群中夸张来路，显得厉害' },
      { key: 'B', text: '不虚饰身份，不夸张来路，真诚说话，善意相待' },
      { key: 'C', text: '只对熟人友善，对新人冷淡' },
      { key: 'D', text: '为了热闹可以随意编造故事' }
    ],
    answer: ['B'],
    score: 3,
    source: '三·门派总旨'
  },
  {
    id: 5,
    type: 'single',
    title: '金典中“同道相扶”的意思更接近哪一项？',
    options: [
      { key: 'A', text: '同门之间必须每日相见' },
      { key: 'B', text: '只帮身份高的人' },
      { key: 'C', text: '彼此有事可言，有难可听，有喜可贺，有困可扶' },
      { key: 'D', text: '凡事都由别人替自己解决' }
    ],
    answer: ['C'],
    score: 3,
    source: '三·门派总旨'
  },
  {
    id: 6,
    type: 'single',
    title: '问云派对“来去”的态度是什么？',
    options: [
      { key: 'A', text: '入派后不可退出' },
      { key: 'B', text: '退派必须公开受责' },
      { key: 'C', text: '入派不作束缚，退派不作怨怼，来去自由' },
      { key: 'D', text: '离开后永不可再归' }
    ],
    answer: ['C'],
    score: 3,
    source: '三·门派总旨'
  },
  {
    id: 7,
    type: 'single',
    title: '门派精神“清明”要求同门遇事应先如何？',
    options: [
      { key: 'A', text: '先站队，再发言' },
      { key: 'B', text: '先起哄，再判断' },
      { key: 'C', text: '遇事先明理，开口先留德，行事先问心' },
      { key: 'D', text: '先攻击对方，再解释自己' }
    ],
    answer: ['C'],
    score: 3,
    source: '四·门派精神·其一，清明'
  },
  {
    id: 8,
    type: 'single',
    title: '金典中“温暖”的门风不包括哪种行为？',
    options: [
      { key: 'A', text: '言语有温度' },
      { key: 'B', text: '愿意给人一点善意' },
      { key: 'C', text: '以嘲笑为聪明，以冷漠为高明' },
      { key: 'D', text: '不在他人低处添伤' }
    ],
    answer: ['C'],
    score: 3,
    source: '四·门派精神·其二，温暖'
  },
  {
    id: 9,
    type: 'single',
    title: '问云派所言“平等”主要指什么？',
    options: [
      { key: 'A', text: '只尊重资历最老的人' },
      { key: 'B', text: '不论年龄、职业、贫富、学历、来处，皆以礼相待' },
      { key: 'C', text: '新人必须长期低头' },
      { key: 'D', text: '谁声音大谁有理' }
    ],
    answer: ['B'],
    score: 3,
    source: '四·门派精神·其三，平等'
  },
  {
    id: 10,
    type: 'single',
    title: '门派精神“分寸”中，金典特别提醒什么？',
    options: [
      { key: 'A', text: '越关心越应逼问隐私' },
      { key: 'B', text: '熟悉以后便可越界' },
      { key: 'C', text: '温暖不是越界，关心不是控制' },
      { key: 'D', text: '以善意之名压人是正确的' }
    ],
    answer: ['C'],
    score: 3,
    source: '四·门派精神·其五，分寸'
  },
  {
    id: 11,
    type: 'single',
    title: '问云派对外箴言为何？',
    options: [
      { key: 'A', text: '云高不可问，尘世不可归' },
      { key: 'B', text: '人多即强，名响即胜' },
      { key: 'C', text: '山门森严，来者低头' },
      { key: 'D', text: '乱世问云，心有所栖' }
    ],
    answer: ['D'],
    score: 3,
    source: '五·对外箴言'
  },
  {
    id: 12,
    type: 'single',
    title: '问云派初立时，主要宗门所在为何？',
    options: [
      { key: 'A', text: '固定实体山门' },
      { key: 'B', text: '线下茶馆' },
      { key: 'C', text: '微信群' },
      { key: 'D', text: '公开交易市场' }
    ],
    answer: ['C'],
    score: 3,
    source: '六·宗门所在'
  },
  {
    id: 13,
    type: 'single',
    title: '愿入问云派者，最需要做到哪一项？',
    options: [
      { key: 'A', text: '献礼表功' },
      { key: 'B', text: '自夸来路' },
      { key: 'C', text: '认可愿景，愿守规矩，愿以善意待人' },
      { key: 'D', text: '证明自己比别人厉害' }
    ],
    answer: ['C'],
    score: 3,
    source: '七·入派之道'
  },
  {
    id: 14,
    type: 'single',
    title: '入门之人须守的一念是什么？',
    options: [
      { key: 'A', text: '我来此处，是为争一口气' },
      { key: 'B', text: '我来此处，是为压过他人' },
      { key: 'C', text: '我来此处，是为共建港湾，不是增加风浪' },
      { key: 'D', text: '我来此处，是为制造热闹' }
    ],
    answer: ['C'],
    score: 3,
    source: '七·入派之道'
  },
  {
    id: 15,
    type: 'single',
    title: '“守礼”要求群中说话应如何？',
    options: [
      { key: 'A', text: '有不同意见就可以人身攻击' },
      { key: 'B', text: '玩笑可以羞辱他人' },
      { key: 'C', text: '以礼为先，可争论，不可恶语伤人' },
      { key: 'D', text: '越尖刻越显得聪明' }
    ],
    answer: ['C'],
    score: 3,
    source: '九·门中规矩·一，守礼'
  },
  {
    id: 16,
    type: 'single',
    title: '“守真”禁止哪类行为？',
    options: [
      { key: 'A', text: '坦诚说明自己的情况' },
      { key: 'B', text: '不完美但真实地表达' },
      { key: 'C', text: '伪装身份行骗，编造故事博取同情，借信任谋私利' },
      { key: 'D', text: '承认自己有不懂之处' }
    ],
    answer: ['C'],
    score: 3,
    source: '九·门中规矩·二，守真'
  },
  {
    id: 17,
    type: 'single',
    title: '“守界”中明确要求同门不可做什么？',
    options: [
      { key: 'A', text: '尊重他人边界' },
      { key: 'B', text: '不强行打探隐私' },
      { key: 'C', text: '私自公开群友聊天、照片、联系方式或经历' },
      { key: 'D', text: '不以熟悉之名冒犯' }
    ],
    answer: ['C'],
    score: 3,
    source: '九·门中规矩·四，守界'
  },
  {
    id: 18,
    type: 'single',
    title: '“守净”所禁止的内容不包括哪一类？',
    options: [
      { key: 'A', text: '诈骗赌博' },
      { key: 'B', text: '违法低俗' },
      { key: 'C', text: '真诚交流生活、心情、读书与困惑' },
      { key: 'D', text: '恶意引战和色情暴力' }
    ],
    answer: ['C'],
    score: 3,
    source: '九·门中规矩·六，守净'
  },
  {
    id: 19,
    type: 'single',
    title: '执事在宗门架构中的职责是什么？',
    options: [
      { key: 'A', text: '以职分压人' },
      { key: 'B', text: '协助掌门管理群务，维护秩序，处理入派、公告、活动等事' },
      { key: 'C', text: '偏私护短' },
      { key: 'D', text: '只管热闹，不管边界' }
    ],
    answer: ['B'],
    score: 3,
    source: '十一·宗门架构·二，执事'
  },
  {
    id: 20,
    type: 'single',
    title: '护灯人的职责更接近哪一项？',
    options: [
      { key: 'A', text: '以资历压新人' },
      { key: 'B', text: '只负责发布命令' },
      { key: 'C', text: '活跃气氛、关照新人、提醒规矩、传递温暖' },
      { key: 'D', text: '替所有人决定去留' }
    ],
    answer: ['C'],
    score: 3,
    source: '十一·宗门架构·三，护灯人'
  },
  {
    id: 21,
    type: 'single',
    title: '金典中言：“问云派可以温柔，不能无底线。”其后一句为何？',
    options: [
      { key: 'A', text: '可以热闹，不能冷清' },
      { key: 'B', text: '可以自由，不能安静' },
      { key: 'C', text: '可以包容，不能纵容伤害' },
      { key: 'D', text: '可以来去，不能离别' }
    ],
    answer: ['C'],
    score: 3,
    source: '十·宗门禁律'
  },
  {
    id: 22,
    type: 'single',
    title: '金典中言问云派不求一时热闹，更重何事？',
    options: [
      { key: 'A', text: '人多势众' },
      { key: 'B', text: '名声远扬' },
      { key: 'C', text: '细水长流' },
      { key: 'D', text: '等级森严' }
    ],
    answer: ['C'],
    score: 3,
    source: '四·门派精神·其六，长久'
  },
  {
    id: 23,
    type: 'single',
    title: '金典所谓“愿说则说，愿静则静”，其意为何？',
    options: [
      { key: 'A', text: '入派者必须每日发言' },
      { key: 'B', text: '不发言者不算同门' },
      { key: 'C', text: '不强迫发言，亦尊重安静之人' },
      { key: 'D', text: '群中不可热闹' }
    ],
    answer: ['C'],
    score: 3,
    source: '四·门派精神·其四，自由'
  },
  {
    id: 24,
    type: 'single',
    title: '同门之间若有矛盾，金典所定较合适的处理方式为何？',
    options: [
      { key: 'A', text: '立刻公开争吵' },
      { key: 'B', text: '私下拉人站队' },
      { key: 'C', text: '先私下沟通，沟通不成，可请管理调停' },
      { key: 'D', text: '长期阴阳怪气' }
    ],
    answer: ['C'],
    score: 3,
    source: '九·门中规矩·七，守和'
  },
  {
    id: 25,
    type: 'single',
    title: '金典对于退派之人，所持态度为何？',
    options: [
      { key: 'A', text: '离开便是背叛' },
      { key: 'B', text: '退派者必须公开说明原因' },
      { key: 'C', text: '来去自由，缘来则聚，缘尽则别' },
      { key: 'D', text: '退派后永不可再归' }
    ],
    answer: ['C'],
    score: 3,
    source: '八·退派之道'
  },
  {
    id: 26,
    type: 'multiple',
    title: '问云派门风八字包含哪些？',
    options: [
      { key: 'A', text: '清、暖、真、和' },
      { key: 'B', text: '静、善' },
      { key: 'C', text: '自由' },
      { key: 'D', text: '有界' }
    ],
    answer: ['A', 'B', 'C', 'D'],
    score: 5,
    source: '十三·问云门风'
  },
  {
    id: 27,
    type: 'multiple',
    title: '宗门日常可包含哪些内容？',
    options: [
      { key: 'A', text: '问云清谈' },
      { key: 'B', text: '每日一问' },
      { key: 'C', text: '云灯时刻' },
      { key: 'D', text: '同门互助与线下雅集' }
    ],
    answer: ['A', 'B', 'C', 'D'],
    score: 5,
    source: '十二·宗门日常'
  },
  {
    id: 28,
    type: 'multiple',
    title: '宗门禁律中，哪些行为会被视情警告、禁言、劝退或移出？',
    options: [
      { key: 'A', text: '辱骂、威胁、骚扰同门' },
      { key: 'B', text: '恶意造谣、挑拨离间、长期引战' },
      { key: 'C', text: '欺骗钱财、借机营销、诱导投资' },
      { key: 'D', text: '泄露隐私、借本派名义从事违法违规之事' }
    ],
    answer: ['A', 'B', 'C', 'D'],
    score: 5,
    source: '十·宗门禁律'
  },
  {
    id: 29,
    type: 'multiple',
    title: '问云誓词中体现了哪些态度？',
    options: [
      { key: 'A', text: '愿守真心' },
      { key: 'B', text: '不以恶语伤人，不以虚情欺人' },
      { key: 'C', text: '不添风浪，只添灯火' },
      { key: 'D', text: '来时真诚，去时坦荡' }
    ],
    answer: ['A', 'B', 'C', 'D'],
    score: 5,
    source: '十四·问云誓词'
  },
  {
    id: 30,
    type: 'multiple',
    title: '金典结语中，问云派愿守怎样的地方？',
    options: [
      { key: 'A', text: '乱世之中不那么吵的地方' },
      { key: 'B', text: '风雨之间不那么大的伞' },
      { key: 'C', text: '人海之内不那么耀眼却足够温暖的灯' },
      { key: 'D', text: '真诚、自在、清明、温和的同道之家' }
    ],
    answer: ['A', 'B', 'C', 'D'],
    score: 5,
    source: '十六·立派结语'
  }
]

// 这个数组保存问心考核分数解释，返回值用于交卷后显示入册建议。
export const wenxinScoreLevels = [
  { min: 90, max: 100, text: '深知门风，可登记入册' },
  { min: 80, max: 89, text: '基本明规，可登记入册' },
  { min: 70, max: 79, text: '建议执事说明金典重点后，再决定是否入册' },
  { min: 0, max: 69, text: '建议暂缓入册，重读金典后再考' }
]
