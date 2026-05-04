// 这个类型描述品牌印记入参，入参用于控制尺寸和额外样式。
interface BrandMarkProps {
  // 尺寸类型，用于在导航、页脚和工作台里保持比例统一。
  size?: 'small' | 'normal' | 'large'
  // 额外样式类名。
  className?: string
}

// 这个对象保存不同尺寸的样式，返回值用于控制纯代码印记大小。
const sizeClass = {
  small: 'h-10 w-10 text-[0.82rem]',
  normal: 'h-12 w-12 text-[0.95rem]',
  large: 'h-16 w-16 text-[1.12rem]'
}

// 这个数组保存朱印里的四个字，返回值用于把单字印记升级成更接近设计图的方形门派印。
const sealCharacters = ['问', '云', '派', '印']

// 这个函数渲染纯代码“问云派印”朱印，入参是尺寸和样式，返回值是不依赖旧图片素材的品牌标识。
export function BrandMark({ size = 'normal', className = '' }: BrandMarkProps) {
  return (
    <span
      aria-label="问云派朱印"
      className={`brand-mark grid shrink-0 grid-cols-2 place-items-center rounded-lg border font-bold text-white shadow-md ${sizeClass[size]} ${className}`}
      role="img"
    >
      {/* 这里逐字绘制朱印，方便后续替换门派文字时只改上方数组。 */}
      {sealCharacters.map((character) => (
        <span className="brand-mark-character" key={character}>
          {character}
        </span>
      ))}
    </span>
  )
}
