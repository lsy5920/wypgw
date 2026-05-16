// 这个文件是 Supabase Edge Function，用于服务端读取网易云歌单第一首歌的真实歌词。
// 前端浏览器直接访问网易云歌词接口会被跨域限制，所以这里用服务端中转后返回干净歌词行。

// 这个接口描述前端调用函数时传入的数据。
interface NeteaseLyricsRequest {
  // 网易云歌单编号，优先使用这个字段读取歌单第一首歌。
  playlistId?: string
  // 网易云歌曲编号，传入后可直接读取指定歌曲歌词。
  songId?: string
}

// 这个接口描述网易云歌单里的歌曲条目。
interface NeteaseTrack {
  // 歌曲编号。
  id?: number | string
  // 歌曲名称。
  name?: string
}

// 这个常量保存跨域响应头，允许前台网页安全调用这个函数。
const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS'
}

// 这个函数把对象转成 JSON 响应，入参是内容和状态码，返回值是 HTTP 响应。
function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'content-type': 'application/json; charset=utf-8'
    }
  })
}

// 这个函数检查编号是否为纯数字，入参是待检查文本，返回值是清理后的编号。
function normalizeNumericId(value: unknown): string {
  const text = String(value ?? '').trim()
  return /^\d+$/.test(text) ? text : ''
}

// 这个函数请求网易云公开接口，入参是接口地址，返回值是解析后的 JSON。
async function fetchNeteaseJson(url: string): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    headers: {
      // 这里模拟普通浏览器请求，降低网易云接口拒绝服务端请求的概率。
      'user-agent': 'Mozilla/5.0 WenyunpaiOfficialSite/1.0',
      referer: 'https://music.163.com/'
    }
  })

  if (!response.ok) {
    throw new Error(`网易云接口返回异常：${response.status}`)
  }

  return (await response.json()) as Record<string, unknown>
}

// 这个函数从歌单接口结果中取第一首歌，入参是歌单编号，返回值是歌曲编号和歌曲名。
async function loadFirstTrack(playlistId: string): Promise<{ songId: string; songName: string }> {
  const playlistJson = await fetchNeteaseJson(`https://music.163.com/api/playlist/detail?id=${encodeURIComponent(playlistId)}`)
  const result = playlistJson.result as { tracks?: NeteaseTrack[]; trackIds?: NeteaseTrack[] } | undefined
  const firstTrack = result?.tracks?.[0] ?? result?.trackIds?.[0]
  const songId = normalizeNumericId(firstTrack?.id)

  if (!songId) {
    throw new Error('没有从网易云歌单中找到可读取歌词的歌曲。')
  }

  return {
    songId,
    songName: String(firstTrack?.name ?? '网易云歌单')
  }
}

// 这个函数判断歌词行是否为制作信息，入参是去掉时间戳后的文本，返回值表示是否应该隐藏。
function isCreditLine(line: string): boolean {
  return /^(作词|作曲|编曲|制作人|监制|出品|发行|录音|混音|母带|和声|吉他|贝斯|鼓|键盘|OP|SP|企划|统筹|版权|未经著作权人)/i.test(line)
}

// 这个函数把 LRC 歌词整理成普通文本行，入参是原始 LRC 文本，返回值是干净歌词数组。
function parseLyricLines(lyric: string): string[] {
  return lyric
    .split(/\n+/)
    .map((item) => item.replace(/\[[^\]]+\]/g, '').trim())
    .filter((item) => item.length > 0 && !isCreditLine(item))
    .slice(0, 80)
}

// 这个函数读取指定歌曲歌词，入参是歌曲编号，返回值是干净歌词数组。
async function loadSongLyrics(songId: string): Promise<string[]> {
  const lyricJson = await fetchNeteaseJson(`https://music.163.com/api/song/lyric?id=${encodeURIComponent(songId)}&lv=1&kv=1&tv=-1`)
  const lrc = lyricJson.lrc as { lyric?: string } | undefined
  const lines = parseLyricLines(String(lrc?.lyric ?? ''))

  if (lines.length === 0) {
    throw new Error('这首歌暂时没有可展示的歌词。')
  }

  return lines
}

// 这个函数处理真实歌词读取请求，入参是 HTTP 请求，返回值是歌词 JSON 响应。
Deno.serve(async (request) => {
  try {
    // 这里响应浏览器的预检请求，保证前端可以正常 POST。
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    // 这里只接受 POST，避免误打开函数地址触发外部请求。
    if (request.method !== 'POST') {
      return jsonResponse({ ok: false, message: '只允许 POST 请求。' }, 405)
    }

    const body = (await request.json()) as NeteaseLyricsRequest
    const playlistId = normalizeNumericId(body.playlistId)
    let songId = normalizeNumericId(body.songId)
    let songName = ''

    if (!songId) {
      if (!playlistId) {
        return jsonResponse({ ok: false, message: '缺少网易云歌单编号或歌曲编号。' }, 400)
      }

      const track = await loadFirstTrack(playlistId)
      songId = track.songId
      songName = track.songName
    }

    const lines = await loadSongLyrics(songId)

    return jsonResponse({
      ok: true,
      message: '真实歌词已读取。',
      songId,
      songName,
      lines
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '读取网易云歌词失败。'
    return jsonResponse({ ok: false, message, lines: [] }, 500)
  }
})
