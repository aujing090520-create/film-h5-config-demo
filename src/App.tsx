import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clipboard,
  Copy,
  Film,
  GripVertical,
  Image,
  Languages,
  Menu,
  MoreHorizontal,
  Plus,
  QrCode,
  Search,
  Settings2,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import './App.css'

type ModuleKind =
  | 'hero'
  | 'info'
  | 'cast'
  | 'clips'
  | 'poll'
  | 'ranking'
  | 'banner'
  | 'topic'
  | 'posts'
  | 'voice'
  | 'live'

type Language =
  | 'English'
  | 'Chinese'
  | 'Chinese_yy'
  | 'Thai'
  | 'Japanese'
  | 'Korean'
  | 'Spanish'
  | 'Portuguese'
  | 'French'
  | 'Italian'
  | 'Russian'
  | 'German'
  | 'Arabic'
  | 'Catalan'
  | 'Danish'
  | 'Esperanto'
  | 'Persian'
  | 'Indonesian'
  | 'Turkish'
  | 'Vietnamese'
  | 'Dutch'
  | 'Swedish'
  | 'Norwegian'
  | 'Polish'
  | 'Hindi'
  | 'Cantonese'

type InfoTag = {
  id: string
  text: string
  row: number
  position: number
  color: string
  fontSize: number
}

type PollOption = {
  label: string
  image: string
}

type CheckinPoster = {
  date: string
  image: string
}

type ModuleConfig = {
  name?: string
  intro?: string
  question?: string
  cta?: string
  status?: string
  items?: string
  tasks?: string
  metadata?: string
  infoTags?: InfoTag[]
  schedule?: string
  helper?: string
  body?: string
  pollOptions?: PollOption[]
  checkinTitle?: string
  checkinHint?: string
  checkinPosters?: CheckinPoster[]
  aggregateTitle?: string
  moreLabel?: string
  moreLink?: string
  secondaryCta?: string
  secondaryCtaLink?: string
  ctaLink?: string
  links?: string
}

type DisplayField = keyof ModuleConfig | 'title' | 'subtitle'
type TextConfigKey = Exclude<keyof ModuleConfig, 'infoTags' | 'pollOptions' | 'checkinPosters'>
type StyleField = DisplayField | `structured:${string}:${number}`

type ContentStyle = {
  backgroundColor: string
  textColors: Partial<Record<StyleField, string>>
  fontSizes: Partial<Record<StyleField, number>>
}

type LocalizedContent = {
  title: string
  subtitle: string
  background: string
  config: ModuleConfig
  style?: ContentStyle
  images?: Record<string, string>
}

type PageModule = {
  id: string
  kind: ModuleKind
  label: string
  fr: string
  displayIndex: string
  titleColor: string
  enabled: boolean
  style: ContentStyle
  content: Record<Language, LocalizedContent>
}

type ModuleDefinition = Pick<PageModule, 'label' | 'fr' | 'displayIndex'> & {
  content: LocalizedContent
  english: LocalizedContent
}

const defaultContentStyle: ContentStyle = { backgroundColor: '#fffdf9', textColors: {}, fontSizes: {} }

const calculatedHeat = (index: number, language: Language) => {
  const value = Math.max(57000, 248000 - index * 18500)
  const isChinese = language === 'Chinese' || language === 'Chinese_yy' || language === 'Cantonese'
  return isChinese ? `${(value / 10000).toFixed(1)}万` : `${Math.round(value / 1000)}K`
}

const createInfoTags = (prefix: string, tags: Array<[string, number, number, string, number]>): InfoTag[] => tags.map(([text, row, position, color, fontSize], index) => ({ id: `${prefix}-${index + 1}`, text, row, position, color, fontSize }))
type LegacyInfoValues = { score?: string; rankingText?: string; viewCount?: string; schedule?: string; helper?: string }
const defaultInfoTags = (language: Language, legacy: LegacyInfoValues = {}) => {
  const isChinese = language === 'Chinese' || language === 'Chinese_yy' || language === 'Cantonese'
  return createInfoTags(`${language}-info`, isChinese
    ? [[legacy.score ?? '9.2', 1, 1, '#de4f48', 16], [legacy.rankingText ?? 'NO.2 热播剧', 1, 2, '#8a736a', 10], [legacy.viewCount ?? '观看量 126.3万', 1, 3, '#8a736a', 10], [legacy.schedule ?? '古装 · 爱情 · 权谋', 2, 1, '#8a736a', 10], [legacy.helper ?? '2026/08/09 · 共 40 集 · 每周更新', 3, 1, '#8a736a', 10]]
    : [[legacy.score ?? '9.2', 1, 1, '#de4f48', 16], [legacy.rankingText ?? 'No.2 trending drama', 1, 2, '#8a736a', 10], [legacy.viewCount ?? '1.263M views', 1, 3, '#8a736a', 10], [legacy.schedule ?? 'Historical · Romance · Intrigue', 2, 1, '#8a736a', 10], [legacy.helper ?? 'Aug 9, 2026 · 40 episodes · Weekly updates', 3, 1, '#8a736a', 10]])
}

const imageSlots: Record<ModuleKind, { key: string; label: string }[]> = {
  hero: [{ key: 'hero', label: '头图主视觉' }],
  info: [{ key: 'poster', label: '剧集海报' }],
  cast: ['演员 1', '演员 2', '演员 3', '演员 4'].map((label, index) => ({ key: `cast-${index + 1}`, label })),
  clips: ['切片 1', '切片 2', '切片 3'].map((label, index) => ({ key: `clip-${index + 1}`, label })),
  poll: [],
  ranking: ['榜单角色 1', '榜单角色 2', '榜单角色 3'].map((label, index) => ({ key: `rank-${index + 1}`, label })),
  banner: [{ key: 'banner', label: 'Banner 图' }],
  topic: ['话题 1', '话题 2', '话题 3'].map((label, index) => ({ key: `topic-${index + 1}`, label })),
  posts: ['帖文 1', '帖文 2'].map((label, index) => ({ key: `post-${index + 1}`, label })),
  voice: [],
  live: ['直播 1', '直播 2'].map((label, index) => ({ key: `live-${index + 1}`, label })),
}

const defaultModuleImages: Record<ModuleKind, Record<string, string>> = {
  hero: { hero: '/film-assets/hero-keyart.png' },
  info: { poster: '/film-assets/series-poster.png' },
  cast: Object.fromEntries([1, 2, 3, 4].map((index) => [`cast-${index}`, `/film-assets/cast-${index}.png`])),
  clips: Object.fromEntries([1, 2, 3].map((index) => [`clip-${index}`, `/film-assets/clip-${index}.png`])),
  poll: {},
  ranking: Object.fromEntries([1, 2, 3].flatMap((index) => [[`rank-${index}`, `/film-assets/rank-${index}.png`], [`rank-task-${index}`, `/film-assets/rank-${index}.png`]])),
  banner: { banner: '/film-assets/hero-keyart.png' },
  topic: Object.fromEntries([1, 2, 3].map((index) => [`topic-${index}`, `/film-assets/topic-${index}.png`])),
  posts: Object.fromEntries([1, 2].map((index) => [`post-${index}`, `/film-assets/post-${index}.png`])),
  voice: {},
  live: Object.fromEntries([1, 2].map((index) => [`live-${index}`, `/film-assets/live-${index}.png`])),
}

const moduleDefinitions: Record<ModuleKind, ModuleDefinition> = {
  hero: { label: '头图', fr: 'FR-01', displayIndex: '', content: { title: '', subtitle: '', background: '', config: { name: '长安花笺', cta: '立即签到', metadata: '8月9日看', schedule: '正在热播 · 2026', checkinTitle: '长安花笺签到日历', checkinHint: '连续签到，解锁限定海报', checkinPosters: [{ date: '09', image: '/film-assets/clip-1.png' }, { date: '10', image: '/film-assets/clip-2.png' }, { date: '14', image: '/film-assets/clip-3.png' }] } }, english: { title: '', subtitle: '', background: '', config: { name: "Letters of Chang'an", cta: 'Check in', metadata: 'Premiering Aug 9', schedule: 'Now streaming · 2026', checkinTitle: 'Letters of Chang’an calendar', checkinHint: 'Check in to unlock limited posters', checkinPosters: [{ date: '09', image: '/film-assets/clip-1.png' }, { date: '10', image: '/film-assets/clip-2.png' }, { date: '14', image: '/film-assets/clip-3.png' }] } } },
  info: { label: '影视信息区', fr: 'FR-02', displayIndex: '01', content: { title: '剧情简介', subtitle: '', background: '', config: { name: '长安花笺', intro: '出身书香门第的花笺为守护家族与心中正义，卷入朝堂纷争。', infoTags: defaultInfoTags('Chinese') } }, english: { title: 'About the series', subtitle: '', background: '', config: { name: 'Letters of Chang’an', intro: 'Hua Jian is drawn into court intrigue as she protects her family and the justice she believes in.', infoTags: defaultInfoTags('English') } } },
  cast: { label: '演员区', fr: 'FR-03', displayIndex: '02', content: { title: '演员区', subtitle: '', background: '', config: { items: '洛瑶｜饰 宁安\n沈砚舟｜饰 李承槐\n许清晏｜饰 谢长宁\n温言｜饰 南宫月' } }, english: { title: 'Cast', subtitle: '', background: '', config: { items: 'Luo Yao｜as Ning An\nShen Yanzhou｜as Li Chenghuai\nXu Qingyan｜as Xie Changning\nWen Yan｜as Nangong Yue' } } },
  clips: { label: '剧情切片工厂', fr: 'FR-04', displayIndex: '03', content: { title: '剧情切片工厂', subtitle: '', background: '', config: { items: '雨夜执伞\n花笺密令\n初见如故', links: 'https://www.hellotalk.com/moments/985112\nhttps://www.hellotalk.com/moments/985113\nhttps://www.hellotalk.com/moments/985114' } }, english: { title: 'Scene clips', subtitle: '', background: '', config: { items: 'An umbrella in the rain\nThe secret letter\nLove at first sight', links: 'https://www.hellotalk.com/moments/985112\nhttps://www.hellotalk.com/moments/985113\nhttps://www.hellotalk.com/moments/985114' } } },
  poll: { label: '阵营选择', fr: 'FR-05', displayIndex: '04', content: { title: '阵营选择', subtitle: '', background: '', config: { question: '你更期待谁先揭开花笺密令？', pollOptions: [{ label: '沈砚舟', image: '/film-assets/rank-2.png' }, { label: '洛瑶', image: '/film-assets/rank-1.png' }], helper: '截止 2026/09/20 · 12.8 万人参与' } }, english: { title: 'Choose a side', subtitle: '', background: '', config: { question: 'Who do you want to uncover the secret letter first?', pollOptions: [{ label: 'Shen Yanzhou', image: '/film-assets/rank-2.png' }, { label: 'Luo Yao', image: '/film-assets/rank-1.png' }], helper: 'Ends Sep 20, 2026 · 128K joined' } } },
  ranking: { label: '排行榜', fr: 'FR-06', displayIndex: '05', content: { title: '人气榜', subtitle: '实时 08.20', background: '', config: { items: '洛瑶｜饰 宁安｜长安花笺\n沈砚舟｜饰 李承槐｜长安花笺\n许清晏｜饰 谢长宁｜长安花笺', tasks: 'task-1｜每日签到｜+20｜\ntask-2｜带 #沈砚舟# 发帖｜+50｜https://www.hellotalk.com/moments\ntask-3｜去演员圈讨论｜+30｜https://www.hellotalk.com/moments\ntask-4｜去剧圈讨论｜+30｜https://www.hellotalk.com/moments', aggregateTitle: '完整人气榜', moreLabel: '查看完整榜单' } }, english: { title: 'Popularity ranking', subtitle: 'Live · Aug 20', background: '', config: { items: 'Luo Yao｜as Ning An｜Letters of Chang’an\nShen Yanzhou｜as Li Chenghuai｜Letters of Chang’an\nXu Qingyan｜as Xie Changning｜Letters of Chang’an', tasks: 'task-1｜Daily check-in｜+20｜\ntask-2｜Post with #ShenYanzhou#｜+50｜https://www.hellotalk.com/moments\ntask-3｜Discuss in the cast circle｜+30｜https://www.hellotalk.com/moments\ntask-4｜Discuss in the series circle｜+30｜https://www.hellotalk.com/moments', aggregateTitle: 'Full popularity ranking', moreLabel: 'View full ranking' } } },
  banner: { label: 'Banner 广告跳转区', fr: 'FR-10', displayIndex: '', content: { title: '', subtitle: '', background: '', config: {} }, english: { title: '', subtitle: '', background: '', config: {} } },
  topic: { label: '话题区发帖（已有）', fr: 'FR-11', displayIndex: '', content: { title: '热门话题', subtitle: '', background: '', config: { items: '#长安花笺#｜此刻正在讨论这场雨夜初见\n#沈砚舟#｜和剧友聊聊你的角色选择\n#花笺密令#｜和剧友聊聊你的角色选择' } }, english: { title: 'Trending topics', subtitle: '', background: '', config: { items: '#LettersOfChangan#｜Talk about their first meeting in the rain\n#ShenYanzhou#｜Share your character choice with fans\n#SecretLetter#｜Talk with fans about the series' } } },
  posts: { label: '最佳帖文（已有）', fr: 'FR-12', displayIndex: '', content: { title: '最佳帖文', subtitle: '', background: '', config: { items: '花灯下的心动瞬间\n花灯亮起的那一刻，突然理解了他们的选择。' } }, english: { title: 'Best posts', subtitle: '', background: '', config: { items: 'A heartbeat under lanterns\nWhen the lanterns lit up, I finally understood their choice.' } } },
  voice: { label: '语聊区（已有）', fr: 'FR-13', displayIndex: '', content: { title: '正在语聊', subtitle: '', background: '', config: { items: '长安夜话：猜猜谁是密令主人\n花笺剧情推理局' } }, english: { title: 'Voice rooms', subtitle: '', background: '', config: { items: 'Night talk in Chang’an: who owns the letter?\nThe secret-letter plot club' } } },
  live: { label: '直播区（已有）', fr: 'FR-14', displayIndex: '', content: { title: '正在直播', subtitle: '', background: '', config: { items: '长安花笺 主创见面会\n演员在线聊幕后' } }, english: { title: 'Live now', subtitle: '', background: '', config: { items: 'Letters of Chang’an cast meet-up\nCast talks about the scenes' } } },
}

