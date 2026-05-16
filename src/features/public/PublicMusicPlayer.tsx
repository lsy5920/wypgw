import { useEffect, useState, type CSSProperties } from 'react'
import type { SiteSetting } from '../../lib/types'
import { fetchSettings } from '../../shared/services'
import { databaseClient } from '../../shared/services/supabase'

// 这个接口描述一条飘落歌词的临时状态，入参来自当前歌词，返回值用于生成随机动效样式。
interface FallingLyric {
  // 飘落歌词唯一编号，用于 React 稳定渲染。
  id: number
  // 飘落歌词文本。
  text: string
  // 飘落起点距离左侧的百分比。
  left: number
  // 飘落持续时间，单位秒。
  duration: number
  // 飘落开始延迟，单位秒。
  delay: number
  // 飘落横向漂移距离，单位像素。
  drift: number
  // 飘落旋转角度，单位度。
  rotate: number
}

// 这个接口描述前台音乐播放器设置，入参来自公开站点设置，返回值用于渲染播放器。
interface PublicMusicSetting {
  // 是否启用播放器。
  enabled: boolean
  // 网易云歌单编号。
  playlistId: string
  // 播放器标题。
  title: string
  // 歌词轮播文本数组。
  lyricLines: string[]
  // 是否请求网易云自动播放。
  autoplay: boolean
}

// 这个接口描述歌词函数返回结果，入参来自 Supabase Edge Function，返回值用于覆盖后台手写歌词。
interface NeteaseLyricsFunctionResponse {
  // 是否成功获取真实歌词。
  ok?: boolean
  // 函数返回的提示文字。
  message?: string
  // 已经去掉时间戳的真实歌词行。
  lines?: string[]
  // 当前取到歌词的歌曲名。
  songName?: string
}

// 这个数组保存默认歌词牌，后台没有填写歌词时使用。
const defaultLyricLines = [
  '云水之间，愿心慢慢安定',
  '灯火初上，照见归来的路',
  '山门不急，风也不催人',
  '清醒温柔，同行自渡',
  '把喧哗放轻，把真心留下'
]

