import Image from 'next/image';

// Aspect ratios (width / height) of the SVG files in /public
const RATIO = { mark: 660 / 626, horizontal: 3369 / 626, stacked: 1175 / 822 };
const FILE = { mark: 'logo-mark', horizontal: 'logo-horizontal', stacked: 'logo-full' };

/**
 * variant:   'mark'       -> icon only (no name)
 *            'horizontal' -> icon + "CollegesHub" side by side (headers, footers)
 *            'stacked'    -> icon above the name (hero, CTA, login screens)
 * dark:      use the reversed version for dark / navy backgrounds
 * decorative: pass true when the logo sits next to the brand name in text (empty alt)
 * Every file has a transparent background.
 */
export default function BrandLogo({
  variant = 'horizontal',
  height = 40,
  dark = false,
  priority = false,
  decorative = false,
  alt = 'CollegesHub',
  className = '',
}) {
  const width = Math.round(height * RATIO[variant]);
  const src = `/${FILE[variant]}${dark && variant !== 'mark' ? '-dark' : ''}.svg`;
  return (
    <Image
      src={src}
      alt={decorative ? '' : alt}
      width={width}
      height={height}
      priority={priority}
      className={`object-contain ${className}`}
      style={{ height, width: 'auto' }}
    />
  );
}