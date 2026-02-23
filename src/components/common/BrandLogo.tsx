import logoImage from '../../assets/logo/7D-Design.png'

type BrandLogoProps = {
  className?: string
  alt?: string
}

const BrandLogo = ({ className = 'h-10 w-auto', alt = '7D Admin Portal' }: BrandLogoProps) => (
  <img src={logoImage} alt={alt} className={className} />
)

export default BrandLogo