// 这个函数从网易云歌单链接里提取编号，入参是链接或编号，返回值是歌单编号。
function extractNeteasePlaylistId(value: unknown): string {
  const text = String(value ?? '').trim()
  const idMatch = text.match(/[?&#]id=(\d+)/)
  const pathMatch = text.match(/playlist(?:\/|\?id=)(\d+)/)
  const pureMatch = text.match(/^\d+$/)

  return idMatch?.[1] ?? pathMatch?.[1] ?? pureMatch?.[0] ?? ''
}

// 这个函数把站点设置转换为音乐播放器设置，入参是设置列表，返回值是播放器可读配置。
function parseMusicSetting(settings: SiteSetting[]): PublicMusicSetting | null {
  const value = settings.find((item) => item.key === 'music_player')?.value

  if (!value) {
    return null
  }

  const playlistId = String(value.playlist_id ?? '') || extractNeteasePlaylistId(value.playlist_url)
  const lyricText = String(value.lyric_lines ?? '')
  const lyricLines = lyricText
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)

  return {
    enabled: Boolean(value.enabled),
    playlistId,
    title: String(value.title ?? '问云派山门歌单'),
    lyricLines: lyricLines.length > 0 ? lyricLines : defaultLyricLines,
    autoplay: Boolean(value.autoplay)
  }
}

// 这个函数通过 Supabase Edge Function 获取网易云真实歌词，入参是播放器设置，返回值是真实歌词行数组。
async function fetchRealLyricLines(setting: PublicMusicSetting): Promise<string[]> {
  if (!databaseClient) {
    return []
  }

  try {
    // 这里交给 Edge Function 服务端访问网易云接口，绕开浏览器跨域限制。
    const { data, error } = await databaseClient.functions.invoke('fetch-netease-lyrics', {
      body: { playlistId: setting.playlistId }
    })

    if (error) {
      throw error
    }

    const result = data as NeteaseLyricsFunctionResponse | null
    const lines = result?.lines?.map((item) => item.trim()).filter(Boolean) ?? []

    return result?.ok && lines.length > 0 ? lines : []
  } catch {
    // 这里兜底处理函数未部署、网易云限制或网络异常，前台继续使用后台配置歌词。
    return []
  }
}

// 这个函数生成一条随机飘落歌词，入参是歌词文本，返回值是带随机位置和动效的歌词对象。
function createFallingLyric(text: string): FallingLyric {
  return {
    id: Date.now() + Math.round(Math.random() * 10000),
    text,
    left: 8 + Math.round(Math.random() * 74),
    duration: 8 + Math.round(Math.random() * 5),
    delay: Number((Math.random() * 0.6).toFixed(2)),
    drift: Math.round(Math.random() * 84) - 42,
    rotate: Math.round(Math.random() * 18) - 9
  }
}

// 这个组件展示前台网易云音乐播放器，入参为空，返回值是全站公开页浮动播放器。
export function PublicMusicPlayer() {
  // 这个状态保存播放器设置。
  const [setting, setSetting] = useState<PublicMusicSetting | null>(null)
  // 这个状态保存播放器控制台弹窗是否打开。
  const [modalOpen, setModalOpen] = useState(false)
  // 这个状态记录用户是否已经用页面点击启动过音乐。
  const [hasOpened, setHasOpened] = useState(false)
  // 这个状态保存自动播放失败后的全屏提示是否显示。
  const [autoplayPromptOpen, setAutoplayPromptOpen] = useState(false)
  // 这个状态记录用户是否已经处理过自动播放提示，避免反复打扰。
  const [autoplayPromptHandled, setAutoplayPromptHandled] = useState(false)
  // 这个状态保存当前歌词序号。
  const [lineIndex, setLineIndex] = useState(0)
  // 这个状态保存页面里正在飘落的歌词，数量会被限制，避免长期占用性能。
  const [fallingLyrics, setFallingLyrics] = useState<FallingLyric[]>([])

  useEffect(() => {
    let cancelled = false

    // 这里读取公开音乐设置，失败时服务层会返回演示数据。
    async function loadMusicPlayer() {
      try {
        const settingsResult = await fetchSettings()
        const nextSetting = parseMusicSetting(settingsResult.data)

        if (cancelled) {
          return
        }

        setSetting(nextSetting)

        if (nextSetting?.enabled && nextSetting.playlistId) {
          const realLyricLines = await fetchRealLyricLines(nextSetting)

          if (!cancelled && realLyricLines.length > 0) {
            setLineIndex(0)
            setSetting((current) => (current?.playlistId === nextSetting.playlistId ? { ...current, lyricLines: realLyricLines } : current))
          }
        }
      } catch {
        // 这里兜底处理网络或数据库异常，播放器隐藏，不影响公开页面正常阅读。
        if (!cancelled) {
          setSetting(null)
        }
      }
    }

    void loadMusicPlayer()

    return () => {
      cancelled = true
    }
  }, [])

  // 这个变量保存当前歌词文本，前台只显示歌词本身，保持画面干净。
  const currentLine = setting?.lyricLines[lineIndex] ?? defaultLyricLines[0]

  // 这个函数打开播放器控制台，入参为空，返回值为空。
  function openPlayerModal() {
    setHasOpened(true)
    setAutoplayPromptHandled(true)
    setAutoplayPromptOpen(false)
    setModalOpen(true)
  }

  // 这个函数关闭播放器控制台，入参为空，返回值为空。
  function closePlayerModal() {
    setModalOpen(false)
  }

  useEffect(() => {
    if (!setting?.enabled || setting.lyricLines.length === 0) {
      return undefined
    }

    // 这里自动滚动歌词，前台只展示歌词文字本身。
    const timer = window.setInterval(() => {
      setLineIndex((current) => (current + 1) % setting.lyricLines.length)
    }, 5200)

    return () => window.clearInterval(timer)
  }, [setting])

  useEffect(() => {
    if (!setting?.enabled || !currentLine) {
      return undefined
    }

    // 这里让歌词以随机位置飘落，最多保留五条，避免动效堆积影响手机性能。
    setFallingLyrics((current) => [...current.slice(-4), createFallingLyric(currentLine)])
    const timer = window.setTimeout(() => {
      setFallingLyrics((current) => current.slice(1))
    }, 11000)

    return () => window.clearTimeout(timer)
  }, [currentLine, setting?.enabled])

  useEffect(() => {
    if (!setting?.enabled || !setting.autoplay || autoplayPromptHandled || hasOpened) {
      return undefined
    }

    // 网易云外链播放器是跨域 iframe，无法让本站直接读取真实播放状态；这里用无用户手势超时作为自动播放失败兜底提示。
    const timer = window.setTimeout(() => {
      setAutoplayPromptOpen(true)
    }, 1600)

    return () => window.clearTimeout(timer)
  }, [autoplayPromptHandled, hasOpened, setting])

  if (!setting?.enabled || !setting.playlistId) {
    return null
  }

  // 这个变量生成网易云外链播放器地址，type=0 表示歌单。
  const playerUrl = `https://music.163.com/outchain/player?type=0&id=${encodeURIComponent(setting.playlistId)}&auto=1&height=430`

  return (
    <>
      <div className="public-music-fall-field" aria-label="悬浮歌词入口">
        {fallingLyrics.map((item) => (
          <button
            key={item.id}
            className="public-music-fall-line"
            onClick={openPlayerModal}
            style={{
              '--fall-left': `${item.left}%`,
              '--fall-duration': `${item.duration}s`,
              '--fall-delay': `${item.delay}s`,
              '--fall-drift': `${item.drift}px`,
              '--fall-rotate': `${item.rotate}deg`
            } as CSSProperties}
            type="button"
          >
            {item.text}
          </button>
        ))}
      </div>
      {autoplayPromptOpen ? (
        <div className="public-music-ready" aria-live="polite">
          <span>音乐已经备好，轻点飘落歌词开始。</span>
        </div>
      ) : null}
      {modalOpen ? (
        <div className="public-music-modal" role="dialog" aria-modal="true" aria-labelledby="music-modal-title">
          <button aria-label="关闭音乐播放器" className="public-music-modal__shade" onClick={closePlayerModal} type="button" />
          <section className="public-music-modal__panel">
            <div className="public-music-modal__head">
              <div>
                <span>悬浮歌词已选中</span>
                <h2 id="music-modal-title">{setting.title}</h2>
              </div>
              <button onClick={closePlayerModal} type="button">
                收起
              </button>
            </div>
            <p>{currentLine}</p>
            <div className="public-music-modal__frame">
              {hasOpened ? <iframe title="网易云音乐歌单播放器" src={playerUrl} loading="lazy" allow="autoplay; encrypted-media" /> : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
