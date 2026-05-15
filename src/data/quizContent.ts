// 这个类型表示问云考核题目类型，返回值用于页面决定单选或多选交互。
export type WenxinQuestionType = 'single' | 'multiple'

// 这个接口描述问云考核选项，入参来自题库，返回值用于页面渲染按钮。
export interface WenxinQuizOption {
  // 选项编号，例如 A、B、C、D。
  key: string
  // 选项正文，展示给考核者阅读。
  text: string
}

// 这个接口描述问云考核题目，入参来自题库，返回值用于页面计分和展示出处。
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

// 这个数组保存问云考核全部题目，返回值用于前台考核页自动渲染与计分。
export const wenxinQuizQuestions: WenxinQuizQuestion[] = [
  {
    id: 1,
    type: 'single',
    title: '立派金典中，“问云者”主要是在问什么？',
    options: [
      { key: 'A', text: '问吉凶祸福，替人断定命运' },
      { key: 'B', text: '问天地辽阔、问本心归处、问同道何在' },
      { key: 'C', text: '问如何让社群最快变热闹' },
      { key: 'D', text: '问如何建立森严门墙' }
    ],
    answer: ['B'],
    score: 3,
    source: '卷首语：立派缘起'
  },
  {
    id: 2,
    type: 'single',
    title: '问云派之本愿是哪一项？',
    options: [
      { key: 'A', text: '以名位压人，以服从立身' },
      { key: 'B', text: '以热闹结社，以人数取胜' },
      { key: 'C', text: '以温柔结社，以清醒立身，以陪伴渡人，以成长自渡' },
      { key: 'D', text: '以神坛立威，以焦虑牟利' }
    ],
    answer: ['C'],
    score: 3,
    source: '卷首语：立派缘起'
  },
  {
    id: 3,
    type: 'single',
    title: '问云派四项宗旨不包括哪一项？',
    options: [
      { key: 'A', text: '陪伴' },
      { key: 'B', text: '清醒' },
      { key: 'C', text: '成长' },
      { key: 'D', text: '牟利' }
    ],
    answer: ['D'],
    score: 3,
    source: '一、立派宗旨'
  },
  {
    id: 4,
    type: 'single',
    title: '金典中“守正”主要要求同门怎样行事？',
    options: [
      { key: 'A', text: '依法依规而行，尊重边界，守护信息安全' },
      { key: 'B', text: '为了热闹可以越过平台规则' },
      { key: 'C', text: '遇事先制造依赖，再给出答案' },
      { key: 'D', text: '以问云之名进行投资拉人' }
    ],
    answer: ['A'],
    score: 3,
    source: '一、立派宗旨'
  },
  {
    id: 5,
    type: 'single',
    title: '派名中“问”的含义更接近哪一项？',
    options: [
      { key: 'A', text: '提问、自省，不轻易把人生交给答案' },
      { key: 'B', text: '追问他人隐私，逼人说明来路' },
      { key: 'C', text: '只问输赢，不问本心' },
      { key: 'D', text: '用固定答案替别人决定人生' }
    ],
    answer: ['A'],
    score: 3,
    source: '二、派名释义'
  },
  {
    id: 6,
    type: 'single',
    title: '派名中“云”的含义是什么？',
    options: [
      { key: 'A', text: '辽阔、流动、不执一端' },
      { key: 'B', text: '封闭、固定、不可改变' },
      { key: 'C', text: '等级、命令、绝对服从' },
      { key: 'D', text: '营销、扩张、争夺流量' }
    ],
    answer: ['A'],
    score: 3,
    source: '二、派名释义'
  },
  {
    id: 7,
    type: 'single',
    title: '金典中说“派”是什么？',
    options: [
      { key: 'A', text: '门墙森严，入内不可离开' },
      { key: 'B', text: '同道相聚，不是门墙森严' },
      { key: 'C', text: '以身份高低分贵贱' },
      { key: 'D', text: '只为建立权威的组织' }
    ],
    answer: ['B'],
    score: 3,
    source: '二、派名释义'
  },
  {
    id: 8,
    type: 'single',
    title: '问云派八字派训是哪一项？',
    options: [
      { key: 'A', text: '清醒温柔，同行自渡' },
      { key: 'B', text: '争名逐利，各凭本事' },
      { key: 'C', text: '服从权威，不问缘由' },
      { key: 'D', text: '只求热闹，不设边界' }
    ],
    answer: ['A'],
    score: 3,
    source: '三、派训与精神象征'
  },
  {
    id: 9,
    type: 'single',
    title: '问云派四象是哪一组？',
    options: [
      { key: 'A', text: '山、海、月、剑' },
      { key: 'B', text: '云、灯、舟、竹' },
      { key: 'C', text: '风、雷、火、土' },
      { key: 'D', text: '琴、棋、书、画' }
    ],
    answer: ['B'],
    score: 3,
    source: '三、派训与精神象征'
  },
  {
    id: 10,
    type: 'single',
    title: '问云“三不立”不包括哪一项？',
    options: [
      { key: 'A', text: '不立神坛' },
      { key: 'B', text: '不售焦虑' },
      { key: 'C', text: '不替专业' },
      { key: 'D', text: '不许沉默' }
    ],
    answer: ['D'],
    score: 3,
    source: '四、问云三不立'
  },
  {
    id: 11,
    type: 'single',
    title: '“不替专业”提醒同门遇到严重心理危机、疾病或违法侵害时应如何处理？',
    options: [
      { key: 'A', text: '只在群里解决，不告诉任何人' },
      { key: 'B', text: '及时寻求专业机构、亲友或公共求助渠道' },
      { key: 'C', text: '让掌门替代医生、律师或咨询师' },
      { key: 'D', text: '用群友意见替代所有正式服务' }
    ],
    answer: ['B'],
    score: 3,
    source: '四、问云三不立'
  },
  {
    id: 12,
    type: 'single',
    title: '问云七愿中的“一愿真诚”主要强调什么？',
    options: [
      { key: 'A', text: '言不必尽完美，但求不虚伪、不欺瞒' },
      { key: 'B', text: '为了被关注可以编造经历' },
      { key: 'C', text: '把人心当作玩笑和筹码' },
      { key: 'D', text: '只在掌门面前保持礼貌' }
    ],
    answer: ['A'],
    score: 3,
    source: '五、问云七愿'
  },
  {
    id: 13,
    type: 'single',
    title: '问云七愿中的“清醒”说明了什么边界？',
    options: [
      { key: 'A', text: '安慰就是纵容，陪伴就是沉溺' },
      { key: 'B', text: '理解等于无条件越界' },
      { key: 'C', text: '安慰不等于纵容，陪伴不等于沉溺，理解不等于无边界' },
      { key: 'D', text: '只要善意就可以控制他人' }
    ],
    answer: ['C'],
    score: 3,
    source: '五、问云七愿'
  },
  {
    id: 14,
    type: 'single',
    title: '问云七愿中的“守界”原文更接近哪一项？',
    options: [
      { key: 'A', text: '不窥私、不逼问、不越界亲近' },
      { key: 'B', text: '熟悉后便可以随意打探隐私' },
      { key: 'C', text: '关心越多，越可以替别人做主' },
      { key: 'D', text: '群内关系越近，越不需要边界' }
    ],
    answer: ['A'],
    score: 3,
    source: '五、问云七愿'
  },
  {
    id: 15,
    type: 'single',
    title: '问云派组织职分的核心原则是什么？',
    options: [
      { key: 'A', text: '职分非尊卑，乃分工也' },
      { key: 'B', text: '职位越高越可以压人' },
      { key: 'C', text: '所有事情都由掌门一人负责' },
      { key: 'D', text: '普通同门没有共建责任' }
    ],
    answer: ['A'],
    score: 3,
    source: '六、组织之制'
  },
  {
    id: 16,
    type: 'single',
    title: '掌门在组织之制中的职责不包括哪一项？',
    options: [
      { key: 'A', text: '主理方向、章程、重大决策、核心氛围与对外事务' },
      { key: 'B', text: '守正、克制、透明' },
      { key: 'C', text: '以问云之名行个人崇拜或利益裹挟' },
      { key: 'D', text: '不得以身份压人' }
    ],
    answer: ['C'],
    score: 3,
    source: '六、组织之制'
  },
  {
    id: 17,
    type: 'single',
    title: '云纪执事主要负责什么？',
    options: [
      { key: 'A', text: '入群审核、群内秩序、违规提醒、公告发布与风险处置' },
      { key: 'B', text: '替同门决定人生方向' },
      { key: 'C', text: '未经同意公开成员故事' },
      { key: 'D', text: '组织线下活动时制造暧昧压力' }
    ],
    answer: ['A'],
    score: 3,
    source: '六、组织之制'
  },
  {
    id: 18,
    type: 'single',
    title: '入派之仪的总体原则是什么？',
    options: [
      { key: 'A', text: '繁文越多越好' },
      { key: 'B', text: '重在知情、自愿、守约' },
      { key: 'C', text: '必须披露全部隐私' },
      { key: 'D', text: '只看热闹程度，不看边界' }
    ],
    answer: ['B'],
    score: 3,
    source: '七、入派之仪'
  },
  {
    id: 19,
    type: 'single',
    title: '新同门“报云帖”时，哪类信息不得被强制披露？',
    options: [
      { key: 'A', text: '称呼、城市、兴趣、来此所求' },
      { key: 'B', text: '真实姓名、住址、单位、收入、情史、疾病等隐私' },
      { key: 'C', text: '一句入派愿词' },
      { key: 'D', text: '是否愿意阅读金典' }
    ],
    answer: ['B'],
    score: 3,
    source: '七、入派之仪'
  },
  {
    id: 20,
    type: 'single',
    title: '群中“成长打卡”的正确态度是什么？',
    options: [
      { key: 'A', text: '重在陪伴，不搞羞辱式监督' },
      { key: 'B', text: '必须每日公开排名' },
      { key: 'C', text: '未完成目标者要被群嘲' },
      { key: 'D', text: '由管理员替每个人制定人生计划' }
    ],
    answer: ['A'],
    score: 3,
    source: '八、群中可为之事'
  },
  {
    id: 21,
    type: 'single',
    title: '关于谣言与未经核实的“内幕”，金典要求如何处理？',
    options: [
      { key: 'A', text: '不明来源，不转不传' },
      { key: 'B', text: '先转发，之后再核实' },
      { key: 'C', text: '只要内容刺激就可以传播' },
      { key: 'D', text: '为了活跃气氛可以制造传闻' }
    ],
    answer: ['A'],
    score: 3,
    source: '九、群中十禁'
  },
  {
    id: 22,
    type: 'single',
    title: '金典对金钱诱导的规定是什么？',
    options: [
      { key: 'A', text: '不得在群内发起借贷、投资、返利、博彩、传销式项目' },
      { key: 'B', text: '群内可以随意拉投资' },
      { key: 'C', text: '只要熟人推荐就不用说明风险' },
      { key: 'D', text: '公益互助永远不需要公开用途和收支' }
    ],
    answer: ['A'],
    score: 3,
    source: '九、群中十禁'
  },
  {
    id: 23,
    type: 'single',
    title: '“问云言谈之法”中，“可建议，不命令”的例子是哪一项？',
    options: [
      { key: 'A', text: '你必须这样' },
      { key: 'B', text: '你可以试试' },
      { key: 'C', text: '你不听就是错' },
      { key: 'D', text: '我替你决定' }
    ],
    answer: ['B'],
    score: 3,
    source: '十、问云言谈之法'
  },
  {
    id: 24,
    type: 'single',
    title: '“每周一问”的参与方式是什么？',
    options: [
      { key: 'A', text: '同门自愿作答，不催、不评比' },
      { key: 'B', text: '所有人必须准时回答' },
      { key: 'C', text: '管理员公开排名' },
      { key: 'D', text: '不回答者不得继续留群' }
    ],
    answer: ['A'],
    score: 3,
    source: '十一、问云活动之制'
  },
  {
    id: 25,
    type: 'single',
    title: '线下雅集必须遵守哪项安全原则？',
    options: [
      { key: 'A', text: '地点公开、费用透明、自愿参加、可随时退出' },
      { key: 'B', text: '临时更换隐蔽地点' },
      { key: 'C', text: '强制饮酒以示亲近' },
      { key: 'D', text: '用暧昧压力推动活动气氛' }
    ],
    answer: ['A'],
    score: 3,
    source: '十一、问云活动之制'
  },
  {
    id: 26,
    type: 'multiple',
    title: '问云七愿包含哪些内容？',
    options: [
      { key: 'A', text: '真诚' },
      { key: 'B', text: '温和' },
      { key: 'C', text: '清醒' },
      { key: 'D', text: '互助' }
    ],
    answer: ['A', 'B', 'C', 'D'],
    score: 5,
    source: '五、问云七愿'
  },
  {
    id: 27,
    type: 'multiple',
    title: '群中可为之事包括哪些？',
    options: [
      { key: 'A', text: '日常问候' },
      { key: 'B', text: '心事倾诉' },
      { key: 'C', text: '读书观影' },
      { key: 'D', text: '成长打卡' }
    ],
    answer: ['A', 'B', 'C', 'D'],
    score: 5,
    source: '八、群中可为之事'
  },
  {
    id: 28,
    type: 'multiple',
    title: '群中十禁明确禁止哪些行为？',
    options: [
      { key: 'A', text: '违法违规内容与谣言传播' },
      { key: 'B', text: '侮辱、威胁、人身攻击' },
      { key: 'C', text: '骚扰越界与泄露隐私' },
      { key: 'D', text: '广告刷屏、金钱诱导、情绪绑架、冒名权威' }
    ],
    answer: ['A', 'B', 'C', 'D'],
    score: 5,
    source: '九、群中十禁'
  },
  {
    id: 29,
    type: 'multiple',
    title: '隐私与安全之制中，未经同意不得做哪些事？',
    options: [
      { key: 'A', text: '外传群聊截图' },
      { key: 'B', text: '公开他人故事' },
      { key: 'C', text: '将同门拉入其他群' },
      { key: 'D', text: '索要私人照片、住址、身份证件、收入证明等信息' }
    ],
    answer: ['A', 'B', 'C', 'D'],
    score: 5,
    source: '十五、隐私与安全之制'
  },
  {
    id: 30,
    type: 'multiple',
    title: '问云同门盟约与结语体现了哪些态度？',
    options: [
      { key: 'A', text: '愿真诚言说，也愿安静倾听' },
      { key: 'B', text: '不造谣，不欺人，不窥私，不越界' },
      { key: 'C', text: '愿守清醒温柔，愿护一方云灯' },
      { key: 'D', text: '人在风里，彼此递一盏灯' }
    ],
    answer: ['A', 'B', 'C', 'D'],
    score: 5,
    source: '十八、问云同门盟约；十九、结语'
  }
]

// 这个数组保存问云考核分数解释，返回值用于交卷后显示入册建议。
export const wenxinScoreLevels = [
  { min: 90, max: 100, text: '深知金典，可登记入册' },
  { min: 80, max: 89, text: '基本明愿知界，可登记入册' },
  { min: 70, max: 79, text: '建议云纪执事说明金典重点后，再决定是否入册' },
  { min: 0, max: 69, text: '建议暂缓入册，重读金典后再考' }
]
