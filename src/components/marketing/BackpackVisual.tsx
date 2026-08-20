import Image from 'next/image'

export function BackpackVisual() {
  return (
    <div className="landing-backpack-visual landing-backpack-visual--hero">
      <div className="landing-backpack-image-wrap">
        <Image
          src="/carryos-backpack.png"
          alt="A backpack ready for the day ahead"
          className="landing-backpack-image"
          width={1465}
          height={1024}
          priority
        />
      </div>
    </div>
  )
}
