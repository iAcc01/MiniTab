const bannerData = [
  {
    id: 1,
    title: "发现更多精彩网站",
    subtitle: "探索互联网中的宝藏资源",
    gradient: "from-[#1C1C1C] to-[#3a3a3a]",
  },
  {
    id: 2,
    title: "AI 工具合集",
    subtitle: "最新最全的 AI 工具推荐",
    gradient: "from-[#2d1b69] to-[#11998e]",
  },
  {
    id: 3,
    title: "开发者必备",
    subtitle: "提升效率的开发工具精选",
    gradient: "from-[#0f2027] to-[#2c5364]",
  },
]

export function CarouselBanner() {
  return (
    <div className="flex gap-4 mt-6">
      {bannerData.map((item) => (
        <div
          key={item.id}
          className={`flex-1 min-w-0 h-[160px] rounded-xl bg-gradient-to-br ${item.gradient} flex flex-col justify-end p-5 cursor-pointer hover:scale-[1.02] transition-transform duration-300`}
        >
          <h3 className="text-white text-lg font-semibold">{item.title}</h3>
          <p className="text-white/70 text-sm mt-1">{item.subtitle}</p>
        </div>
      ))}
    </div>
  )
}