moduleDefinitions.ranking.content.config.cta = '捧场'
moduleDefinitions.ranking.english.config.cta = 'Support'
moduleDefinitions.topic.content.config.cta = '去发布'
moduleDefinitions.topic.content.config.secondaryCta = '查看'
moduleDefinitions.topic.english.config.cta = 'Post'
moduleDefinitions.topic.english.config.secondaryCta = 'View'
moduleDefinitions.topic.content.config.ctaLink = 'https://www.hellotalk.com/topic/changan/post'
moduleDefinitions.topic.english.config.ctaLink = 'https://www.hellotalk.com/topic/changan/post'
moduleDefinitions.topic.content.config.secondaryCtaLink = 'https://www.hellotalk.com/topic/changan'
moduleDefinitions.topic.english.config.secondaryCtaLink = 'https://www.hellotalk.com/topic/changan'
moduleDefinitions.banner.content.config.ctaLink = 'https://www.hellotalk.com/tv'
moduleDefinitions.banner.english.config.ctaLink = 'https://www.hellotalk.com/tv'
moduleDefinitions.voice.content.config.status = '语聊'
moduleDefinitions.voice.english.config.status = 'Voice'
moduleDefinitions.live.content.config.status = 'LIVE'
moduleDefinitions.live.english.config.status = 'LIVE'
moduleDefinitions.voice.content.config.helper = '38 人正在语聊\n26 人正在语聊'
moduleDefinitions.voice.english.config.helper = '38 people talking\n26 people talking'
moduleDefinitions.live.content.config.helper = '09/21 21:00\n08/20 16:00'
moduleDefinitions.live.english.config.helper = '09/21 21:00\n08/20 16:00'

const initialModules: PageModule[] = (Object.keys(moduleDefinitions) as ModuleKind[]).map((kind, index) => ({
  id: `module-${index + 1}`,
  kind,
  label: moduleDefinitions[kind].label,
  fr: moduleDefinitions[kind].fr,
  displayIndex: moduleDefinitions[kind].displayIndex,
  titleColor: '#1f2329',
  enabled: true,
  style: { ...defaultContentStyle, textColors: {}, fontSizes: {} },
  content: {
    English: { ...moduleDefinitions[kind].english, background: '', images: { ...defaultModuleImages[kind] }, config: { ...moduleDefinitions[kind].english.config }, style: { ...defaultContentStyle, textColors: {}, fontSizes: {} } },
    Chinese: { ...moduleDefinitions[kind].content, background: '', images: { ...defaultModuleImages[kind] }, config: { ...moduleDefinitions[kind].content.config }, style: { ...defaultContentStyle, textColors: {}, fontSizes: {} } },
  } as Record<Language, LocalizedContent>,
}))

type PreviewState = {
  voted: boolean
  vote: string
  rankingOpen: boolean
  rankingName: string
  rankingHeat: string
  rankingImage: string
  rankingTaskBackground: string
  screen: '' | 'cast' | 'clips' | 'ranking' | 'checkin'
}

type PreviewFocus = {
  moduleId: string
  language: Language
  field: StyleField | 'background' | 'displayIndex' | `image:${string}` | `tag:${string}`
}

const languageLabels: Record<Language, string> = {
  English: 'English',
  Chinese: 'Chinese',
  Chinese_yy: 'Chinese_yy',
  Thai: 'Thai',
  Japanese: 'Japanese',
  Korean: 'Korean',
  Spanish: 'Spanish',
  Portuguese: 'Portuguese',
  French: 'French',
  Italian: 'Italian',
  Russian: 'Russian',
  German: 'German',
  Arabic: 'Arabic',
  Catalan: 'Catalan',
  Danish: 'Danish',
  Esperanto: 'Esperanto',
  Persian: 'Persian',
  Indonesian: 'Indonesian',
  Turkish: 'Turkish',
  Vietnamese: 'Vietnamese',
  Dutch: 'Dutch',
  Swedish: 'Swedish',
  Norwegian: 'Norwegian',
  Polish: 'Polish',
  Hindi: 'Hindi',
  Cantonese: 'Cantonese',
}

const allLanguages = Object.keys(languageLabels) as Language[]

