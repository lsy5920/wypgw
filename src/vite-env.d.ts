/// <reference types="vite/client" />

// 这个声明用于让 TypeScript 认识通过 ?raw 导入的纯文本资料文件。
declare module '*?raw' {
  // 这个变量代表原始文本内容，返回值是未加工的字符串。
  const content: string
  export default content
}
