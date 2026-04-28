import { Save } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { fetchMyProfile, updateMyProfile } from '../../lib/services'
import type { ProfileUpdateInput } from '../../lib/types'

// 这个常量保存资料表单初始值，返回值用于页面加载前兜底。
const initialForm: ProfileUpdateInput = {
  nickname: '',
  avatar_url: '',
  city: '',
  bio: '',
  is_public: false
}

// 这个函数渲染我的资料页，入参为空，返回值是用户可编辑资料表单。
export function YardProfilePage() {
  // 这个状态保存资料表单。
  const [form, setForm] = useState<ProfileUpdateInput>(initialForm)
  // 这个状态保存是否正在保存。
  const [saving, setSaving] = useState(false)
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  useEffect(() => {
    // 这个函数读取个人资料，入参为空，返回值为空。
    async function loadProfile() {
      const result = await fetchMyProfile()

      setForm({
        nickname: result.data.nickname,
        avatar_url: result.data.avatar_url ?? '',
        city: result.data.city ?? '',
        bio: result.data.bio ?? '',
        is_public: result.data.is_public
      })

      if (!result.ok) {
        setNotice({ type: 'error', title: '读取失败', message: result.message })
      } else if (result.demoMode) {
        setNotice({ type: 'info', title: '演示模式提示', message: result.message })
      }
    }

    void loadProfile()
  }, [])

  // 这个函数更新文字字段，入参是字段名和值，返回值为空。
  function updateField(field: keyof ProfileUpdateInput, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数保存个人资料，入参是表单事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.nickname.trim()) {
      setNotice({ type: 'error', title: '资料还不能保存', message: '请填写昵称。' })
      return
    }

    try {
      setSaving(true)
      const result = await updateMyProfile(form)
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '资料已保存' : '保存失败',
        message: result.message
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <SectionTitle eyebrow="我的资料" title="小院名片，自己掌灯">
        这里可编辑昵称、城市、简介和头像地址。身份与权限由山门后台管理，普通同门不能自行修改。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <ScrollPanel className="mt-8">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">昵称 *</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('nickname', event.target.value)}
                value={form.nickname}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">所在城市</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('city', event.target.value)}
                placeholder="例如：杭州"
                value={form.city}
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">头像地址</span>
            <input
              className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateField('avatar_url', event.target.value)}
              placeholder="可填写图片链接"
              value={form.avatar_url}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">小院自述</span>
            <textarea
              className="min-h-32 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateField('bio', event.target.value)}
              placeholder="写一点你想让同门知道的话。"
              value={form.bio}
            />
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-[#c9a45c]/35 bg-white/60 p-4">
            <input
              checked={form.is_public}
              className="mt-1 h-4 w-4"
              onChange={(event) => updateField('is_public', event.target.checked)}
              type="checkbox"
            />
            <span className="text-sm leading-7 text-[#526461]">允许公开展示我的资料。公开资料只包含昵称、城市、简介和头像，不包含邮箱。</span>
          </label>

          <CloudButton disabled={saving} type="submit" variant="seal">
            {saving ? '正在保存...' : '保存资料'}
            <Save className="h-4 w-4" />
          </CloudButton>
        </form>
      </ScrollPanel>
    </div>
  )
}