function App() {
  const [view, setView] = useState<'list' | 'editor'>('list')
  const [tab, setTab] = useState<'basic' | 'modules' | 'advanced'>('modules')
  const [modules, setModules] = useState(initialModules)
  const [selectedId, setSelectedId] = useState(initialModules[3].id)
  const [contentLanguages, setContentLanguages] = useState<Language[]>(['Chinese'])
  const [previewLanguage, setPreviewLanguage] = useState<Language>('Chinese')
  const [previewFocus, setPreviewFocus] = useState<PreviewFocus | null>(null)
  const [showLibrary, setShowLibrary] = useState(false)
  const [showLanguageDialog, setShowLanguageDialog] = useState(false)
  const [pendingLanguages, setPendingLanguages] = useState<Language[]>(['Chinese'])
  const [toast, setToast] = useState('')
  const [review, setReview] = useState(false)
  const generatedModuleId = useRef(0)
  const [previewState, setPreviewState] = useState<PreviewState>({
    voted: false,
    vote: 'a',
    rankingOpen: false,
    rankingName: '',
    rankingHeat: '',
    rankingImage: '',
    rankingTaskBackground: '',
    screen: '',
  })

  const selected = modules.find((item) => item.id === selectedId) ?? modules[0]
  const enabledModules = useMemo(() => modules.filter((item) => item.enabled), [modules])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setModules((items) => {
        let changed = false
        const migrated = items.map((item) => {
          if (item.kind !== 'info') return item
          const content = { ...item.content }
          ;(Object.keys(content) as Language[]).forEach((language) => {
            const localized = content[language]
            if (localized.config.infoTags?.length) return
            changed = true
            content[language] = {
              ...localized,
              config: { ...localized.config, infoTags: defaultInfoTags(language, localized.config as LegacyInfoValues) },
            }
          })
          return changed ? { ...item, content } : item
        })
        return changed ? migrated : items
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const flash = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 1800)
  }

  const updateModule = (patch: Partial<Omit<PageModule, 'content'>>) => {
    setModules((items) => items.map((item) => (item.id === selectedId ? { ...item, ...patch } : item)))
  }

  const nextModuleId = (kind: ModuleKind) => {
    generatedModuleId.current += 1
    return `${kind}-${generatedModuleId.current}`
  }

  const updateContent = (language: Language, patch: Partial<LocalizedContent>) => {
    setModules((items) =>
      items.map((item) => (item.id === selectedId
        ? { ...item, content: { ...item.content, [language]: { ...item.content[language], ...patch } } }
        : item)),
    )
  }

  const replaceContent = (content: PageModule['content']) => {
    setModules((items) => items.map((item) => (item.id === selectedId ? { ...item, content } : item)))
  }

  const updateConfig = (language: Language, key: keyof ModuleConfig, value: string) => {
    setModules((items) =>
      items.map((item) => (item.id === selectedId
        ? {
            ...item,
            content: {
              ...item.content,
              [language]: {
                ...item.content[language],
                config: { ...item.content[language].config, [key]: value },
              },
            },
          }
        : item)),
    )
  }

  const focusPreviewField = (language: Language, field: PreviewFocus['field']) => {
    setPreviewLanguage(language)
    setPreviewFocus({ moduleId: selectedId, language, field })
  }

  const moveModule = (direction: -1 | 1) => {
    const index = modules.findIndex((item) => item.id === selectedId)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= modules.length) return
    const next = [...modules]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    setModules(next)
  }

  const duplicateModule = () => {
    const index = modules.findIndex((item) => item.id === selectedId)
    const copy = {
      ...selected,
      id: nextModuleId(selected.kind),
      label: `${selected.label} 副本`,
      content: Object.fromEntries(contentLanguages.map((language) => [language, {
        ...selected.content[language],
        config: { ...selected.content[language].config },
      }])) as Record<Language, LocalizedContent>,
    }
    const next = [...modules]
    next.splice(index + 1, 0, copy)
    setModules(next)
    setSelectedId(copy.id)
    flash('模块已复制')
  }

  const deleteModule = () => {
    if (modules.length === 1) return
    const index = modules.findIndex((item) => item.id === selectedId)
    const next = modules.filter((item) => item.id !== selectedId)
    setModules(next)
    setSelectedId(next[Math.max(0, index - 1)].id)
    flash('模块已删除')
  }

  const addModule = (kind: ModuleKind) => {
    const definition = moduleDefinitions[kind]
    const item: PageModule = {
      id: nextModuleId(kind),
      kind,
      label: definition.label,
      fr: definition.fr,
      displayIndex: definition.displayIndex,
      titleColor: '#1f2329',
      enabled: true,
      style: { ...defaultContentStyle, textColors: {}, fontSizes: {} },
      content: Object.fromEntries(contentLanguages.map((language) => [language, {
        ...(language === 'English' ? definition.english : definition.content),
        background: '',
        images: { ...defaultModuleImages[kind] },
        config: { ...(language === 'English' ? definition.english.config : definition.content.config) },
        style: { ...defaultContentStyle, textColors: {}, fontSizes: {} },
      }])) as Record<Language, LocalizedContent>,
    }
    const index = modules.findIndex((module) => module.id === selectedId)
    const next = [...modules]
    next.splice(index + 1, 0, item)
    setModules(next)
    setSelectedId(item.id)
    setShowLibrary(false)
  }

  const saveLanguages = () => {
    const normalized: Language[] = pendingLanguages.includes('English') ? pendingLanguages : ['English', ...pendingLanguages]
    const previous = contentLanguages
    setContentLanguages(normalized)
    setModules((items) => items.map((item) => {
      const content = { ...item.content }
      normalized.forEach((language) => {
        if (content[language]) return
        const source = content.English ?? content[previous[0]]
        content[language] = {
          ...source,
          background: '',
          images: item.kind === 'cast' ? { ...(content.Chinese?.images ?? source.images) } : {},
          style: { ...defaultContentStyle, textColors: {}, fontSizes: {} },
          config: { ...source.config },
        }
      })
      return { ...item, content }
    }))
    if (!normalized.includes(previewLanguage)) setPreviewLanguage(normalized[0])
    setShowLanguageDialog(false)
    flash('已添加内容语言')
  }

  if (view === 'list') {
    return (
      <AdminFrame review={review} setReview={setReview}>
        <ActivityList
          onCreate={() => {
            setView('editor')
            setTab('basic')
          }}
          onEdit={() => {
            setView('editor')
            setTab('modules')
          }}
          onCopy={() => flash('活动副本已创建')}
          toast={toast}
        />
      </AdminFrame>
    )
  }

  return (
    <AdminFrame review={review} setReview={setReview}>
      <main className="editor-page">
        <div className="editor-titlebar">
          <button className="icon-button subtle" onClick={() => setView('list')} aria-label="返回列表"><ArrowLeft size={20} /></button>
          <strong>编辑 H5 活动</strong>
          <span className="editor-id">ID: film-h5-changan-2026</span>
        </div>
        <div className="editor-tabs">
          <button className={tab === 'basic' ? 'active' : ''} onClick={() => setTab('basic')}>基本设置</button>
          <button className={tab === 'modules' ? 'active' : ''} onClick={() => setTab('modules')}>模块配置</button>
          <button className={tab === 'advanced' ? 'active' : ''} onClick={() => setTab('advanced')}>高级条件</button>
        </div>

        {tab === 'basic' && (
          <BasicSettings
            flash={flash}
            languages={contentLanguages}
            onManageLanguages={() => {
              setPendingLanguages(contentLanguages)
              setShowLanguageDialog(true)
            }}
          />
        )}
        {tab === 'advanced' && <AdvancedSettings flash={flash} />}
        {tab === 'modules' && (
          <section className="configuration-workbench">
            <aside className="module-rail">
              <div className="rail-heading">
                <div>
                  <strong>模块添加及顺序</strong>
                  <span>{modules.length} 个模块</span>
                </div>
                <button className="small-icon" title="模块说明"><CircleHelp size={16} /></button>
              </div>
              <div className="module-list">
                {modules.map((item, index) => (
                  <button
                    key={item.id}
                    className={`module-row ${item.id === selectedId ? 'selected' : ''} ${item.enabled ? '' : 'disabled'}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className="module-index">{String(index + 1).padStart(2, '0')}</span>
                    <GripVertical size={16} className="grip" />
                    <span className="module-name">{item.label}</span>
                    {!item.enabled && <span className="off-tag">已隐藏</span>}
                    <ChevronRight size={15} />
                  </button>
                ))}
              </div>
              <button className="primary add-module" onClick={() => setShowLibrary(!showLibrary)}><Plus size={17} /> 添加</button>
              {showLibrary && (
                <div className="module-library">
                  <div className="library-head"><span>添加模块</span><button onClick={() => setShowLibrary(false)}><X size={15} /></button></div>
                  <div className="library-grid">
                    {(Object.keys(moduleDefinitions) as ModuleKind[]).map((kind) => (
                      <button key={kind} onClick={() => addModule(kind)}>
                        <span>{moduleDefinitions[kind].fr}</span>{moduleDefinitions[kind].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            <section className="module-editor">
              <div className="module-editor-top">
                <div>
                  <span className="eyebrow">当前模块</span>
                  <h1>{selected.label}</h1>
                </div>
                <div className="module-actions">
                  <button className="control-icon" onClick={() => moveModule(-1)} title="上移"><ChevronLeft size={18} /></button>
                  <button className="control-icon" onClick={() => moveModule(1)} title="下移"><ChevronRight size={18} /></button>
                  <button className="control-icon" onClick={duplicateModule} title="复制"><Copy size={16} /></button>
                  <button className="control-icon danger" onClick={deleteModule} title="删除"><Trash2 size={16} /></button>
                </div>
              </div>
              <ModuleForm
                selected={selected}
                languages={contentLanguages}
                updateModule={updateModule}
                updateContent={updateContent}
                replaceContent={replaceContent}
                updateConfig={updateConfig}
                onFocusPreviewField={focusPreviewField}
                flash={flash}
                onAddLanguage={() => {
                  setPendingLanguages(contentLanguages)
                  setShowLanguageDialog(true)
                }}
              />
            </section>

            <section className="preview-area">
              <div className="preview-toolbar">
                <span><Film size={16} /> 用户端实时预览</span>
                <div className="preview-actions">
                  <label className="preview-language">预览语言
                    <select value={previewLanguage} onChange={(event) => setPreviewLanguage(event.target.value as Language)}>
                      {contentLanguages.map((language) => <option key={language} value={language}>{languageLabels[language]}</option>)}
                    </select>
                  </label>
                  <button className={`review-toggle ${review ? 'on' : ''}`} onClick={() => setReview(!review)}><span /> Review</button>
                </div>
              </div>
              <div className={`preview-stage ${review ? 'reviewing' : ''}`}>
                {review && <ReviewRules modules={enabledModules} selectedId={selectedId} onSelect={setSelectedId} />}
                <PhonePreview
                  modules={enabledModules}
                  language={previewLanguage}
                  selectedId={selectedId}
                  onSelectModule={(id) => { setSelectedId(id); setPreviewFocus(null) }}
                  review={review}
                  state={previewState}
                  setState={setPreviewState}
                  flash={flash}
                  focus={previewFocus}
                />
              </div>
            </section>
          </section>
        )}
        <footer className="sticky-actions">
          <button className="secondary" onClick={() => setView('list')}>取消</button>
          <button className="secondary" onClick={() => flash('草稿已暂存')}>暂存</button>
          <button className="primary" onClick={() => flash('配置已确认')}>确认</button>
        </footer>
      </main>
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
      {showLanguageDialog && (
        <LanguageDialog
          selected={pendingLanguages}
          onToggle={(language) => setPendingLanguages((items) => (items.includes(language) ? items.filter((item) => item !== language) : [...items, language]))}
          onClose={() => setShowLanguageDialog(false)}
          onConfirm={saveLanguages}
        />
      )}
    </AdminFrame>
  )
}

function AdminFrame({ children, review, setReview }: { children: React.ReactNode; review: boolean; setReview: (value: boolean) => void }) {
  return (
    <div className="admin-shell">
      <div className="admin-content">
        <header className="top-bar">
          <div className="breadcrumbs"><Menu size={19} /><span>站点管理</span><ChevronRight size={16} /><span>H5活动配置</span></div>
          <div className="top-actions">
            <button className={`top-review ${review ? 'selected' : ''}`} onClick={() => setReview(!review)}>Review</button>
            <span>测试环境</span><ChevronDown size={15} />
            <button><Search size={19} /></button><button><Languages size={18} /></button><div className="operator"><span>林</span>林凡 Frank</div>
          </div>
        </header>
        <div className="tab-strip"><span>工作台</span><strong>H5活动配置 <X size={14} /></strong></div>
        {children}
      </div>
    </div>
  )
}

function ActivityList({ onCreate, onEdit, onCopy, toast }: { onCreate: () => void; onEdit: () => void; onCopy: () => void; toast: string }) {
  const rows = [
    ['film-h5-changan-2026', '长安花笺 · 海外剧集专区', '2026-08-20 09:00:00', '2026-09-20 23:59:59', '罗凯鑫 Robert', '2026-08-20 10:20:08'],
    ['clip-share-test-001', '卡片分享测试', '2026-08-07 00:00:00', '2026-08-31 23:59:59', '罗凯鑫 Robert', '2026-08-19 16:40:38'],
    ['test-film-entry-21', 'test', '2026-08-06 10:13:31', '2026-08-08 23:59:59', '彭钰菲 Phoebe', '2026-08-06 11:55:44'],
  ]
  return (
    <main className="list-page">
      <section className="filter-panel">
        <label>ID<input placeholder="请输入" /></label>
        <label>描述<input placeholder="请输入" /></label>
        <label>页面归属<select defaultValue=""><option value="" disabled>请选择</option><option>影视专区</option></select></label>
        <label>使用场景<select defaultValue=""><option value="" disabled>请选择</option><option>活动页</option></select></label>
        <div className="filter-actions"><button className="secondary">重置</button><button className="primary">查询</button></div>
      </section>
      <section className="table-wrap">
        <div className="table-actions"><button className="secondary"><Clipboard size={15} /> 从剪贴板导入</button><button className="primary" onClick={onCreate}><Plus size={17} /> 新增</button></div>
        <table>
          <thead><tr><th>ID</th><th>描述</th><th>链接</th><th>二维码</th><th>配置状态</th><th>暂存状态</th><th>活动开始时间</th><th>活动结束时间</th><th>操作人</th><th>创建时间</th><th>更新时间</th><th>操作</th></tr></thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row[0]}>
                <td className="id-cell">{row[0]}</td><td>{row[1]}</td>
                <td className="url-cell">https://qtest.hellotalk8.com/film/changan?configId={index ? '6a7...' : 'film-h5-changan-2026'}</td>
                <td><QrCode size={20} /></td><td><span className="switch"><i /></span></td><td><span className="yes-tag">否</span></td>
                <td>{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td><td>2026-08-20<br />10:20:08</td><td>{row[5]}</td>
                <td className="row-actions"><button onClick={onEdit}>编辑</button><button onClick={onCopy}>复制</button><button onClick={() => navigator.clipboard?.writeText(`https://qtest.hellotalk8.com/film/changan`)}>剪贴板</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination"><span>共 511 条数据</span><button className="current">1</button><button>2</button><button>3</button><button>4</button><button>5</button><span>…</span><button>11</button><ChevronRight size={16} /><select defaultValue="50"><option value="50">50 条/页</option></select><span>跳至</span><input /><span>页</span></div>
      </section>
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </main>
  )
}

function BasicSettings({ flash, languages, onManageLanguages }: { flash: (value: string) => void; languages: Language[]; onManageLanguages: () => void }) {
  return (
    <section className="simple-settings">
      <h2>基本设置</h2>
      <div className="form-grid">
        <label>活动描述<input defaultValue="长安花笺 · 海外剧集专区" /></label>
        <label>页面归属<select defaultValue="影视专区"><option>影视专区</option></select></label>
        <label>使用场景<select defaultValue="H5 活动"><option>H5 活动</option></select></label>
        <label>活动开始时间<input type="datetime-local" defaultValue="2026-08-20T09:00" /></label>
        <label>活动结束时间<input type="datetime-local" defaultValue="2026-09-20T23:59" /></label>
        <label>内容语言<div className="language-summary"><span>{languages.map((language) => languageLabels[language]).join('、')}</span><button className="secondary" onClick={onManageLanguages}>管理语言</button></div></label>
      </div>
      <div className="asset-row"><Image size={20} /><div><strong>头图素材</strong><span>用户端图片与文字均在模块中按内容语言分别配置</span></div><button className="primary"><Upload size={15} /> 上传</button><button className="secondary" onClick={() => flash('已打开多语言文档配置')}>一键上传多语言文档</button></div>
    </section>
  )
}

function AdvancedSettings({ flash }: { flash: (value: string) => void }) {
  return (
    <section className="simple-settings">
      <h2>高级条件</h2>
      <div className="condition-card">
        <div><strong>目标地区</strong><span>仅对非中国区用户展示</span></div><div className="condition-tags"><span>US</span><span>JP</span><span>BR</span><span>GB</span><button><Plus size={14} /></button></div>
      </div>
      <div className="condition-card"><div><strong>登录状态</strong><span>未登录用户可浏览，互动时引导登录</span></div><span className="switch"><i /></span></div>
      <div className="condition-card"><div><strong>AB 实验</strong><span>影视专区H5实验组</span></div><button className="secondary" onClick={() => flash('高级条件已保存')}><Settings2 size={15} /> 配置</button></div>
    </section>
  )
}

function ModuleForm({ selected, languages, updateModule, updateContent, replaceContent, updateConfig, onFocusPreviewField, flash, onAddLanguage }: {
  selected: PageModule
  languages: Language[]
  updateModule: (patch: Partial<Omit<PageModule, 'content'>>) => void
  updateContent: (language: Language, patch: Partial<LocalizedContent>) => void
  replaceContent: (content: PageModule['content']) => void
  updateConfig: (language: Language, key: keyof ModuleConfig, value: string) => void
  onFocusPreviewField: (language: Language, field: PreviewFocus['field']) => void
  flash: (value: string) => void
  onAddLanguage: () => void
}) {
  const hasDisplayImage = selected.kind !== 'clips' && imageSlots[selected.kind].length > 0
  const infoTagCounter = useRef(0)
  const [openClipboardMenu, setOpenClipboardMenu] = useState<string | null>(null)
  const sourceLanguage = languages.includes('English') ? 'English' : 'Chinese'
  const usesExistingConfig = ['topic', 'posts', 'voice', 'live'].includes(selected.kind)
  if (usesExistingConfig) {
    return (
      <div className="module-form existing-config-form">
        <section className="existing-config-notice">使用目前已有的配置。</section>
      </div>
    )
  }

  const colorValue = (field: StyleField, fallback = '#1f2329') => selected.style.textColors[field] ?? fallback
  const updateTextColor = (field: StyleField, color: string) => {
    updateModule({ style: { ...selected.style, textColors: { ...selected.style.textColors, [field]: color }, fontSizes: { ...selected.style.fontSizes } } })
  }
  const updateBackgroundColor = (color: string) => {
    updateModule({ style: { ...selected.style, backgroundColor: color, textColors: { ...selected.style.textColors }, fontSizes: { ...selected.style.fontSizes } } })
  }
  const updateFontSize = (field: StyleField, value: string) => {
    const fontSizes = { ...selected.style.fontSizes }
    if (value === '') delete fontSizes[field]
    else fontSizes[field] = Math.min(48, Math.max(8, Number(value)))
    updateModule({ style: { ...selected.style, textColors: { ...selected.style.textColors }, fontSizes } })
  }
  const retranslate = (language: Language, label: string, source: string, apply: (value: string) => void) => {
    apply(source)
    onFocusPreviewField(language, label as PreviewFocus['field'])
    flash(`已使用 AI 重译${languageLabels[language]}${label}`)
  }
  const colorControl = (field: StyleField, fallback?: string) => (
    <label className="field-color" title="文字颜色">
      <input type="color" value={colorValue(field, fallback)} onChange={(event) => updateTextColor(field, event.target.value)} />
    </label>
  )
  const fontSizeControl = (field: StyleField) => (
    <label className="field-font-size" title="字号">
      <input type="number" min="8" max="48" step="1" value={selected.style.fontSizes[field] ?? ''} placeholder="字号" onChange={(event) => updateFontSize(field, event.target.value)} />
    </label>
  )
  const styledFieldLabel = (label: string, field: StyleField, required = false, fallback?: string) => (
    <div className="localized-field-label with-style-controls">
      <span>{required && <span className="required-mark">*</span>}{label}</span>
      <span className="field-style-controls">{colorControl(field, fallback)}{fontSizeControl(field)}</span>
    </div>
  )
  const copyModuleContent = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(selected.content))
      flash('已复制模块内容（含图片与文字）')
    } catch {
      flash('浏览器未授权访问剪贴板')
    }
  }
  const pasteModuleContent = async () => {
    try {
      const pasted = JSON.parse(await navigator.clipboard.readText()) as PageModule['content']
      if (!pasted || typeof pasted !== 'object') throw new Error('invalid clipboard')
      replaceContent({ ...selected.content, ...pasted })
      flash('已粘贴模块内容（含图片与文字）')
    } catch {
      flash('剪贴板中没有可用的模块配置')
    }
  }
  const localizedActions = (id: string, includeBatchUpload = false) => (
    <div className="localized-add">
      <button className="secondary" onClick={onAddLanguage}><Plus size={15} /> 追加</button>
      <div className="clipboard-menu">
        <button
          className="secondary clipboard-menu-trigger"
          aria-label="更多多语言操作"
          aria-expanded={openClipboardMenu === id}
          onClick={() => setOpenClipboardMenu(openClipboardMenu === id ? null : id)}
        ><MoreHorizontal size={17} /></button>
        {openClipboardMenu === id && <div className="clipboard-menu-popover">
          <button onClick={() => { void copyModuleContent(); setOpenClipboardMenu(null) }}><Copy size={14} /> 复制到剪贴板</button>
          <button onClick={() => { void pasteModuleContent(); setOpenClipboardMenu(null) }}><Clipboard size={14} /> 从剪贴板粘贴</button>
        </div>}
      </div>
      {includeBatchUpload && <button className="secondary"><Image size={15} /> 批量上传图片</button>}
    </div>
  )
  const updateImage = (language: Language, key: string, value: string) => {
    if (selected.kind === 'cast') {
      replaceContent(Object.fromEntries(Object.entries(selected.content).map(([contentLanguage, content]) => [contentLanguage, { ...content, images: { ...content.images, [key]: value } }])) as PageModule['content'])
      return
    }
    updateContent(language, { images: { ...selected.content[language].images, [key]: value } })
  }
  const imageRow = (language: Language, slot: { key: string; label: string }, shared = false) => (
    <div className="localized-row image-row" key={`${language}-${slot.key}`}>
      <select value={language} disabled><option>{shared ? `所有语言 · ${slot.label}` : `${languageLabels[language]} · ${slot.label}`}</option></select>
      <input value={selected.content[language].images?.[slot.key] ?? ''} onFocus={() => onFocusPreviewField(language, `image:${slot.key}`)} onChange={(event) => updateImage(language, slot.key, event.target.value)} placeholder={`${slot.label} 图片链接`} />
      <button className="primary"><Upload size={14} /> 上传</button>
      <button className="row-remove" onClick={() => updateImage(language, slot.key, '')} title={`移除${slot.label}`}><X size={15} /></button>
    </div>
  )
  const backgroundImageRow = (language: Language) => (
    <div className="localized-row image-row" key={`${language}-background-image`}>
      <select value={language} disabled><option>{languageLabels[language]}</option></select>
      <input value={selected.content[language].background ?? ''} onFocus={() => onFocusPreviewField(language, 'background')} onChange={(event) => updateContent(language, { background: event.target.value })} placeholder="模块背景图片链接（可选）" />
      <button className="primary"><Upload size={14} /> 上传</button>
      <button className="row-remove" onClick={() => updateContent(language, { background: '' })} title="移除模块背景图片"><X size={15} /></button>
    </div>
  )

  const titleRow = (language: Language) => (
    <div className={`localized-row ${language !== sourceLanguage ? 'with-retranslate' : ''}`} key={`${language}-title`}>
      <select value={language} disabled><option>{languageLabels[language]}</option></select>
      <input value={selected.content[language].title} onFocus={() => onFocusPreviewField(language, 'title')} onChange={(event) => updateContent(language, { title: event.target.value })} placeholder={`${languageLabels[language]} 标题`} />
      {language !== sourceLanguage && <button className="retranslate-button" onClick={() => retranslate(language, 'title', selected.content[sourceLanguage].title, (value) => updateContent(language, { title: value }))}>重译</button>}
      {language !== 'English' && <button className="row-remove" onClick={() => updateContent(language, { title: '' })} title="清空该语言标题"><X size={15} /></button>}
    </div>
  )

  const textRows = (label: string, key: TextConfigKey, multiline = false, required = false) => (
    <section className="localized-field">
      {styledFieldLabel(label, key, required)}
      {languages.map((language) => (
        <div className={`localized-row ${language !== sourceLanguage ? 'with-retranslate' : ''}`} key={`${language}-${key}`}>
          <select value={language} disabled><option>{languageLabels[language]}</option></select>
          {multiline
            ? <textarea value={selected.content[language].config[key] ?? ''} onFocus={() => onFocusPreviewField(language, key)} onChange={(event) => updateConfig(language, key, event.target.value)} placeholder={`${languageLabels[language]} ${label}`} />
          : <input value={selected.content[language].config[key] ?? ''} onFocus={() => onFocusPreviewField(language, key)} onChange={(event) => updateConfig(language, key, event.target.value)} placeholder={`${languageLabels[language]} ${label}`} />}
          {language !== sourceLanguage && <button className="retranslate-button" onClick={() => retranslate(language, label, String(selected.content[sourceLanguage].config[key] ?? ''), (value) => updateConfig(language, key, value))}>重译</button>}
          {language !== 'English' && <button className="row-remove" onClick={() => updateConfig(language, key, '')} title="清空该语言内容"><X size={15} /></button>}
        </div>
      ))}
      {localizedActions(`text-${key}`)}
    </section>
  )

  const linkRows = (label: string, key: TextConfigKey) => (
    <section className="localized-field">
      <div className="localized-field-label">{label}</div>
      {languages.map((language) => (
        <div className="localized-row link-row" key={`${language}-${key}`}>
          <select value={language} disabled><option>{languageLabels[language]}</option></select>
          <input type="url" value={selected.content[language].config[key] ?? ''} onFocus={() => onFocusPreviewField(language, key)} onChange={(event) => updateConfig(language, key, event.target.value)} placeholder="https://" />
          {language !== 'English' && <button className="row-remove" onClick={() => updateConfig(language, key, '')} title="清空该语言链接"><X size={15} /></button>}
        </div>
      ))}
      {localizedActions(`link-${key}`)}
    </section>
  )

  const updatePollOptions = (language: Language, options: PollOption[]) => {
    updateContent(language, { config: { ...selected.content[language].config, pollOptions: options } })
  }
  const pollOptionRows = () => (
    <section className="localized-field">
      {styledFieldLabel('投票选项', 'pollOptions', true, '#934741')}
      {languages.map((language) => {
        const options = selected.content[language].config.pollOptions ?? []
        return <div className="poll-option-editor" key={`${language}-poll-options`}>
          <div className="poll-option-language">{languageLabels[language]}</div>
          {options.map((option, index) => (
            <div className="localized-row" key={`${language}-poll-option-${index}`}>
              <span className="option-order">选项 {index + 1}</span>
              <input value={option.label} onFocus={() => onFocusPreviewField(language, 'pollOptions')} onChange={(event) => updatePollOptions(language, options.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} placeholder="输入选项文案" />
              <div className="clip-image-input"><input value={option.image} onFocus={() => onFocusPreviewField(language, 'pollOptions')} onChange={(event) => updatePollOptions(language, options.map((item, itemIndex) => itemIndex === index ? { ...item, image: event.target.value } : item))} placeholder="选项图片链接（可选）" /><button className="secondary" title="上传投票选项图片"><Upload size={14} /></button></div>
              <button className="row-remove" onClick={() => updatePollOptions(language, options.filter((_, itemIndex) => itemIndex !== index))} title="删除选项"><X size={15} /></button>
            </div>
          ))}
          <button type="button" className="secondary add-option" onClick={() => updatePollOptions(language, [...options, { label: `选项 ${options.length + 1}`, image: '' }])}><Plus size={15} /> 添加选项</button>
        </div>
      })}
      {localizedActions('poll-options')}
    </section>
  )

  const structuredRows = (label: string, key: keyof ModuleConfig, columns: string[]) => (
    <section className="localized-field">
      <div className="localized-field-label with-style-controls"><span><span className="required-mark">*</span>{label}</span><span className="field-style-controls structured-style-controls">{columns.map((column, columnIndex) => {
        const field = `structured:${String(key)}:${columnIndex}` as StyleField
        return <span className="structured-style-control" key={column}><em>{column}</em>{colorControl(field, columnIndex === 0 ? '#2b2624' : '#987c6d')}{fontSizeControl(field)}</span>
      })}</span></div>
      {languages.map((language) => {
        const rows = String(selected.content[language].config[key] ?? '').split('\n').filter(Boolean).map((item) => item.split('｜'))
        const updateRows = (nextRows: string[][]) => updateConfig(language, key, nextRows.map((row) => row.join('｜')).join('\n'))
        return <div className="structured-editor" key={`${language}-${key}`}>
          <div className="structured-head"><b>{languageLabels[language]}</b></div>
          {rows.map((row, rowIndex) => (
            <div className="structured-item" key={`${language}-${key}-${rowIndex}`}>
              <span>{rowIndex + 1}</span>
              {columns.map((column, columnIndex) => {
                const field = `structured:${String(key)}:${columnIndex}` as StyleField
                return <label key={column}>{column}<input value={row[columnIndex] ?? ''} onFocus={() => onFocusPreviewField(language, field)} onChange={(event) => updateRows(rows.map((currentRow, currentIndex) => currentIndex === rowIndex ? currentRow.map((value, valueIndex) => valueIndex === columnIndex ? event.target.value : value) : currentRow))} /></label>
              })}
              <button className="row-remove" onClick={() => updateRows(rows.filter((_, index) => index !== rowIndex))} title="删除条目"><X size={15} /></button>
            </div>
          ))}
          <button className="secondary add-option" onClick={() => updateRows([...rows, columns.map(() => '')])}><Plus size={15} /> 添加条目</button>
        </div>
      })}
      {localizedActions(`structured-${String(key)}`)}
    </section>
  )

  const infoTagRows = () => (
    <section className="localized-field">
      <div className="localized-field-label"><span className="required-mark">*</span>自定义标签</div>
      {languages.map((language) => {
        const tags = selected.content[language].config.infoTags ?? []
        const updateTags = (nextTags: InfoTag[]) => updateContent(language, { config: { ...selected.content[language].config, infoTags: nextTags } })
        const updateTag = (index: number, patch: Partial<InfoTag>) => updateTags(tags.map((tag, tagIndex) => tagIndex === index ? { ...tag, ...patch } : tag))
        return <div className="info-tag-editor" key={`${language}-info-tags`}>
          <div className="structured-head"><b>{languageLabels[language]}</b><span>标签按行、位自动排序</span></div>
          {tags.map((tag, index) => (
            <div className="info-tag-item" key={tag.id}>
              <span>{index + 1}</span>
              <label>标签文案<input value={tag.text} onFocus={() => onFocusPreviewField(language, `tag:${tag.id}`)} onChange={(event) => updateTag(index, { text: event.target.value })} placeholder="输入标签文案" /></label>
              <label>展示行<select value={tag.row} onFocus={() => onFocusPreviewField(language, `tag:${tag.id}`)} onChange={(event) => updateTag(index, { row: Number(event.target.value) })}>{Array.from({ length: 8 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>第 {value} 行</option>)}</select></label>
              <label>展示位<select value={tag.position} onFocus={() => onFocusPreviewField(language, `tag:${tag.id}`)} onChange={(event) => updateTag(index, { position: Number(event.target.value) })}>{Array.from({ length: 8 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>第 {value} 位</option>)}</select></label>
              <label className="tag-color" title="标签颜色"><span>颜色</span><input type="color" value={tag.color} onFocus={() => onFocusPreviewField(language, `tag:${tag.id}`)} onChange={(event) => updateTag(index, { color: event.target.value })} /></label>
              <label>字号<input type="number" min="8" max="48" value={tag.fontSize} onFocus={() => onFocusPreviewField(language, `tag:${tag.id}`)} onChange={(event) => updateTag(index, { fontSize: Math.min(48, Math.max(8, Number(event.target.value || 8))) })} /></label>
              <button className="row-remove" onClick={() => updateTags(tags.filter((_, tagIndex) => tagIndex !== index))} title="删除标签"><X size={15} /></button>
            </div>
          ))}
          <button className="secondary add-option" onClick={() => { infoTagCounter.current += 1; const row = tags.length ? Math.max(...tags.map((tag) => tag.row)) : 1; const position = tags.filter((tag) => tag.row === row).length + 1; updateTags([...tags, { id: `info-tag-${infoTagCounter.current}`, text: '新标签', row, position, color: '#2b2624', fontSize: 12 }]) }}><Plus size={15} /> 添加标签</button>
        </div>
      })}
      {localizedActions('info-tags')}
    </section>
  )

  const clipResourceRows = () => (
    <section className="localized-field">
      {styledFieldLabel('剧情切片列表', 'items', true, '#fff')}
      {languages.map((language) => {
        const content = selected.content[language]
        const names = String(content.config.items ?? '').split('\n').filter(Boolean)
        const links = String(content.config.links ?? '').split('\n').filter(Boolean)
        const rowCount = Math.max(names.length, links.length, 1)
        const resources = Array.from({ length: rowCount }, (_, index) => ({ name: names[index] ?? '', image: content.images?.[`clip-${index + 1}`] ?? '', link: links[index] ?? '' }))
        const updateResources = (nextResources: typeof resources) => {
          const nonClipImages = Object.fromEntries(Object.entries(content.images ?? {}).filter(([key]) => !key.startsWith('clip-')))
          updateContent(language, {
            images: { ...nonClipImages, ...Object.fromEntries(nextResources.map((resource, index) => [`clip-${index + 1}`, resource.image])) },
            config: { ...content.config, items: nextResources.map((resource) => resource.name).join('\n'), links: nextResources.map((resource) => resource.link).join('\n') },
          })
        }
        return <div className="clip-resource-editor" key={`${language}-clip-resources`}>
          <div className="structured-head"><b>{languageLabels[language]}</b></div>
          {resources.map((resource, index) => (
            <div className="clip-resource-item" key={`${language}-clip-${index}`}>
              <span>{index + 1}</span>
              <label>名称<input value={resource.name} onFocus={() => onFocusPreviewField(language, 'items')} onChange={(event) => updateResources(resources.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} placeholder="切片名称" /></label>
              <label>外显预览图<div className="clip-image-input"><input value={resource.image} onFocus={() => onFocusPreviewField(language, `image:clip-${index + 1}`)} onChange={(event) => updateResources(resources.map((item, itemIndex) => itemIndex === index ? { ...item, image: event.target.value } : item))} placeholder="图片链接" /><button className="secondary" title="上传预览图"><Upload size={14} /></button></div></label>
              <label>点击跳转链接<input type="url" value={resource.link} onFocus={() => onFocusPreviewField(language, 'links')} onChange={(event) => updateResources(resources.map((item, itemIndex) => itemIndex === index ? { ...item, link: event.target.value } : item))} placeholder="https://" /></label>
              <button className="row-remove" onClick={() => updateResources(resources.filter((_, itemIndex) => itemIndex !== index))} title="删除切片"><X size={15} /></button>
            </div>
          ))}
          <button className="secondary add-option" onClick={() => updateResources([...resources, { name: language === 'English' ? 'New clip' : '新切片', image: '', link: '' }])}><Plus size={15} /> 添加切片</button>
        </div>
      })}
      {localizedActions('clip-resources')}
    </section>
  )

  const rankingRoleRows = () => (
    <section className="localized-field">
      {styledFieldLabel('排行榜角色', 'items', true, '#fff')}
      {languages.map((language) => {
        const content = selected.content[language]
        const roles = String(content.config.items ?? '').split('\n').filter(Boolean).map((item, index) => {
          const [name = '', noteOne = '', noteTwo = ''] = item.split('｜')
          return {
            name,
            noteOne,
            noteTwo,
            image: content.images?.[`rank-${index + 1}`] ?? '',
            taskBackground: content.images?.[`rank-task-${index + 1}`] ?? '',
          }
        })
        const updateRoles = (nextRoles: typeof roles) => {
          const nonRankingImages = Object.fromEntries(Object.entries(content.images ?? {}).filter(([key]) => !key.startsWith('rank-')))
          updateContent(language, {
            images: {
              ...nonRankingImages,
              ...Object.fromEntries(nextRoles.flatMap((role, index) => [
                [`rank-${index + 1}`, role.image],
                [`rank-task-${index + 1}`, role.taskBackground],
              ])),
            },
            config: { ...content.config, items: nextRoles.map((role) => [role.name, role.noteOne, role.noteTwo].join('｜')).join('\n') },
          })
        }
        return <div className="ranking-role-editor" key={`${language}-ranking-roles`}>
          <div className="structured-head"><b>{languageLabels[language]}</b><span>热力值由前端算法实时计算</span></div>
          {roles.map((role, index) => <div className="ranking-role-item" key={`${language}-rank-${index}`}>
            <span>{index + 1}</span>
            <label>角色名<input value={role.name} onFocus={() => onFocusPreviewField(language, 'items')} onChange={(event) => updateRoles(roles.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} /></label>
            <label>角色图<div className="clip-image-input"><input value={role.image} onFocus={() => onFocusPreviewField(language, `image:rank-${index + 1}`)} onChange={(event) => updateRoles(roles.map((item, itemIndex) => itemIndex === index ? { ...item, image: event.target.value } : item))} placeholder="图片链接" /><button className="secondary" title="上传角色图"><Upload size={14} /></button></div></label>
            <label>助力任务背景图<div className="clip-image-input"><input value={role.taskBackground} onFocus={() => onFocusPreviewField(language, `image:rank-task-${index + 1}`)} onChange={(event) => updateRoles(roles.map((item, itemIndex) => itemIndex === index ? { ...item, taskBackground: event.target.value } : item))} placeholder="图片链接" /><button className="secondary" title="上传助力任务背景图"><Upload size={14} /></button></div></label>
            <label>备注一<input value={role.noteOne} onFocus={() => onFocusPreviewField(language, 'items')} onChange={(event) => updateRoles(roles.map((item, itemIndex) => itemIndex === index ? { ...item, noteOne: event.target.value } : item))} /></label>
            <label>备注二<input value={role.noteTwo} onFocus={() => onFocusPreviewField(language, 'items')} onChange={(event) => updateRoles(roles.map((item, itemIndex) => itemIndex === index ? { ...item, noteTwo: event.target.value } : item))} /></label>
            <button className="row-remove" onClick={() => updateRoles(roles.filter((_, itemIndex) => itemIndex !== index))} title="删除角色"><X size={15} /></button>
          </div>)}
          <button className="secondary add-option" onClick={() => updateRoles([...roles, { name: '', noteOne: '', noteTwo: '', image: '', taskBackground: '' }])}><Plus size={15} /> 添加角色</button>
        </div>
      })}
      {localizedActions('ranking-roles')}
    </section>
  )

  const rankingTaskRows = () => {
    const taskTypes = [
      ['task-1', '任务 1：签到'],
      ['task-2', '任务 2：带话题发帖'],
      ['task-3', '任务 3：去演员圈子讨论'],
      ['task-4', '任务 4：去剧圈子讨论'],
    ] as const
    return <section className="localized-field">
      <div className="localized-field-label"><span className="required-mark">*</span>助力任务列表</div>
      {languages.map((language) => {
        const content = selected.content[language]
        const parsed = String(content.config.tasks ?? '').split('\n').filter(Boolean).map((item, index) => {
          const values = item.split('｜')
          return values[0]?.startsWith('task-') ? { id: values[0], text: values[1] ?? '', reward: values[2] ?? '', link: values[3] ?? '' } : { id: `task-${index + 1}`, text: values[0] ?? '', reward: values[1] ?? '', link: values[2] ?? '' }
        })
        const tasks = taskTypes.map(([id]) => parsed.find((task) => task.id === id) ?? { id, text: '', reward: '', link: '' })
        const updateTasks = (nextTasks: typeof tasks) => updateConfig(language, 'tasks', nextTasks.map((task) => [task.id, task.text, task.reward, task.id === 'task-1' ? '' : task.link].join('｜')).join('\n'))
        return <div className="ranking-task-editor" key={`${language}-ranking-tasks`}>
          <div className="structured-head"><b>{languageLabels[language]}</b><span>预设四个任务，热力奖励由配置决定</span></div>
          {tasks.map((task, index) => <div className="ranking-task-item" key={`${language}-${task.id}`}>
            <span>{index + 1}</span>
            <label>任务类型<select value={task.id} onChange={(event) => updateTasks(tasks.map((item, itemIndex) => itemIndex === index ? { ...item, id: event.target.value } : item))}>{taskTypes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
            <label>外显文案<input value={task.text} onFocus={() => onFocusPreviewField(language, 'tasks')} onChange={(event) => updateTasks(tasks.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item))} /></label>
            <label>热力奖励<input value={task.reward} onFocus={() => onFocusPreviewField(language, 'tasks')} onChange={(event) => updateTasks(tasks.map((item, itemIndex) => itemIndex === index ? { ...item, reward: event.target.value } : item))} /></label>
            {task.id !== 'task-1' && <label>跳转链接<input type="url" value={task.link} onFocus={() => onFocusPreviewField(language, 'tasks')} onChange={(event) => updateTasks(tasks.map((item, itemIndex) => itemIndex === index ? { ...item, link: event.target.value } : item))} placeholder="https://" /></label>}
          </div>)}
        </div>
      })}
      {localizedActions('ranking-tasks')}
    </section>
  }

  const checkinPosterRows = () => (
    <section className="localized-field">
      <div className="localized-field-label">签到海报日历</div>
      {languages.map((language) => {
        const posters = selected.content[language].config.checkinPosters ?? []
        const updatePosters = (nextPosters: CheckinPoster[]) => updateContent(language, { config: { ...selected.content[language].config, checkinPosters: nextPosters } })
        return <div className="clip-resource-editor" key={`${language}-checkin-posters`}>
          <div className="structured-head"><b>{languageLabels[language]}</b><span>日期签到后显示对应海报</span></div>
          {posters.map((poster, index) => <div className="clip-resource-item checkin-poster-item" key={`${language}-checkin-${index}`}>
            <span>{index + 1}</span>
            <label>日期<input value={poster.date} onFocus={() => onFocusPreviewField(language, 'checkinPosters')} onChange={(event) => updatePosters(posters.map((item, itemIndex) => itemIndex === index ? { ...item, date: event.target.value } : item))} placeholder="例如 09" /></label>
            <label>签到海报<div className="clip-image-input"><input value={poster.image} onFocus={() => onFocusPreviewField(language, 'checkinPosters')} onChange={(event) => updatePosters(posters.map((item, itemIndex) => itemIndex === index ? { ...item, image: event.target.value } : item))} placeholder="图片链接" /><button className="secondary" title="上传签到海报"><Upload size={14} /></button></div></label>
            <span />
            <button className="row-remove" onClick={() => updatePosters(posters.filter((_, itemIndex) => itemIndex !== index))} title="删除签到海报"><X size={15} /></button>
          </div>)}
          <button className="secondary add-option" onClick={() => updatePosters([...posters, { date: '', image: '' }])}><Plus size={15} /> 添加海报日期</button>
        </div>
      })}
      {localizedActions('checkin-posters')}
    </section>
  )

  const aggregateImageRows = (kind: 'cast' | 'clips' | 'ranking') => (
    <section className="localized-field">
      <div className="localized-field-label">聚合页背景图</div>
      {languages.map((language) => imageRow(language, { key: `${kind}-aggregate`, label: '聚合页背景' }))}
      {localizedActions(`${kind}-aggregate-images`, true)}
    </section>
  )

  const special = (
    <>
      {selected.kind === 'hero' && <>{textRows('签到按钮文案', 'cta')}{textRows('签到页标题', 'checkinTitle')}{textRows('签到页说明', 'checkinHint')}{checkinPosterRows()}</>}
      {selected.kind === 'info' && <>{textRows('剧集名称', 'name', false, true)}{infoTagRows()}{textRows('剧情简介', 'intro', true)}</>}
      {selected.kind === 'cast' && structuredRows('演员列表', 'items', ['演员名', '角色名'])}
      {selected.kind === 'clips' && clipResourceRows()}
      {selected.kind === 'poll' && <>{textRows('投票题目', 'question', false, true)}{pollOptionRows()}{textRows('投票说明', 'helper')}</>}
      {selected.kind === 'ranking' && <>{rankingRoleRows()}{rankingTaskRows()}{textRows('助力按钮文案', 'cta')}{textRows('完整榜单入口文案', 'moreLabel')}{textRows('完整榜单页标题', 'aggregateTitle')}{aggregateImageRows('ranking')}</>}
      {selected.kind === 'banner' && linkRows('跳转链接', 'ctaLink')}
      {selected.kind === 'topic' && <>{structuredRows('话题列表', 'items', ['话题', '话题说明'])}{textRows('主操作文案', 'cta')}{linkRows('主操作跳转链接', 'ctaLink')}{textRows('次操作文案', 'secondaryCta')}{linkRows('次操作跳转链接', 'secondaryCtaLink')}</>}
      {selected.kind === 'posts' && textRows('展示帖文', 'items', true)}
      {selected.kind === 'voice' && <>{textRows('状态标签', 'status')}{textRows('语聊房列表', 'items', true)}{textRows('在线人数列表', 'helper', true)}</>}
      {selected.kind === 'live' && <>{textRows('状态标签', 'status')}{textRows('直播列表', 'items', true)}{textRows('直播时间列表', 'helper', true)}</>}
    </>
  )

  return (
    <div className="module-form multilingual-form">
      <section className="upload-block multilingual-head">
        <div className="block-label">多语言内容 <span className="multilingual-actions"><button className="ai-upload" onClick={() => flash('已打开多语言文档上传') }><Upload size={14} /> 上传多语言文档</button></span></div>
        <p>所有面向用户展示的图片与文字，均按语言分别配置。</p>
      </section>
      {hasDisplayImage && <section className="localized-field">
        <div className="localized-field-label"><span className="required-mark">*</span>图片</div>
        {selected.kind === 'cast'
          ? imageSlots.cast.map((slot) => imageRow('Chinese', slot, true))
          : languages.flatMap((language) => imageSlots[selected.kind].map((slot) => imageRow(language, slot)))}
        {localizedActions('images', true)}
      </section>}
      <section className="localized-field">
        <div className="localized-field-label">模块背景</div>
        <div className="module-background-color">
          <input value={selected.style.backgroundColor} onFocus={() => onFocusPreviewField(sourceLanguage, 'background')} onChange={(event) => updateBackgroundColor(event.target.value)} />
          <label className="field-color" title="模块背景色"><input type="color" value={selected.style.backgroundColor} onFocus={() => onFocusPreviewField(sourceLanguage, 'background')} onChange={(event) => updateBackgroundColor(event.target.value)} /></label>
        </div>
        <div className="localized-field-note">可同时设置背景色与背景图片，图片覆盖在颜色之上。</div>
        {languages.map(backgroundImageRow)}
        {localizedActions('background-images', true)}
      </section>
      {selected.kind !== 'hero' && <section className="localized-field">
        {styledFieldLabel('标题', 'title', false, selected.titleColor)}
        {languages.map(titleRow)}
        {localizedActions('title')}
      </section>}
      {selected.kind !== 'hero' && <section className="localized-field">
        {styledFieldLabel('副标题', 'subtitle', false, '#9a8174')}
        {languages.map((language) => (
          <div className={`localized-row ${language !== sourceLanguage ? 'with-retranslate' : ''}`} key={`${language}-subtitle`}>
            <select value={language} disabled><option>{languageLabels[language]}</option></select>
            <input value={selected.content[language].subtitle} onFocus={() => onFocusPreviewField(language, 'subtitle')} onChange={(event) => updateContent(language, { subtitle: event.target.value })} placeholder={`${languageLabels[language]} 副标题`} />
            {language !== sourceLanguage && <button className="retranslate-button" onClick={() => retranslate(language, 'subtitle', selected.content[sourceLanguage].subtitle, (value) => updateContent(language, { subtitle: value }))}>重译</button>}
            {language !== 'English' && <button className="row-remove" onClick={() => updateContent(language, { subtitle: '' })} title="清空该语言副标题"><X size={15} /></button>}
          </div>
        ))}
        {localizedActions('subtitle')}
      </section>}
      <div className="field-row">
        <label className="toggle-field">前端展示<span className={`switch ${selected.enabled ? '' : 'off'}`} onClick={() => updateModule({ enabled: !selected.enabled })}><i /></span></label>
      </div>
      <div className="form-divider" />
      {special}
      <section className="module-advanced-condition">
        <span>高级条件：</span>
        <span className="advanced-condition-button">配置高级条件</span>
      </section>
    </div>
  )
}

function PhonePreview({ modules, language, selectedId, onSelectModule, review, state, setState, flash, focus }: {
  modules: PageModule[]
  language: Language
  selectedId: string
  onSelectModule: (id: string) => void
  review: boolean
  state: PreviewState
  setState: (value: PreviewState) => void
  flash: (value: string) => void
  focus: PreviewFocus | null
}) {
  const moduleRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const cast = modules.find((item) => item.kind === 'cast')
  const clips = modules.find((item) => item.kind === 'clips')
  const ranking = modules.find((item) => item.kind === 'ranking')
  const selectedModule = modules.find((item) => item.id === selectedId)
  const isChinese = language === 'Chinese' || language === 'Chinese_yy' || language === 'Cantonese'
  // Preview only reads the selected language. Missing localized data must stay empty.
  const getContent = (module: PageModule | undefined) => module?.content[language]
  const getImage = (module: PageModule | undefined, key: string) => getContent(module)?.images?.[key] ?? ''
  const isFocused = (module: PageModule, field: PreviewFocus['field']) => focus?.moduleId === module.id && focus.language === language && focus.field === field
  const isImageFocused = (module: PageModule) => focus?.moduleId === module.id && focus.language === language && focus.field.startsWith('image:')
  const previewTextStyle = (module: PageModule, field: StyleField, fallback: string) => {
    const style = module.style
    const fontSize = style?.fontSizes[field]
    return { color: style?.textColors[field] ?? fallback, ...(fontSize ? { fontSize: `${fontSize}px` } : {}) }
  }
  const getModuleStyle = (module: PageModule) => {
    const content = getContent(module)
    const primaryAsset = imageSlots[module.kind][0]?.key
    return {
      '--module-bg': module.style.backgroundColor,
      '--module-title': module.style.textColors.title ?? module.titleColor,
      '--module-subtitle': module.style.textColors.subtitle ?? '#9a8174',
      '--module-art': primaryAsset && getImage(module, primaryAsset) ? `url("${getImage(module, primaryAsset)}")` : 'none',
      '--module-background-image': content?.background ? `url("${content.background}")` : 'none',
    } as React.CSSProperties
  }
  const splitLines = (value: string | undefined) => value?.split('\n').filter(Boolean) ?? []
  const castList = splitLines(getContent(cast)?.config.items).map((item) => item.replaceAll('｜', ' · '))
  const clipList = splitLines(getContent(clips)?.config.items)
  const clipLinks = splitLines(getContent(clips)?.config.links)
  const rankingRoles = splitLines(getContent(ranking)?.config.items).map((item, index) => {
    const [name = '', noteOne = '', noteTwo = ''] = item.split('｜')
    return {
      name,
      noteOne,
      noteTwo,
      image: getImage(ranking, `rank-${index + 1}`),
      taskBackground: getImage(ranking, `rank-task-${index + 1}`),
      heat: calculatedHeat(index, language),
    }
  })
  const focusedTaskBackgroundIndex = focus && focus.moduleId === ranking?.id && focus.language === language
    ? Number(focus.field.match(/^image:rank-task-(\d+)$/)?.[1] ?? 0) - 1
    : -1

  useEffect(() => {
    const target = moduleRefs.current[selectedId]
    const scrollContainer = scrollRef.current
    if (!target || !scrollContainer) return

    scrollContainer.scrollTo({
      top: Math.max(0, target.offsetTop - (scrollContainer.clientHeight - target.offsetHeight) / 2),
      behavior: 'smooth',
    })
  }, [selectedId])

  useEffect(() => {
    if (focus?.moduleId === ranking?.id && focus?.field === 'tasks' && !state.rankingOpen) {
      setState({ ...state, rankingOpen: true })
    }
    if (focusedTaskBackgroundIndex >= 0 && !state.rankingOpen) {
      const role = rankingRoles[focusedTaskBackgroundIndex]
      if (role) setState({ ...state, rankingOpen: true, rankingName: role.name, rankingHeat: role.heat, rankingImage: role.image, rankingTaskBackground: role.taskBackground })
    }
  }, [focus, focusedTaskBackgroundIndex, ranking?.id, rankingRoles, setState, state])

  return (
    <div
      className="phone-frame"
      style={{ '--ranking-art': getImage(ranking, 'rank-1') ? `url("${getImage(ranking, 'rank-1')}")` : 'none' } as React.CSSProperties}
    >
      <div className="phone-status"><span>9:41</span><span>● ● ● ▰</span></div>
      <div className="preview-current-module" aria-live="polite">
        <span>正在配置</span>
        <b>{selectedModule ? `${selectedModule.fr} · ${selectedModule.label}` : '未选择模块'}</b>
      </div>
      <div className="h5-scroll" ref={scrollRef}>
        {state.screen === 'cast' ? <OverlayScreen title={isChinese ? '全部演员' : 'All cast'} onClose={() => setState({ ...state, screen: '' })} list={castList} images={castList.map((_, index) => getImage(cast, `cast-${(index % imageSlots.cast.length) + 1}`))} /> : null}
        {state.screen === 'clips' ? <ClipLibraryScreen title={getContent(clips)?.title || ''} onClose={() => setState({ ...state, screen: '' })} clips={clipList.map((name, index) => ({ name, image: getImage(clips, `clip-${index + 1}`), link: clipLinks[index]?.trim() ?? '' }))} /> : null}
        {state.screen === 'ranking' ? <RankingBoard title={getContent(ranking)?.config.aggregateTitle || getContent(ranking)?.title || ''} onClose={() => setState({ ...state, screen: '' })} roles={rankingRoles} background={getImage(ranking, 'ranking-aggregate')} onSelect={(role) => setState({ ...state, screen: '', rankingOpen: true, rankingName: role.name, rankingHeat: role.heat, rankingImage: role.image, rankingTaskBackground: role.taskBackground })} cta={getContent(ranking)?.config.cta ?? ''} /> : null}
        {state.screen === 'checkin' ? <CheckinScreen onClose={() => setState({ ...state, screen: '' })} content={getContent(modules.find((item) => item.kind === 'hero'))!} language={language} /> : null}
        {modules.map((module) => (
          <div
            key={module.id}
            ref={(element) => { moduleRefs.current[module.id] = element }}
            className={`phone-module module-${module.kind} ${module.id === selectedId ? 'active-module' : ''} ${isFocused(module, 'background') ? 'preview-background-highlight' : ''} ${isImageFocused(module) ? 'preview-image-focus' : ''}`}
            style={getModuleStyle(module)}
            onClick={() => onSelectModule(module.id)}
          >
            {module.id === selectedId && <span className="preview-module-marker">当前配置</span>}
            {review && <button className="fr-badge" onClick={(event) => { event.stopPropagation(); onSelectModule(module.id) }}>{module.fr}</button>}
            {module.kind !== 'hero' && (getContent(module)?.title || getContent(module)?.subtitle) && <div className="phone-heading"><span><span className={isFocused(module, 'title') ? 'preview-field-highlight' : ''} style={previewTextStyle(module, 'title', module.titleColor)}>{getContent(module)?.title}</span>{getContent(module)?.subtitle && <small className={isFocused(module, 'subtitle') ? 'preview-field-highlight' : ''} style={previewTextStyle(module, 'subtitle', '#9a8174')}>{getContent(module)?.subtitle}</small>}</span>{(module.kind === 'cast' ? splitLines(getContent(module)?.config.items).length > 4 : module.kind === 'clips' ? splitLines(getContent(module)?.config.items).length > 3 : module.kind === 'ranking') && <button className={isFocused(module, 'moreLabel') ? 'preview-field-highlight' : ''} style={module.kind === 'ranking' ? previewTextStyle(module, 'moreLabel', '#8b807a') : undefined} onClick={(e) => { e.stopPropagation(); setState({ ...state, screen: module.kind === 'cast' ? 'cast' : module.kind === 'clips' ? 'clips' : 'ranking' }) }}>{module.kind === 'ranking' ? getContent(module)?.config.moreLabel : (isChinese ? '更多' : 'More')}</button>}</div>}
            <PhoneModule module={module} content={getContent(module)!} language={language} state={state} setState={setState} flash={flash} focusField={focus?.moduleId === module.id && focus.language === language ? focus.field : null} />
          </div>
        ))}
      </div>
      {state.rankingOpen && <RankingSheet onClose={() => setState({ ...state, rankingOpen: false })} name={state.rankingName} heat={state.rankingHeat} roleImage={state.rankingImage} background={state.rankingTaskBackground} tasks={getContent(ranking)?.config.tasks} language={language} highlightTasks={focus?.moduleId === ranking?.id && focus?.field === 'tasks'} />}
    </div>
  )
}

function PhoneModule({ module, content, language, state, setState, flash, focusField }: { module: PageModule; content: LocalizedContent; language: Language; state: PreviewState; setState: (value: PreviewState) => void; flash: (value: string) => void; focusField: PreviewFocus['field'] | null }) {
  const isChinese = language === 'Chinese' || language === 'Chinese_yy' || language === 'Cantonese'
  const fieldStyle = (field: StyleField, fallback: string) => {
    const fontSize = module.style.fontSizes[field]
    return { color: module.style.textColors[field] ?? fallback, ...(fontSize ? { fontSize: `${fontSize}px` } : {}) }
  }
  const fieldClass = (field: PreviewFocus['field'], className = '') => `${className} ${focusField === field ? 'preview-field-highlight' : ''}`.trim()
  const assetStyle = (key: string) => ({ '--asset-image': content.images?.[key] ? `url("${content.images[key]}")` : 'none' } as React.CSSProperties)
  const splitLines = (value: string | undefined) => value?.split('\n').filter(Boolean) ?? []
  const castEntries = splitLines(content.config.items).map((line) => line.split('｜'))
  const clipEntries = splitLines(content.config.items)
  const clipLinks = splitLines(content.config.links)
  const infoTags = [...(content.config.infoTags ?? [])].sort((left, right) => left.row - right.row || left.position - right.position)
  const rankingEntries = splitLines(content.config.items).map((line) => line.split('｜'))
  const topicEntries = splitLines(content.config.items).map((line) => line.split('｜'))
  const postEntries = splitLines(content.config.items)
  const voiceEntries = splitLines(content.config.items)
  const liveEntries = splitLines(content.config.items)
  const helperEntries = splitLines(content.config.helper)
  const openConfiguredLink = (link: string | undefined, fallback: string) => {
    if (link?.trim()) window.open(link.trim(), '_blank', 'noopener,noreferrer')
    else flash(fallback)
  }
  switch (module.kind) {
    case 'hero':
      return <div className="h5-hero"><div className="hero-brand">HelloTalk.</div><div className="hero-copy"><button className={fieldClass('cta')} style={fieldStyle('cta', '#bd2f2d')} onClick={(e) => { e.stopPropagation(); setState({ ...state, screen: 'checkin' }) }}>{content.config.cta} <ChevronRight size={14} /></button></div></div>
    case 'info':
      return <div className="info-card"><div className={fieldClass('image:poster', 'poster-tile')} style={assetStyle('poster')} /><div className="info-copy"><h2 className={fieldClass('name')} style={fieldStyle('name', '#2b2624')}>{content.config.name}</h2><div className="info-tags">{[...new Set(infoTags.map((tag) => tag.row))].map((row) => <div className="info-tag-row" key={row}>{infoTags.filter((tag) => tag.row === row).map((tag) => <span className={fieldClass(`tag:${tag.id}`, 'info-tag')} style={{ color: tag.color, fontSize: `${tag.fontSize}px` }} key={tag.id}>{tag.text}</span>)}</div>)}</div></div><p className={fieldClass('intro', 'info-intro')} style={fieldStyle('intro', '#564741')}>{content.config.intro}</p></div>
    case 'cast':
      return <div className="cast-strip">{castEntries.slice(0, 4).map(([name, role], i) => <div className="cast-person" key={`${name}-${i}`}><div className={fieldClass(`image:cast-${i + 1}`, 'portrait')} style={assetStyle(`cast-${i + 1}`)} /><b className={fieldClass('structured:items:0')} style={fieldStyle('structured:items:0', '#2b2624')}>{name}</b><span className={fieldClass('structured:items:1')} style={fieldStyle('structured:items:1', '#987c6d')}>{role}</span></div>)}</div>
    case 'clips':
      return <div className="clips-row">{clipEntries.slice(0, 3).map((name, i) => <button className={`${fieldClass(`image:clip-${i + 1}`, 'clip-card')} ${fieldClass('links')}`} style={assetStyle(`clip-${i + 1}`)} key={`${name}-${i}`} onClick={(e) => { e.stopPropagation(); const link = clipLinks[i]?.trim(); if (link) window.open(link, '_blank', 'noopener,noreferrer'); else flash(isChinese ? '请先配置跳转链接' : 'Add a destination link first') }}><b className={fieldClass('items')} style={fieldStyle('items', '#fff')}>{name}</b></button>)}</div>
    case 'poll': {
      const options = content.config.pollOptions ?? []
      const percent = options.length ? `${Math.round(100 / options.length)}%` : ''
      const selectedOption = options[Number(state.vote)]?.label ?? ''
      const voteResult = isChinese ? `已投票支持 ${selectedOption}` : `You supported ${selectedOption}`
      return <div className="poll-box"><p className={fieldClass('question')} style={fieldStyle('question', '#2b2624')}>{content.config.question}</p><div className={`poll-options ${options.length > 2 ? 'stacked' : ''}`}>{options.map((option, index) => <button style={!state.voted ? fieldStyle('pollOptions', '#934741') : undefined} className={`${option.image ? 'with-image' : ''} ${state.voted && state.vote === String(index) ? 'voted' : ''} ${fieldClass('pollOptions')}`} key={`${option.label}-${index}`} onClick={(e) => { e.stopPropagation(); setState({ ...state, voted: true, vote: String(index) }) }}>{option.image && <i style={{ '--option-image': `url("${option.image}")` } as React.CSSProperties} />}<span>{option.label}</span>{state.voted && <b>{percent}</b>}</button>)}</div><small className={state.voted ? 'poll-result' : fieldClass('helper')} style={state.voted ? undefined : fieldStyle('helper', '#a58a80')}>{state.voted ? voteResult : content.config.helper}</small></div>
    }
    case 'ranking':
      return <div className="rank-row">{rankingEntries.slice(0, 3).map(([name, noteOne], i) => <button key={`${name}-${i}`} className={fieldClass(`image:rank-${i + 1}`, `rank-card rank-${i + 1}`)} onClick={(e) => { e.stopPropagation(); setState({ ...state, rankingOpen: true, rankingName: name, rankingHeat: calculatedHeat(i, language), rankingImage: content.images?.[`rank-${i + 1}`] ?? '', rankingTaskBackground: content.images?.[`rank-task-${i + 1}`] ?? '' }) }}><span className="crown">{i + 1}</span><div className="rank-portrait" style={assetStyle(`rank-${i + 1}`)} /><b className={fieldClass('structured:items:0')} style={fieldStyle('structured:items:0', '#fff')}>{name}</b><small className={fieldClass('structured:items:1')} style={fieldStyle('structured:items:1', '#ffdcba')}>{noteOne}</small><em className={fieldClass('cta')} style={fieldStyle('cta', '#fff')}>{content.config.cta}</em></button>)}</div>
    case 'banner':
      return <button className={`${fieldClass('ctaLink', 'blue-banner')}`} style={assetStyle('banner')} aria-label={isChinese ? '打开 Banner 跳转链接' : 'Open banner link'} onClick={(e) => { e.stopPropagation(); openConfiguredLink(content.config.ctaLink, isChinese ? '请先配置跳转链接' : 'Add a destination link first') }} />
    case 'topic':
      return <div className="topic-list">{topicEntries.map(([topic, description], i) => { const link = i === 0 ? content.config.ctaLink : content.config.secondaryCtaLink; return <button key={`${topic}-${i}`} className={fieldClass(i === 0 ? 'ctaLink' : 'secondaryCtaLink')} onClick={(e) => { e.stopPropagation(); openConfiguredLink(link, isChinese ? '请先配置跳转链接' : 'Add a destination link first') }}><span className={fieldClass(`image:topic-${i + 1}`, 'topic-thumb')} style={assetStyle(`topic-${i + 1}`)} /><div><b className={fieldClass('structured:items:0')} style={fieldStyle('structured:items:0', '#2b2624')}>{topic}</b><small className={fieldClass('structured:items:1')} style={fieldStyle('structured:items:1', '#87756b')}>{description}</small></div><em className={fieldClass(i === 0 ? 'cta' : 'secondaryCta')} style={fieldStyle(i === 0 ? 'cta' : 'secondaryCta', '#fff')}>{i === 0 ? content.config.cta : content.config.secondaryCta}</em></button> })}</div>
    case 'posts':
      return <div className="best-posts">{postEntries.slice(0, 2).map((item, i) => <div className={fieldClass(`image:post-${i + 1}`, 'post-tile')} style={assetStyle(`post-${i + 1}`)} key={`${item}-${i}`}><b className={fieldClass('items')} style={fieldStyle('items', '#fff')}>{item}</b></div>)}</div>
    case 'voice':
      return <div className="voice-row">{voiceEntries.slice(0, 2).map((item, i) => <div className={`voice-card ${i ? 'alt' : ''}`} key={`${item}-${i}`}><span className={fieldClass('status')} style={fieldStyle('status', '#fff')}>{content.config.status}</span><b className={fieldClass('items')} style={fieldStyle('items', '#fff')}>{item}</b><small className={fieldClass('helper')} style={fieldStyle('helper', '#fff')}>{helperEntries[i]}</small></div>)}</div>
    case 'live':
      return <div className="live-row">{liveEntries.slice(0, 2).map((item, i) => <div className={fieldClass(`image:live-${i + 1}`, 'live-card')} style={assetStyle(`live-${i + 1}`)} key={`${item}-${i}`}><em className={fieldClass('status')} style={fieldStyle('status', '#fff')}>{content.config.status}</em><b className={fieldClass('items')} style={fieldStyle('items', '#fff')}>{item}</b><span className={fieldClass('helper')} style={fieldStyle('helper', '#fff')}>{helperEntries[i]}</span></div>)}</div>
  }
}

function CheckinScreen({ onClose, content, language }: { onClose: () => void; content: LocalizedContent; language: Language }) {
  const [checked, setChecked] = useState(false)
  const isChinese = language === 'Chinese' || language === 'Chinese_yy' || language === 'Cantonese'
  const posters = content.config.checkinPosters ?? []
  return <div className="h5-overlay checkin-screen"><header><button onClick={onClose} aria-label={isChinese ? '关闭签到日历' : 'Close check-in calendar'}><ChevronLeft size={23} /></button><b>{content.config.checkinTitle}</b><span /></header><div className="checkin-calendar"><p>{content.config.checkinHint}</p><div className="calendar-month">2026 年 8 月</div><div className="calendar-week"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div><div className="calendar-grid">{Array.from({ length: 21 }, (_, index) => { const day = String(index + 1).padStart(2, '0'); const poster = posters.find((item) => item.date === day); return <div className={`calendar-day ${poster ? 'has-poster' : ''} ${checked && poster ? 'unlocked' : ''}`} key={day}>{poster ? <><span>{day}</span><i style={{ '--calendar-poster': `url("${poster.image}")` } as React.CSSProperties} /></> : <span>{day}</span>}</div> })}</div><button className={`checkin-confirm ${checked ? 'done' : ''}`} onClick={() => setChecked(true)}>{checked ? (isChinese ? '已签到' : 'Checked in') : (content.config.cta || (isChinese ? '签到' : 'Check in'))}</button></div></div>
}

function RankingBoard({ title, onClose, roles, background, onSelect, cta }: { title: string; onClose: () => void; roles: Array<{ name: string; noteOne: string; noteTwo: string; image: string; taskBackground: string; heat: string }>; background: string; onSelect: (role: { name: string; image: string; taskBackground: string; heat: string }) => void; cta: string }) {
  const podium = roles.slice(0, 3)
  return <div className="h5-overlay ranking-board"><header><button onClick={onClose} aria-label="关闭完整榜单"><ChevronLeft size={23} /></button><b>{title}</b><span /></header><div className="ranking-board-hero" style={{ '--ranking-board-background': background ? `url("${background}")` : 'none' } as React.CSSProperties}><strong>{title}</strong><span>实时更新</span></div><div className="ranking-podium">{podium.map((role, index) => <button key={`${role.name}-${index}`} onClick={() => onSelect(role)}><i style={{ '--podium-image': `url("${role.image}")` } as React.CSSProperties} /><em>{index + 1}</em><b>{role.name}</b><small>{role.noteOne}</small><small>{role.noteTwo}</small><span>{role.heat}</span><strong>{cta}</strong></button>)}</div><div className="ranking-list">{roles.slice(3).map((role, index) => <button key={`${role.name}-${index + 3}`} onClick={() => onSelect(role)}><i style={{ '--podium-image': `url("${role.image}")` } as React.CSSProperties} /><b>{index + 4}</b><div><strong>{role.name}</strong><small>{role.noteOne}</small><small>{role.noteTwo}</small></div><em>{role.heat}</em><span>{cta}</span></button>)}</div></div>
}

function RankingSheet({ onClose, name, heat, roleImage, background, tasks, language, highlightTasks }: { onClose: () => void; name: string; heat: string; roleImage: string; background: string; tasks: string | undefined; language: Language; highlightTasks: boolean }) {
  const [checkedIn, setCheckedIn] = useState(false)
  const isChinese = language === 'Chinese' || language === 'Chinese_yy' || language === 'Cantonese'
  const taskEntries = (tasks?.split('\n').filter(Boolean) ?? []).map((item, index) => {
    const values = item.split('｜')
    return values[0]?.startsWith('task-') ? [values[0], values[1] ?? '', values[2] ?? '', values[3] ?? ''] : [`task-${index + 1}`, values[0] ?? '', values[1] ?? '', values[2] ?? '']
  })
  const copy = isChinese
    ? { close: '关闭榜单任务', support: '助力', character: '角色', current: '当前角色热力值', total: '个人累计贡献', rank: '个人贡献排名', heading: '完成任务，为他增加热力值', checkIn: '签到', checkedIn: '已签到', complete: '去完成' }
    : { close: 'Close ranking tasks', support: 'Support', character: 'character', current: 'Current popularity', total: 'Your total contribution', rank: 'Your contribution rank', heading: 'Complete tasks to add popularity', checkIn: 'Check in', checkedIn: 'Checked in', complete: 'Complete' }
  return <div className="phone-sheet"><div className="sheet-scrim" onClick={onClose} /><div className="sheet-content task-sheet-content" style={{ '--task-sheet-background': background ? `url("${background}")` : 'none', '--task-role-image': roleImage ? `url("${roleImage}")` : 'none' } as React.CSSProperties}><button className="sheet-close" onClick={onClose} aria-label={copy.close}><X size={18} /></button><div className="sheet-profile"><div className="small-rank-face" /><div><b>{copy.support} {name || copy.character}</b><span>{copy.current} {heat || '0'}</span></div></div><div className="task-sheet-card"><div className="contribution"><div><span>{copy.total}</span><b>180</b></div><div><span>{copy.rank}</span><b>NO. 125</b></div></div><h3>{copy.heading}</h3>{taskEntries.map(([id, task, reward, link], i) => <div className={`task-row ${highlightTasks ? 'preview-field-highlight' : ''}`} key={`${id}-${i}`}><span className={`task-icon ti${(i % 4) + 1}`}>{i + 1}</span><b>{task}</b><em>{reward || '+0'}</em><button className={`task-action ${id === 'task-1' && checkedIn ? 'done' : ''}`} onClick={() => { if (id === 'task-1') { setCheckedIn(true); return } if (link?.trim()) window.open(link.trim(), '_blank', 'noopener,noreferrer') }} disabled={id === 'task-1' && checkedIn}>{id === 'task-1' ? (checkedIn ? copy.checkedIn : copy.checkIn) : copy.complete}</button></div>)}</div></div></div>
}

function OverlayScreen({ title, list, onClose, images, links = [], background = '' }: { title: string; list: string[]; onClose: () => void; images: string[]; links?: string[]; background?: string }) {
  return <div className="h5-overlay" style={{ '--overlay-background': background ? `url("${background}")` : 'none' } as React.CSSProperties}><header><button onClick={onClose}><ChevronLeft size={23} /></button><b>{title}</b><span /></header><div className="overlay-list">{list.map((item, index) => {
    const link = links[index]?.trim()
    const row = <><div className="overlay-art" style={{ '--asset-image': images[index] ? `url("${images[index]}")` : 'none' } as React.CSSProperties} /><span><b>{item}</b></span><ChevronRight size={17} /></>
    return link ? <button className="overlay-resource" key={`${item}-${index}`} onClick={() => window.open(link, '_blank', 'noopener,noreferrer')}>{row}</button> : <div key={`${item}-${index}`}>{row}</div>
  })}</div></div>
}

function ClipLibraryScreen({ title, clips, onClose }: { title: string; clips: Array<{ name: string; image: string; link: string }>; onClose: () => void }) {
  return <div className="h5-overlay clip-library"><header><button onClick={onClose}><ChevronLeft size={23} /></button><b>{title}</b><span /></header><div className="clip-library-grid">{clips.map((clip, index) => <button key={`${clip.name}-${index}`} onClick={() => { if (clip.link) window.open(clip.link, '_blank', 'noopener,noreferrer') }}><i style={{ '--clip-library-image': clip.image ? `url("${clip.image}")` : 'none' } as React.CSSProperties} /><b>{clip.name}</b></button>)}</div></div>
}

function ReviewRules({ modules, selectedId, onSelect }: { modules: PageModule[]; selectedId: string; onSelect: (id: string) => void }) {
  const ruleRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  useEffect(() => {
    ruleRefs.current[selectedId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedId])

  return <aside className="review-rules"><b>需求追踪</b>{modules.map((item) => <button ref={(element) => { ruleRefs.current[item.id] = element }} className={item.id === selectedId ? 'active' : ''} key={item.id} onClick={() => onSelect(item.id)}><span>{item.fr}</span>{item.label}<i /></button>)}</aside>
}

function LanguageDialog({ selected, onToggle, onClose, onConfirm }: {
  selected: Language[]
  onToggle: (language: Language) => void
  onClose: () => void
  onConfirm: () => void
}) {
  const allSelected = allLanguages.every((language) => selected.includes(language))
  const toggleAll = () => {
    allLanguages.forEach((language) => {
      if (language === 'English') return
      const currentlySelected = selected.includes(language)
      if (allSelected ? currentlySelected : !currentlySelected) onToggle(language)
    })
  }
  return (
    <div className="dialog-overlay" role="presentation">
      <section className="language-dialog" role="dialog" aria-modal="true" aria-labelledby="language-dialog-title">
        <header>
          <h2 id="language-dialog-title">添加语言</h2>
          <button className="dialog-close" onClick={onClose} aria-label="关闭"><X size={19} /></button>
        </header>
        <div className="language-dialog-note">
          <span>选择内容语言后，所有用户端图片与文字都会增加对应的语言配置行。</span>
          <button onClick={toggleAll}>{allSelected ? '取消全选' : '全选'}</button>
        </div>
        <div className="language-grid">
          {allLanguages.map((language) => {
            const required = language === 'English'
            const active = selected.includes(language)
            return (
              <button
                key={language}
                className={active ? 'selected' : ''}
                disabled={required}
                onClick={() => onToggle(language)}
              >
                <span>{languageLabels[language]}</span>
                {active && <Check size={15} />}
              </button>
            )
          })}
        </div>
        <footer><button className="secondary" onClick={onClose}>取消</button><button className="primary" onClick={onConfirm}>确定</button></footer>
      </section>
    </div>
  )
}

export default App
