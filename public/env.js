// 这个文件用于保存线上运行时公开配置，入参来自 GitHub Actions 写入或本地占位，返回值会挂到浏览器窗口上。
window.__WENYUN_ENV__ = {
  // 这里保存 Supabase 项目地址，本地占位为空，线上会由部署流程自动改写。
  VITE_SUPABASE_URL: 'https://bauvdyyrtobyxhamjiwk.supabase.co',
  // 这里保存 Supabase 公开匿名密钥，本地占位为空，线上会由部署流程自动改写。
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdXZkeXlydG9ieXhoYW1qaXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTkwNzQsImV4cCI6MjA5Mjg5NTA3NH0.mmChhhQ2VJGOuRkNftNmEgUvlj2AxDha4zhczKh_nhI'
}
