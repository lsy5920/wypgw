import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { SiteSetting } from '../../lib/types'
import { fetchSettings } from '../../shared/services'
import { databaseClient } from '../../shared/services/supabase'
import { supabaseUrl } from '../../shared/services/env'

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

// 这个函数整理真实歌词函数返回值，入参是未知响应，返回值是真实歌词行数组。
function parseLyricFunctionLines(value: unknown): string[] {
  const result = value as NeteaseLyricsFunctionResponse | null
  const lines = result?.lines?.map((item) => item.trim()).filter(Boolean) ?? []

  return result?.ok && lines.length > 0 ? lines : []
}

// 这个接口描述歌词签的位置，入参来自拖动事件，返回值用于固定歌词签。
interface LyricDockPosition {
  // 歌词签横向坐标，单位像素。
  x: number
  // 歌词签纵向坐标，单位像素。
  y: number
  // 歌词签是否已经完成初始定位。
  ready: boolean
}

// 这个接口描述拖动状态，入参来自指针事件，返回值用于区分点击和长按拖动。
interface LyricDragState {
  // 是否已经进入拖动。
  dragging: boolean
  // 按下时的指针横坐标。
  startX: number
  // 按下时的指针纵坐标。
  startY: number
  // 按下时歌词签横坐标。
  originX: number
  // 按下时歌词签纵坐标。
  originY: number
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
    // 这里优先用简单 GET 调用 Edge Function，避免浏览器因为自定义请求头触发预检后被旧部署拦住。
    if (supabaseUrl) {
      const endpoint = new URL(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/fetch-netease-lyrics`)
      endpoint.searchParams.set('playlistId', setting.playlistId)
      const response = await fetch(endpoint)

      if (response.ok) {
        const lines = parseLyricFunctionLines(await response.json())

        if (lines.length > 0) {
          return lines
        }
      }
    }
  } catch {
    // 这里兜底处理旧函数未部署 GET 或网络异常，继续尝试 Supabase SDK 调用。
  }

  try {
    // 这里交给 Edge Function 服务端访问网易云接口，绕开浏览器跨域限制。
    const { data, error } = await databaseClient.functions.invoke('fetch-netease-lyrics', {
      body: { playlistId: setting.playlistId }
    })

    if (error) {
      throw error
    }

    const lines = parseLyricFunctionLines(data)

    return lines
  } catch {
    // 这里兜底处理函数未部署、网易云限制或网络异常，前台继续使用后台配置歌词。
    return []
  }
}

// 这个函数把数字限制在指定范围内，入参是原值、最小值和最大值，返回值是安全值。
function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// 这个函数把歌词签吸附到左右侧边，入参是当前位置，返回值是吸附后的安全位置。
function snapDockPosition(position: LyricDockPosition): LyricDockPosition {
  try {
    const edgeSpace = 34
    const maxX = Math.max(window.innerWidth - edgeSpace, edgeSpace)
    const maxY = Math.max(window.innerHeight - 92, 92)
    const safeY = clampValue(position.y, 92, maxY)
    const nearLeft = position.x <= 110
    const nearRight = position.x >= window.innerWidth - 110

    if (nearLeft) {
      return { x: edgeSpace, y: safeY, ready: true }
    }

    if (nearRight) {
      return { x: maxX, y: safeY, ready: true }
    }

    return {
      x: clampValue(position.x, edgeSpace, maxX),
      y: safeY,
      ready: true
    }
  } catch {
    // 这里兜底处理非浏览器环境，避免渲染阶段异常。
    return { x: 0, y: 0, ready: false }
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
  // 这个状态保存歌词签位置，默认初始化后贴在右侧。
  const [dockPosition, setDockPosition] = useState<LyricDockPosition>({ x: 0, y: 0, ready: false })
  // 这个状态保存歌词签是否处于拖动中，用于调整视觉反馈。
  const [draggingDock, setDraggingDock] = useState(false)
  // 这个引用保存长按计时器，避免短点击误进入拖动。
  const longPressTimer = useRef<number | null>(null)
  // 这个引用保存拖动起点，避免每次移动都触发无意义状态。
  const dragState = useRef<LyricDragState | null>(null)

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

  useEffect(() => {
    // 这里初始化歌词签到右侧贴边位置，并在窗口变化时保持在可见区域。
    function resetDockPosition() {
      setDockPosition((current) => {
        const next = current.ready ? current : { x: window.innerWidth - 34, y: Math.round(window.innerHeight * 0.48), ready: true }
        return snapDockPosition(next)
      })
    }

    resetDockPosition()
    window.addEventListener('resize', resetDockPosition)

    return () => window.removeEventListener('resize', resetDockPosition)
  }, [])

  // 这个函数打开播放器控制台，入参为空，返回值为空。
  function openPlayerModal() {
    setHasOpened(true)
    setAutoplayPromptHandled(true)
    setAutoplayPromptOpen(false)
    setModalOpen(true)
  }

  // 这个函数从全屏提示层直接启动音乐，入参为空，返回值为空。
  function startMusicFromPrompt() {
    setHasOpened(true)
    setAutoplayPromptHandled(true)
    setAutoplayPromptOpen(false)
  }

  // 这个函数关闭播放器控制台，入参为空，返回值为空。
  function closePlayerModal() {
    setModalOpen(false)
  }

  // 这个函数清理长按计时器，入参为空，返回值为空。
  function clearLongPressTimer() {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  // 这个函数处理歌词签按下事件，入参是指针事件，返回值为空。
  function handleDockPointerDown(event: PointerEvent<HTMLButtonElement>) {
    try {
      // 这里锁定当前指针，避免长按拖动时手指移出按钮后丢失事件。
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // 少数浏览器可能不允许锁定指针，忽略后仍可继续普通点击。
    }

    clearLongPressTimer()
    dragState.current = {
      dragging: false,
      startX: event.clientX,
      startY: event.clientY,
      originX: dockPosition.ready ? dockPosition.x : window.innerWidth - 34,
      originY: dockPosition.ready ? dockPosition.y : Math.round(window.innerHeight * 0.48)
    }

    // 这里只有长按后才进入拖动，普通点击会打开控制台。
    longPressTimer.current = window.setTimeout(() => {
      if (dragState.current) {
        dragState.current.dragging = true
        setDraggingDock(true)
      }
    }, 420)
  }

  // 这个函数处理歌词签移动事件，入参是指针事件，返回值为空。
  function handleDockPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const currentDrag = dragState.current

    if (!currentDrag) {
      return
    }

    const moveX = event.clientX - currentDrag.startX
    const moveY = event.clientY - currentDrag.startY

    // 这里短距离滑动仍视为点击，避免误拖。
    if (!currentDrag.dragging && Math.abs(moveX) + Math.abs(moveY) > 12) {
      clearLongPressTimer()
    }

    if (!currentDrag.dragging) {
      return
    }

    setDockPosition({
      x: clampValue(currentDrag.originX + moveX, 34, Math.max(window.innerWidth - 34, 34)),
      y: clampValue(currentDrag.originY + moveY, 92, Math.max(window.innerHeight - 92, 92)),
      ready: true
    })
  }

  // 这个函数处理歌词签松开事件，入参是指针事件，返回值为空。
  function handleDockPointerUp(event: PointerEvent<HTMLButtonElement>) {
    try {
      // 这里释放指针锁定，避免拖动结束后继续占用后续触控。
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    } catch {
      // 指针已被浏览器自动释放时不需要额外处理。
    }

    clearLongPressTimer()
    const wasDragging = Boolean(dragState.current?.dragging)
    dragState.current = null
    setDraggingDock(false)

    if (wasDragging) {
      setDockPosition((current) => snapDockPosition(current))
      return
    }

    openPlayerModal()
  }

  // 这个函数处理拖动取消，入参为空，返回值为空。
  function handleDockPointerCancel() {
    clearLongPressTimer()
    dragState.current = null
    setDraggingDock(false)
    setDockPosition((current) => snapDockPosition(current))
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
      <aside className="public-music-dock" aria-label="前台音乐歌词入口">
        <button
          className={`public-music-dock__lyric ${draggingDock ? 'is-dragging' : ''}`}
          onPointerCancel={handleDockPointerCancel}
          onPointerDown={handleDockPointerDown}
          onPointerMove={handleDockPointerMove}
          onPointerUp={handleDockPointerUp}
          style={
            {
              '--dock-x': `${dockPosition.x}px`,
              '--dock-y': `${dockPosition.y}px`,
              opacity: dockPosition.ready ? 1 : 0
            } as CSSProperties
          }
          type="button"
        >
          <span className="public-music-dock__text">{currentLine}</span>
        </button>
      </aside>
      {autoplayPromptOpen ? (
        <button className="public-music-ready" onClick={startMusicFromPrompt} type="button">
          <span>音乐已经备好，点击任意位置开始。</span>
        </button>
      ) : null}
      {hasOpened ? (
        <div className={`public-music-console ${modalOpen ? 'is-open' : ''}`} role="dialog" aria-hidden={!modalOpen} aria-modal="true" aria-labelledby="music-modal-title">
          <button aria-label="关闭音乐播放器" className="public-music-console__shade" onClick={closePlayerModal} type="button" />
          <section className="public-music-console__panel">
            <div className="public-music-console__head">
              <div>
                <span>问云山门歌单</span>
                <h2 id="music-modal-title">{setting.title}</h2>
              </div>
              <button onClick={closePlayerModal} type="button">
                收起
              </button>
            </div>
            <p>{currentLine}</p>
            <div className="public-music-console__frame">
              <iframe title="网易云音乐歌单播放器" src={playerUrl} loading="lazy" allow="autoplay; encrypted-media" />
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
